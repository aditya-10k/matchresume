import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { ModelProvider } from "@/context/ModelContext";

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
      <body className="min-h-screen flex flex-col text-zinc-100 antialiased">
        <ModelProvider>
          <Navbar />
          <main className="flex-1 pb-16">{children}</main>
        </ModelProvider>
      </body>
    </html>
  );
}
