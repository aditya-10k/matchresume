import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { ModelProvider } from "@/context/ModelContext";
import { AuthProvider } from "@/context/AuthContext";
import AuthModal from "@/components/auth/AuthModal";
import BYOKModal from "@/components/settings/BYOKModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://matchresume.web.app";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#080402" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "matchresume | AI Career Studio & Vector Resume Intelligence",
    template: "%s | matchresume",
  },
  description:
    "Next-generation AI career intelligence platform. Dense vector RAG knowledge graph, zero-hallucination resume tailoring, and ATS-optimized LaTeX synthesis.",
  keywords: [
    "AI Resume Builder",
    "Resume Tailoring",
    "RAG Career Matching",
    "ChromaDB Vector Store",
    "LaTeX Resume Generator",
    "Agentic Career Copilot",
    "ATS Resume Optimizer",
    "Technical Career Intelligence",
    "matchresume",
  ],
  authors: [{ name: "matchresume" }],
  creator: "matchresume",
  publisher: "matchresume",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/knot.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/knot.svg", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "matchresume | AI Career Studio & Vector Resume Intelligence",
    description:
      "Autonomous multi-agent career matching, dense vector RAG knowledge cosmos, and ATS-optimized LaTeX synthesis. Zero hallucinated claims.",
    siteName: "matchresume",
    images: [
      {
        url: "/knot.svg",
        width: 512,
        height: 512,
        alt: "matchresume Interlocking Career Knot Icon",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "matchresume | AI Career Studio & Vector Resume Intelligence",
    description:
      "Dense vector RAG candidate knowledge graph, multi-agent resume tailoring, and ATS LaTeX synthesis.",
    images: ["/knot.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "matchresume",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Personal AI career intelligence system powered by dense vector RAG and autonomous agents for zero-hallucination resume tailoring.",
    featureList: [
      "Dense vector RAG candidate knowledge graph",
      "Interactive 3D Knowledge Cosmos with floating blobs",
      "ATS-compliant LaTeX resume generator",
      "Multi-agent Guardrail and Classifier pipeline",
      "Bring-Your-Own-Key (BYOK) privacy architecture",
    ],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-screen text-zinc-900 dark:text-zinc-100 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <ModelProvider>
            <AppShell>{children}</AppShell>
            <AuthModal />
            <BYOKModal />
          </ModelProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
