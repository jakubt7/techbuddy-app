"use client";

import { useEffect, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Frame } from "@gptscript-ai/gptscript";
import renderEventMessage from "@/lib/renderEventMessage";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Solution from "@/components/ui/Solution";
import { Solution as SolutionType } from "@/app/types/solutions";

const STORAGE_KEY = "techbuddy:solutions";
const DEFAULT_SELECT_LABEL =
  "How long should the solution for your problem be?";

const SolutionGenerator = () => {
  const [solution, setSolution] = useState<string>("");
  const [progress, setProgress] = useState("");
  const [outputLength, setOutputLength] = useState<number>();
  const [outputStart, setOutputStart] = useState<boolean>(false);
  const [outputFinish, setOutputFinish] = useState<boolean | null>(null);
  const [currentTool, setCurrentTool] = useState("");
  const [events, setEvents] = useState<Frame[]>([]);
  const [latestSolution, setLatestSolution] = useState<SolutionType | null>(
    null
  );
  const [storedSolutions, setStoredSolutions] = useState<SolutionType[]>([]);
  const router = useRouter();
  const eventBufferRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedSolutions = window.localStorage.getItem(STORAGE_KEY);
    if (savedSolutions) {
      try {
        const parsed: SolutionType[] = JSON.parse(savedSolutions);
        setStoredSolutions(parsed);
        setLatestSolution(parsed[0] ?? null);
      } catch (error) {
        console.error("Failed to parse saved solutions", error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedSolutions));
  }, [storedSolutions]);

  const hasGeneratedSolutions =
    storedSolutions.length > 0 || latestSolution !== null;

  async function generateOutput() {
    setOutputStart(true);
    setOutputFinish(false);
    setEvents([]);
    setProgress("");
    setCurrentTool("");

    let response: Response;

    try {
      response = await fetch("/api/generate-output", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ solution, outputLength }),
      });
    } catch (error) {
      console.error("Failed to reach generator", error);
      toast.error("Network error while reaching TechBuddy. Try again.");
      setOutputStart(false);
      setOutputFinish(true);
      return;
    }

    if (response.ok && response.body) {
      console.log("Generator has started");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      handleStream(reader, decoder);
    } else {
      setOutputStart(false);
      setOutputFinish(true);
      let errorMessage = `Failed to generate a solution (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData?.error) {
          errorMessage = errorData.error;
        }
      } catch {
        try {
          const text = await response.text();
          if (text) {
            errorMessage = text;
          }
        } catch {
          // ignore parsing issues, keep fallback message
        }
      }
      toast.error(errorMessage);
      console.error("Failed to generate a solution:", errorMessage);
    }
  }

  const isDev = process.env.NODE_ENV !== "production";

  async function handleStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder
  ) {
    while (true) {
      const { done, value } = await reader.read();
      if (value) {
        eventBufferRef.current += decoder.decode(value, { stream: true });
        processEventBuffer();
      }
      if (done) {
        eventBufferRef.current += decoder.decode();
        processEventBuffer();
        eventBufferRef.current = "";
        break;
      }
    }
  }

  function processEventBuffer() {
    const events = eventBufferRef.current.split("\n\n");
    eventBufferRef.current = events.pop() ?? "";

    events.forEach((chunk) => {
      const sanitized = chunk.replace(/^event:\s*/, "").trim();
      if (isDev) {
        console.log("[SolutionGenerator] raw event chunk:", sanitized);
      }
      if (!sanitized) {
        return;
      }

        try {
          const parsedData = JSON.parse(sanitized);
          if (isDev) {
            console.log("[SolutionGenerator] parsed event:", parsedData);
          }
          if (parsedData.type === "callProgress") {
            const latest = parsedData.output?.[parsedData.output.length - 1];
            if (latest?.content) {
              setProgress(latest.content);
            }
            setCurrentTool(parsedData.tool?.description || "");
          } else if (parsedData.type === "callStart") {
            setCurrentTool(parsedData.tool?.description || "");
          } else if (parsedData.type === "runFinish") {
            setOutputFinish(true);
            setOutputStart(false);
          } else if (parsedData.type === "error") {
            setOutputStart(false);
            setOutputFinish(true);
            toast.error(
              parsedData.message ||
                "We hit a snag while generating your solution."
            );
          } else if (parsedData.type === "solution") {
            try {
              const payload = JSON.parse(parsedData.output);
              const newSolution: SolutionType = {
                id: crypto.randomUUID(),
              title: payload.title || solution,
              prompt: solution,
              content: payload.content || "",
              length: outputLength || 0,
              createdAt: new Date().toISOString(),
            };

            setLatestSolution(newSolution);
            setStoredSolutions((prev) => [newSolution, ...prev]);
          } catch (error) {
            console.error("Failed to parse solution payload", error);
          }
        } else {
          setEvents((prevEvents) => [...prevEvents, parsedData]);
        }
      } catch (error) {
        console.error("Failed to parse JSON", error);
      }
    });
  }

  useEffect(() => {
    if (outputFinish && latestSolution) {
      toast.success("Solution generated successfuly"),
        {
          action: (
            <Button
              onClick={() => router.push("/solutions")}
              className="bg-slate-600 ml-auto"
            >
              View Solutions
            </Button>
          ),
        };
    }
  }, [latestSolution, outputFinish, router]);

  return (
    <div className="container flex flex-col gap-6">
      <section className="flex flex-col border border-slate-700 rounded-md p-8 space-y-4 bg-white">
        <Textarea
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          className="flex-1 text-black"
          placeholder="What tools could I use to quickly build a website for my company..."
        />

        <Select onValueChange={(value) => setOutputLength(parseInt(value))}>
          <SelectTrigger>
            <SelectValue placeholder={DEFAULT_SELECT_LABEL} />
          </SelectTrigger>

          <SelectContent className="w-full">
            {Array.from({ length: 5 }, (_, i) => (
              <SelectItem key={i} value={String((i + 1) * 200)}>
                {(i + 1) * 200}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          disabled={!solution || !outputLength || outputStart}
          className="w-full"
          size="lg"
          onClick={generateOutput}
        >
          {outputStart ? "Generating..." : "Generate a solution"}
        </Button>
      </section>

      <section className="w-full min-h-[360px]">
        {latestSolution ? (
          <Solution solution={latestSolution} />
        ) : (
          <div className="w-full border border-dashed border-slate-300 rounded-md flex flex-col justify-center items-center text-center p-8 bg-slate-50">
            <p className="text-lg font-semibold text-gray-700">
              Your generated solution will appear here
            </p>
            <p className="text-gray-500 text-sm mt-2 max-w-xl">
              After TechBuddy finishes, the latest response is saved to your
              browser so you can revisit it later.
            </p>
          </div>
        )}
      </section>

      <section className="w-full pb-5 flex flex-col bg-gray-900 rounded-md">
        <div className="p-4 border-b border-gray-800 text-sm text-gray-400">
          Live run feed
        </div>
        <div className="flex flex-col-reverse w-full space-y-1 text-gray-200 font-mono p-6 h-96 overflow-y-scroll">
          <div>
            {outputFinish === null && (
              <p className="animate-pulse mr-5">
                Ready to generate your solution...
              </p>
            )}

            {(progress || outputStart) && (
              <>
                <span className="mr-5">{">>"}</span>
                {progress}
              </>
            )}
          </div>

          <div>
            <div className="space-y-5">
              {events.map((event, index) => (
                <div key={index}>
                  <span className="mr-5">{">>"}</span>
                  {renderEventMessage(event)}
                </div>
              ))}
            </div>

            {currentTool && (
              <div className="py-10">
                <span className="mr-5">{"--- [Current Tool] ---"}</span>
                {currentTool}
              </div>
            )}

            {outputStart && (
              <div>
                <span className="animate-in mr-5">
                  {"--- [TechBuddy is coming up with an answer!] ---"}
                </span>
                <br />
              </div>
            )}
          </div>
        </div>
      </section>

      {hasGeneratedSolutions && (
        <p className="text-center text-sm text-gray-500">
          Previous solutions stay on this device. View them any time on the{" "}
          <button
            type="button"
            onClick={() => router.push("/solutions")}
            className="underline font-medium"
          >
            Solutions page.
          </button>
        </p>
      )}
    </div>
  );
};

export default SolutionGenerator;
