import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resume Copilot — AI Career Studio",
  description: "Personal AI career intelligence system powered by RAG and autonomous agents.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[#080402] text-[#f5ede8] selection:bg-orange-500/35 selection:text-orange-200 ambient-mesh antialiased">
        <Navbar />
        <main className="flex-1 pb-16">{children}</main>
      </body>
    </html>
  );
}
