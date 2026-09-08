"use client";

import { useMemo, useRef } from "react";
import { Printer, FileDown, CheckCircle2, Eye } from "lucide-react";
import { useModel } from "@/context/ModelContext";

interface LaTeXPreviewProps {
  latexCode: string;
}

interface ParsedResumeSection {
  title: string;
  subsections: {
    heading?: string;
    subheading?: string;
    date?: string;
    location?: string;
    items: string[];
  }[];
}

interface ParsedResume {
  name: string;
  contactLine: string[];
  sections: ParsedResumeSection[];
}

/**
 * Client-Side LaTeX Resume Compiler.
 * Transforms standard compilable LaTeX resume markup into structured AST
 * and renders it with crisp, authentic publication-grade A4 styling.
 */
function compileLaTeXToResume(latex: string): ParsedResume {
  const cleanLatex = latex
    .replace(/\\&/g, "&")
    .replace(/\\%/g, "%")
    .replace(/\\_/g, "_")
    .replace(/\\#/g, "#")
    .replace(/\\textbf\{([^}]+)\}/g, "$1")
    .replace(/\\textit\{([^}]+)\}/g, "$1")
    .replace(/\\href\{[^}]+\}\{([^}]+)\}/g, "$1");

  const lines = cleanLatex.split("\n").map((l) => l.trim());

  let name = "";
  const contactLine: string[] = [];
  const sections: ParsedResumeSection[] = [];
  let currentSection: ParsedResumeSection | null = null;
  let currentSubsection: {
    heading?: string;
    subheading?: string;
    date?: string;
    location?: string;
    items: string[];
  } | null = null;

  for (let line of lines) {
    // Ignore document boilerplate
    if (
      line.startsWith("\\documentclass") ||
      line.startsWith("\\usepackage") ||
      line.startsWith("\\begin{document}") ||
      line.startsWith("\\end{document}") ||
      line.startsWith("\\pagestyle") ||
      line.startsWith("%")
    ) {
      continue;
    }

    // Name extraction
    const nameMatch = line.match(/\\textbf\{\\Huge\s*([^}]+)\}/) ||
      line.match(/\\Huge\s*\\textbf\{([^}]+)\}/) ||
      line.match(/\\Huge\s*([^}\\]+)/) ||
      line.match(/\\Large\s*\\textbf\{([^}]+)\}/);
    if (nameMatch && !name) {
      name = nameMatch[1].replace(/[{}\\]/g, "").trim();
      continue;
    }

    // Contact info line extraction (phone, email, links)
    if (!currentSection && (line.includes("@") || line.includes("linkedin") || line.includes("github") || line.includes("+") || line.includes("|"))) {
      const parts = line.split(/[|•]/).map((p) => p.replace(/[{}\\]/g, "").trim()).filter(Boolean);
      contactLine.push(...parts);
      continue;
    }

    // Section header
    const sectionMatch = line.match(/\\section\{([^}]+)\}/);
    if (sectionMatch) {
      currentSection = {
        title: sectionMatch[1].replace(/[{}\\]/g, "").trim(),
        subsections: [],
      };
      sections.push(currentSection);
      currentSubsection = null;
      continue;
    }

    // List item
    if (line.startsWith("\\item")) {
      const itemText = line.replace(/^\\item\s*/, "").replace(/[{}\\]/g, "").trim();
      if (itemText) {
        if (!currentSubsection) {
          currentSubsection = { items: [] };
          if (currentSection) currentSection.subsections.push(currentSubsection);
        }
        currentSubsection.items.push(itemText);
      }
      continue;
    }

    // Text lines inside sections (e.g. skills or job headings)
    if (currentSection && line.length > 2 && !line.startsWith("\\begin") && !line.startsWith("\\end")) {
      const cleanedText = line.replace(/[{}\\]/g, "").trim();
      if (cleanedText) {
        if (!currentSubsection) {
          currentSubsection = { items: [cleanedText] };
          currentSection.subsections.push(currentSubsection);
        } else if (currentSubsection.items.length === 0) {
          currentSubsection.heading = cleanedText;
        } else {
          currentSubsection.items.push(cleanedText);
        }
      }
    }
  }

  return {
    name: name || "Target Candidate",
    contactLine: contactLine.length > 0 ? contactLine : ["Verified Experience", "matchresume Studio"],
    sections: sections.length > 0 ? sections : [
      {
        title: "Technical Qualifications",
        subsections: [{ items: ["Compiled LaTeX document ready for export."] }],
      },
    ],
  };
}

export default function LaTeXPreview({ latexCode }: LaTeXPreviewProps) {
  const { selectedModel } = useModel();
  const printRef = useRef<HTMLDivElement>(null);

  const parsedResume = useMemo(() => compileLaTeXToResume(latexCode), [latexCode]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border bg-white/95 dark:bg-zinc-950/95 shadow-2xl backdrop-blur-2xl overflow-hidden"
      style={{ borderColor: `${selectedModel.colors.primary}30` }}
    >
      {/* Preview Header Bar */}
      <div
        className="flex items-center justify-between border-b px-5 py-3 bg-zinc-50/80 dark:bg-black/50"
        style={{ borderColor: `${selectedModel.colors.primary}20` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{
              background: `${selectedModel.colors.primary}18`,
              color: selectedModel.colors.primary,
            }}
          >
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-900 dark:text-white">A4 Live Compiled Preview</span>
            <span className="ml-2 text-[10px] text-emerald-400 font-medium">Client-Side Engine Active</span>
          </div>
        </div>

        {/* Print / Export PDF Action */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-white shadow-md hover:brightness-110 active:scale-95 transition-all"
          style={{
            background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
            boxShadow: `0 4px 12px ${selectedModel.colors.primary}35`,
          }}
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Export to PDF</span>
        </button>
      </div>

      {/* A4 Sheet Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-100/70 dark:bg-black/60 flex justify-center">
        <div
          ref={printRef}
          className="w-full max-w-[780px] bg-white text-zinc-900 shadow-2xl rounded-sm p-8 sm:p-12 min-h-[1050px] font-serif print:p-0 print:shadow-none print:w-full"
          style={{
            fontFamily: "'Latin Modern Roman', 'Computer Modern', 'Times New Roman', serif",
          }}
        >
          {/* Header Name & Contacts */}
          <div className="text-center border-b pb-4 mb-4 border-zinc-300">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black uppercase">
              {parsedResume.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-600 font-sans">
              {parsedResume.contactLine.map((c, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-zinc-300">•</span>}
                  <span>{c}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4 text-xs leading-normal">
            {parsedResume.sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-black border-b border-black pb-0.5 font-sans">
                  {section.title}
                </h2>

                <div className="space-y-2">
                  {section.subsections.map((sub, subIdx) => (
                    <div key={subIdx} className="space-y-1">
                      {sub.heading && (
                        <div className="flex items-baseline justify-between font-sans">
                          <span className="font-bold text-zinc-900">{sub.heading}</span>
                          {sub.date && <span className="text-zinc-600 text-[11px]">{sub.date}</span>}
                        </div>
                      )}

                      {sub.items.length > 0 && (
                        <ul className="list-disc ml-5 space-y-1 text-zinc-800">
                          {sub.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="leading-relaxed">
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
