import { BookOpenText, FileText } from "lucide-react";
import Link from "next/link";

const Header = () => {
  return (
    <header className="relative p-14 text-center">
      <Link href="/">
        <h1 className="font-black text-5xl">TechBuddy AI</h1>
        <div className="flex justify-center mt-3 space-x-1 text-2xl lg:text-3xl">
          <h2>Making tech</h2>

          <h2 className="animate-bounce text-slate-700">understandable</h2>
          <h2>.</h2>
        </div>
      </Link>

      <div className="flex space-x-3 absolute top-5 right-5">
        <Link href="/">
          <FileText className="w-7 h-7 lg:w-12 lg:h-12 mx-auto border border-black p-3 rounded-md cursor-pointer hover:opacity-50" />
        </Link>
        <Link href="/solutions">
          <BookOpenText className="w-7 h-7 lg:w-12 lg:h-12 mx-auto border border-black p-3 rounded-md cursor-pointer hover:opacity-50" />
        </Link>
      </div>
    </header>
  );
};

export default Header;
