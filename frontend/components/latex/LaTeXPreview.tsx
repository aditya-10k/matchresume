"use client";

import React, { useMemo, useRef } from "react";
import { Printer, Eye, FileText } from "lucide-react";
import { useModel } from "@/context/ModelContext";

export type OutputMode = "latex" | "plaintext";

interface LaTeXPreviewProps {
  latexCode: string;
  mode?: OutputMode;
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
 * Safely renders bold tags (`**text**` or `<strong>text</strong>`) as React elements.
 */
function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|<strong>.*?<\/strong>)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} className="font-bold text-black">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("<strong>") && part.endsWith("</strong>")) {
      return <strong key={idx} className="font-bold text-black">{part.slice(8, -9)}</strong>;
    }
    return <span key={idx}>{part}</span>;
  });
}

/**
 * Robust Client-Side LaTeX Resume Compiler.
 * Handles \section, \section*, \hfill right-aligned dates, \textbf, \textit,
 * unescaping, and preserves bullet point hierarchies.
 */
function compileLaTeXToResume(latex: string): ParsedResume {
  if (!latex || !latex.trim()) {
    return {
      name: "Target Candidate",
      contactLine: ["Resume Studio"],
      sections: [],
    };
  }

  // Pre-clean LaTeX escapes and macros
  let cleanLatex = latex
    .replace(/\\&/g, "&")
    .replace(/\\%/g, "%")
    .replace(/\\_/g, "_")
    .replace(/\\#/g, "#")
    .replace(/~/g, " ")
    .replace(/\\href\{[^}]+\}\{([^}]+)\}/g, "$1")
    .replace(/\\textbf\{([^}]+)\}/g, "<strong>$1</strong>")
    .replace(/\\textit\{([^}]+)\}/g, "$1");

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

  for (let rawLine of lines) {
    // Ignore boilerplate and comments
    if (
      !rawLine ||
      rawLine.startsWith("%") ||
      rawLine.startsWith("\\documentclass") ||
      rawLine.startsWith("\\usepackage") ||
      rawLine.startsWith("\\begin{document}") ||
      rawLine.startsWith("\\end{document}") ||
      rawLine.startsWith("\\begin{center}") ||
      rawLine.startsWith("\\end{center}") ||
      rawLine.startsWith("\\pagestyle") ||
      rawLine.startsWith("\\titleformat") ||
      rawLine.startsWith("\\titlespacing") ||
      rawLine.startsWith("\\setlength") ||
      rawLine.startsWith("\\hypersetup") ||
      rawLine === "\\hr" ||
      rawLine === "\\hrule"
    ) {
      continue;
    }

    // Clean inline formatting macros
    let line = rawLine
      .replace(/\\(small|footnotesize|normalsize|large|Large|Huge|huge|centering|noindent|bfseries|uppercase)/g, "")
      .replace(/\\vspace\*?\{[^}]+\}/g, "")
      .replace(/\\hspace\*?\{[^}]+\}/g, "")
      .trim();

    // Section header (matches both \section{...} and \section*{...})
    const sectionMatch = line.match(/\\section\*?\{([^}]+)\}/);
    if (sectionMatch) {
      const title = sectionMatch[1]
        .replace(/<[^>]+>/g, "")
        .replace(/[{}\\]/g, "")
        .trim();
      currentSection = {
        title,
        subsections: [],
      };
      sections.push(currentSection);
      currentSubsection = null;
      continue;
    }

    // Name extraction (only before any section is started)
    if (!currentSection && !name) {
      const nameMatch =
        line.match(/<strong>\s*([^<]+)\s*<\/strong>/) ||
        line.match(/\\textbf\{\s*([^}]+)\s*\}/) ||
        line.match(/\{\s*([^}\\]{3,40})\s*\}/);
      if (nameMatch && nameMatch[1].length < 40 && !nameMatch[1].includes("@") && !nameMatch[1].includes("|")) {
        name = nameMatch[1].replace(/[{}\\]/g, "").trim();
        continue;
      }
    }

    // Contact info line extraction (strictly before first section)
    if (!currentSection && (line.includes("@") || line.includes("linkedin") || line.includes("github") || line.includes("|"))) {
      const parts = line
        .replace(/<[^>]+>/g, "")
        .replace(/\\(href|url)/g, "")
        .split(/[|•]/)
        .map((p) => p.replace(/[{}\\\/]/g, " ").replace(/\s+/g, " ").trim())
        .filter((p) => p.length > 2 && !p.startsWith("item") && !p.startsWith("begin") && !p.startsWith("end"));
      contactLine.push(...parts);
      continue;
    }

    // List item (\item)
    if (line.startsWith("\\item")) {
      let itemText = line.replace(/^\\item(\[[^\]]*\])?\s*/, "").trim();
      // Remove trailing LaTeX newline \\
      itemText = itemText.replace(/\\{1,2}$/, "").trim();
      if (itemText) {
        if (!currentSubsection) {
          currentSubsection = { items: [] };
          if (currentSection) currentSection.subsections.push(currentSubsection);
        }
        currentSubsection.items.push(itemText);
      }
      continue;
    }

    // Inside a section: check for subheadings, dates, or non-item content
    if (currentSection && !line.startsWith("\\begin") && !line.startsWith("\\end")) {
      let date: string | undefined = undefined;
      let headingText = line.replace(/\\{1,2}$/, "").trim();

      if (headingText.includes("\\hfill")) {
        const parts = headingText.split("\\hfill");
        headingText = parts[0].trim();
        date = parts[1]?.replace(/[{}\\]/g, "").trim();
      }

      // If it looks like a subsection heading (bold or title line)
      if (headingText.includes("<strong>") || headingText.length > 2) {
        if (!currentSubsection || currentSubsection.items.length > 0) {
          currentSubsection = {
            heading: headingText,
            date,
            items: [],
          };
          currentSection.subsections.push(currentSubsection);
        } else if (!currentSubsection.heading) {
          currentSubsection.heading = headingText;
          currentSubsection.date = date;
        } else {
          currentSubsection.items.push(headingText);
        }
      }
    }
  }

  return {
    name: name || "Target Candidate",
    contactLine: contactLine.length > 0 ? contactLine : ["Verified Experience", "matchresume Studio"],
    sections: sections.length > 0 ? sections : [
      {
        title: "Qualifications & Summary",
        subsections: [{ items: ["Tailored resume synthesized and ready for export."] }],
      },
    ],
  };
}

