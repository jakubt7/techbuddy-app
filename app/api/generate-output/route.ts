import { NextRequest } from "next/server";
import { RunEventType, RunOpts } from "@gptscript-ai/gptscript";
import gpt from "@/lib/gptScriptInstance";

const script = "app/api/generate-output/tech-solution.gpt";

export async function POST(request: NextRequest) {
  const { solution, outputLength, path } = await request.json();

  const opts: RunOpts = {
    disableCache: true,
    input: `--solution ${solution} --outputLength ${outputLength} --path ${path}`,
  };

  try {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const run = await gpt.run(script, opts);

          run.on(RunEventType.Event, (data) => {
            controller.enqueue(
              encoder.encode(`event: ${JSON.stringify(data)} \n \n`)
            );
          });

          await run.text();
          controller.close();
        } catch (error) {
          controller.error(error);
          console.error("Error", error);
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
    return new Response(JSON.stringify({ error: error }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
