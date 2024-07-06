import { Solution } from "@/app/types/solutions";
import cleanTitle from "./cleanTitle";
import path from "path";
import fs from "fs";

const solutionsDir = path.join(process.cwd(), "public/solutions");

export function getAllSolutions(): Solution[] {
  if (!fs.existsSync(solutionsDir)) {
    return [];
  }

  const solutionFolders = fs.readdirSync(solutionsDir);

  const solutions: Solution[] = solutionFolders.map((solutionFolder) => {
    const solutionPath = path.join(solutionsDir, solutionFolder);
    const files = fs.readdirSync(solutionPath);

    let lengthValue = 0;
    let content = "";

    files.forEach((file) => {
      const match = file.match(/length(\d+)\.txt/);
      if (match) {
        lengthValue = parseInt(match[1], 10);
        content = fs.readFileSync(path.join(solutionPath, file), "utf-8");
      }
    });

    return {
      solution: cleanTitle(solutionFolder),
      length: lengthValue,
      content: content,
    };
  });

  return solutions;
}

export const getSolution = (solution: string): Solution | undefined => {
  const solutions = getAllSolutions();
  return solutions.find((s) => s.solution === solution);
};
