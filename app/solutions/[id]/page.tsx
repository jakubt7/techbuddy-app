import { getAllSolutions, getSolution } from "@/lib/getAllSolutions";
import { notFound } from "next/navigation";
import Solution from "@/components/ui/Solution";


interface SolutionProps {
  params: {
    id: string;
  };
}

function SolutionPage({params: {id}}: SolutionProps) {
  const decodedId = decodeURIComponent(id);
  const solution = getSolution(decodedId);

  if(!solution) {
    return notFound();
  }

  console.log(solution);
  return <Solution solution={solution} />;
}

export default SolutionPage;

export async function generateStaticParams() {
    const solutions = getAllSolutions();

    const paths = solutions.map((solution) => ({
        id: solution.solution,
    }))

    return paths;
}
