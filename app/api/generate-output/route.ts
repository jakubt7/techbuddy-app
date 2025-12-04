import { execFile } from "child_process";
import { NextRequest } from "next/server";
import { promisify } from "util";
import { RunEventType, RunOpts } from "@gptscript-ai/gptscript";
import gpt from "@/lib/gptScriptInstance";

const script = "app/api/generate-output/tech-solution.gpt";
const execFileAsync = promisify(execFile);
let binaryCheckPromise: Promise<void> | null = null;

async function ensureGptscriptBinary() {
  if (binaryCheckPromise) {
    return binaryCheckPromise;
  }

  const binaryPath = process.env.GPTSCRIPT_BIN;
  if (!binaryPath) {
    throw new Error("GPTSCRIPT_BIN is not set");
  }

  binaryCheckPromise = execFileAsync(binaryPath, ["--version"], {
    timeout: 10_000,
  })
    .then(({ stdout, stderr }) => {
      if (stdout) {
        console.log("[generate-output] gptscript --version stdout:", stdout);
      }
      if (stderr) {
        console.warn("[generate-output] gptscript --version stderr:", stderr);
      }
    })
    .catch((error) => {
      binaryCheckPromise = null;
      throw error;
    });

  return binaryCheckPromise;
}

export const runtime = "nodejs";
export const maxDuration = 60;

const quoteArg = (value: string | number) => {
  const normalized =
    typeof value === "number" ? value.toString() : String(value);
  const escaped = normalized.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
};

export async function POST(request: NextRequest) {
  let body: { solution?: unknown; outputLength?: unknown };

  try {
    await ensureGptscriptBinary();

    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: "Received malformed JSON. Please try again.",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const { solution, outputLength } = body;

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "Server missing OpenAI credentials. Set OPENAI_API_KEY and redeploy.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  if (typeof solution !== "string" || !solution.trim()) {
    return new Response(
      JSON.stringify({ error: "Please describe your problem first." }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  if (
    typeof outputLength !== "number" ||
    Number.isNaN(outputLength) ||
    outputLength <= 0
  ) {
    return new Response(
      JSON.stringify({ error: "Please select how long the solution should be." }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  const opts: RunOpts = {
    disableCache: true,
    input: `--solution ${quoteArg(solution)} --outputLength ${quoteArg(outputLength)}`,
  };

  const isDebug = process.env.NODE_ENV !== "production";

  try {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (payload: unknown) => {
          if (isDebug) {
            console.log("[generate-output] event ->", payload);
          }
          controller.enqueue(
            encoder.encode(`event: ${JSON.stringify(payload)}\n\n`)
          );
        };

        try {
          // Send a quick heartbeat so Vercel keeps the stream open while we start the run.
          sendEvent({ type: "init", message: "Starting TechBuddy generator..." });

          if (isDebug) {
            console.log("[generate-output] starting run", {
              solution,
              outputLength,
              input: opts.input,
              gptscriptBin: process.env.GPTSCRIPT_BIN,
            });
          }

          const run = await gpt.run(script, opts);

          run.on(RunEventType.Event, (data) => {
            sendEvent(data);
          });

          run
            .text()
            .then((output) => {
              sendEvent({
                type: "solution",
                output,
              });
              controller.close();
            })
            .catch((error) => {
              console.error("Run error", error);
              sendEvent({
                type: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Unexpected error generating solution",
              });
              controller.close();
            });
        } catch (error) {
          console.error("Error creating run", error);
          sendEvent({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Unexpected error creating run",
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
