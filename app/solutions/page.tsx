import { getAllSolutions } from "@/lib/getAllSolutions";
import { Solution } from "../types/solutions";
import Link from "next/link";
import { BookOpen, Bot } from "lucide-react";

function Solutions() {
  const solutions: Solution[] = getAllSolutions();

  return (
    <div className="p-10 max-w-7xl mx-auto">
      {solutions.length === 0 && <p>No solutions found.</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {solutions.map((solution) => (
          <Link
            key={solution.solution}
            href={`/solutions/${solution.solution}`}
            className="border rounded-lg cursor-pointer hover:shadow-lg hover:border-slate-800 p-4 transition-all duration-300 ease-in-out"
          >
            <div className="relative">
              <p className="absolute flex items-center top-0 right-0 bg-white text-slate-700 font-bold p-3 rounded-lg m-2 text-sm">
                <BookOpen />
                {`${solution.length} Words`}
              </p>
              <Bot
                height={250}
                width={250}
                className="w-full object-contain bg-slate-100 rounded-t-lg"
              />
              <h2 className="text-lg p-5 first-letter:text-2xl font-light">{solution.solution}</h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Solutions;
