import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import SolutionGenerator from "@/components/SolutionGenerator";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <section className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col justify-center items-center space-y-5 bg-slate-100 pb-5 order-1 lg:-order-1">
          <Bot height={250} width={250}/>

          <Button asChild className="px-20 py-10 text-xl">
            <Link href="/stories">Explore generated solutions</Link>
          </Button>
        </div>

        <SolutionGenerator />
      </section>
    </main>
  );
}
