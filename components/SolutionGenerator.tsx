"use client";

import { useState } from "react";
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

const solutionPath = "public/solutions";

const SolutionGenerator = () => {
  const [solution, setSolution] = useState<string>("");
  const [progress, setProgress] = useState("");
  const [outputLength, setOutputLength] = useState<number>();
  const [outputStart, setOutputStart] = useState<boolean>(false);
  const [outputFinish, setOutputFinish] = useState<boolean | null>(null);
  const [currentTool, setCurrentTool] = useState("");
  const [events, setEvents] = useState<Frame[]>([]);

  async function generateOutput() {
    setOutputStart(true);
    setOutputFinish(false);

    const response = await fetch("/api/generate-output", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ solution, outputLength, path: solutionPath }),
    });

    if (response.ok && response.body) {
      console.log("Generator has started");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      handleStream(reader, decoder);
    } else {
      setOutputStart(false);
      setOutputFinish(true);
      const errorData = await response.json();
      console.error("Failed to generate a solution:", errorData.error);
    }
  }

  async function handleStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder
  ) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const streamDecode = decoder.decode(value, { stream: true });

      const eventData = streamDecode
        .split("\n\n")
        .filter((line) => line.startsWith("event: "))
        .map((line) => line.replace(/^event: /, ""));

      eventData.forEach((data) => {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.type === "callProgress") {
            setProgress(
              parsedData.output[parsedData.output.length - 1].content
            );
            setCurrentTool(parsedData.tool?.description || "");
          } else if (parsedData.type === "callStart") {
            setCurrentTool(parsedData.tool?.description || "");
          } else if (parsedData.type === "runFinish") {
            setOutputFinish(true);
            setOutputStart(false);
          } else {
            setEvents((prevEvents) => [...prevEvents, parsedData]);
          }
        } catch (error) {
          console.error("Failed to parse JSON", error);
        }
      });
    }
  }

  return (
    <div className="container flex flex-col">
      <section className="flex-1 flex flex-col border border-slate-700 rounded-md p-10 space-y-3">
        <Textarea
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          className="flex-1 text-black"
          placeholder="What tools could I use to quickly build a website for my company..."
        />

        <Select onValueChange={(value) => setOutputLength(parseInt(value))}>
          <SelectTrigger>
            <SelectValue placeholder="How long should the solution for your problem be?" />
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
          Generate a solution
        </Button>
      </section>

      <section className="pb-5 mt-5 flex-1">
        <div className="flex flex-col-reverse w-full space-y-1 text-gray-200 font-mono p-10 h-96 overflow-y-scroll bg-gray-800 rounded-md">
          <div>
            {outputFinish === null && (
              <>
                <p className="animate-pulse mr-5">
                  Ready to generate your solution...
                </p>
              </>
            )}

            <span className="mr-5">{">>"}</span>
            {progress}
          </div>

          <div>
            {/* Rendering */}
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
    </div>
  );
};

export default SolutionGenerator;