/**
 * Plaintext / Markdown Resume Compiler.
 * Converts clean Markdown / text resumes into structured A4 PDF render AST.
 */
function compilePlaintextToResume(text: string): ParsedResume {
  if (!text || !text.trim()) {
    return {
      name: "Target Candidate",
      contactLine: ["Resume Studio"],
      sections: [],
    };
  }

  const lines = text.split("\n").map((l) => l.trim());
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
    if (!line) continue;

    // Heading level 1 or 2: # Section or ## Section
    const sectionMatch = line.match(/^#{1,3}\s+(.+)$/);
    const isAllCapsHeader = !sectionMatch && line.length < 35 && line === line.toUpperCase() && /^[A-Z\s&,-]+$/.test(line) && !line.includes("@") && !line.includes("|");

    if (sectionMatch || isAllCapsHeader) {
      const headerTitle = sectionMatch ? sectionMatch[1].trim() : line.trim();
      // If we don't have a name yet, first h1 is the name
      if (!name && sectionMatch && line.startsWith("# ")) {
        name = headerTitle;
        continue;
      }
      currentSection = {
        title: headerTitle,
        subsections: [],
      };
      sections.push(currentSection);
      currentSubsection = null;
      continue;
    }

    // Name extraction if top line
    if (!name && !currentSection && (line.startsWith("**") || !line.includes("@"))) {
      name = line.replace(/[*#]/g, "").trim();
      continue;
    }

    // Contact info line
    if (!currentSection && (line.includes("@") || line.includes("linkedin") || line.includes("github") || line.includes("|") || line.includes("+"))) {
      const parts = line.split(/[|•]/).map((p) => p.trim()).filter(Boolean);
      contactLine.push(...parts);
      continue;
    }

    // Bullet item (- or * or •)
    if (line.match(/^[-*•]\s+/)) {
      const itemText = line.replace(/^[-*•]\s+/, "").trim();
      if (itemText) {
        if (!currentSubsection) {
          currentSubsection = { items: [] };
          if (currentSection) currentSection.subsections.push(currentSubsection);
        }
        currentSubsection.items.push(itemText);
      }
      continue;
    }

    // Subheading or body text within section
    if (currentSection) {
      let date: string | undefined = undefined;
      let headingText = line;
      if (line.includes(" | ") || line.includes(" -- ") || line.includes("\t")) {
        const parts = line.split(/ \| | -- |\t/);
        headingText = parts[0].trim();
        date = parts[1]?.trim();
      }

      if (!currentSubsection || currentSubsection.items.length > 0) {
        currentSubsection = {
          heading: headingText,
          date,
          items: [],
        };
        currentSection.subsections.push(currentSubsection);
      } else if (!currentSubsection.heading) {
        currentSubsection.heading = headingText;
        currentSubsection.date = date;
      } else {
        currentSubsection.items.push(line);
      }
    }
  }

  return {
    name: name || "Target Candidate",
    contactLine: contactLine.length > 0 ? contactLine : ["Verified Experience", "matchresume Studio"],
    sections: sections.length > 0 ? sections : [
      {
        title: "Qualifications & Summary",
        subsections: [{ items: ["Tailored plaintext resume ready for export."] }],
      },
    ],
  };
}

export default function LaTeXPreview({ latexCode, mode = "latex" }: LaTeXPreviewProps) {
  const { selectedModel } = useModel();
  const printRef = useRef<HTMLDivElement>(null);

  const parsedResume = useMemo(() => {
    return mode === "plaintext"
      ? compilePlaintextToResume(latexCode)
      : compileLaTeXToResume(latexCode);
  }, [latexCode, mode]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="flex h-full flex-col rounded-3xl border bg-white/95 dark:bg-zinc-950/95 shadow-2xl backdrop-blur-2xl overflow-hidden"
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
            {mode === "plaintext" ? <FileText className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-900 dark:text-white">A4 Live Compiled Preview</span>
            <span className="ml-2 text-[10px] text-emerald-500 dark:text-emerald-400 font-medium">
              {mode === "plaintext" ? "Plaintext / Markdown Engine Active" : "Client-Side TeX Engine Active"}
            </span>
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
                          <span className="font-bold text-zinc-900">
                            {renderFormattedText(sub.heading)}
                          </span>
                          {sub.date && <span className="text-zinc-600 text-[11px] shrink-0 ml-2">{sub.date}</span>}
                        </div>
                      )}

                      {sub.items.length > 0 && (
                        <ul className="list-disc ml-5 space-y-1 text-zinc-800">
                          {sub.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="leading-relaxed">
                              {renderFormattedText(item)}
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

