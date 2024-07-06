import { Solution as SolutionType } from "@/app/types/solutions";
import { Bot } from "lucide-react";

interface Props {
  solution: SolutionType;
}

const Solution = ({solution}: Props) => {
    return (
      <div className="max-w-2xl mx-auto my-6 p-6 bg-white shadow-md rounded-lg border border-gray-200">
        <Bot width={150} height={150} className="mx-auto"/>
        <div className="px-6 py-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">{solution.solution}</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{solution.content}</p>
        </div>
      </div>
    );
};

export default Solution;
