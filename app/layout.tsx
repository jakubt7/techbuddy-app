import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "TechbuddyAI",
  description: "A tool that makes tech solutions understandable",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Header />
        {children}
      </body>
      <Toaster duration={8000} position="bottom-left" />
    </html>
  );
}
