import { Solution as SolutionType } from "@/app/types/solutions";
import { Bot } from "lucide-react";

interface Props {
  solution: SolutionType;
}

const Solution = ({ solution }: Props) => {
  return (
    <div className="w-full h-full p-6 bg-white shadow-md rounded-lg border border-gray-200 overflow-auto">
      <div className="flex flex-col items-center text-center space-y-2">
        <Bot width={120} height={120} className="text-slate-700" />
        <p className="text-xs uppercase tracking-wide text-gray-400">
          Generated on {new Date(solution.createdAt).toLocaleString()}
        </p>
      </div>
      <div className="px-2 py-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {solution.title}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Prompt: <span className="font-medium">{solution.prompt}</span>
        </p>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {solution.content}
        </p>
      </div>
    </div>
  );
};

export default Solution;
