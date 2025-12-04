"use client";

import { useEffect, useState } from "react";
import { BookOpen, Bot } from "lucide-react";
import SolutionCard from "@/components/ui/Solution";
import { Solution } from "@/app/types/solutions";

const STORAGE_KEY = "techbuddy:solutions";

function Solutions() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [activeSolution, setActiveSolution] = useState<Solution | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: Solution[] = JSON.parse(saved);
        setSolutions(parsed);
        setActiveSolution(parsed[0] ?? null);
      } catch (error) {
        console.error("Failed to parse stored solutions", error);
      }
    }
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your saved solutions</h1>
          <p className="text-gray-500">
            Stored locally in your browser. Generate a new solution from the
            home page to add more entries.
          </p>
        </div>

        <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-md">
          <BookOpen className="w-4 h-4 mr-2" />
          Only you can see these results — nothing ever leaves your device.
        </div>
      </div>

      {solutions.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-lg p-10 text-center text-gray-600">
          No solutions saved yet. Ask TechBuddy for help on the homepage to see
          them here.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {solutions.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSolution(item)}
              className={`border rounded-lg p-4 flex flex-col items-start text-left hover:shadow-md transition ${
                activeSolution?.id === item.id
                  ? "border-slate-800"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <Bot className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-sm text-gray-500 mb-2">
                {new Date(item.createdAt).toLocaleString()}
              </p>
              <p className="text-gray-700 overflow-hidden text-ellipsis max-h-24">
                {item.content.slice(0, 200)}
                {item.content.length > 200 && "..."}
              </p>
            </button>
          ))}
        </div>
      )}

      {activeSolution && (
        <div className="border border-slate-200 rounded-lg">
          <SolutionCard solution={activeSolution} />
        </div>
      )}
    </div>
  );
}

export default Solutions;
