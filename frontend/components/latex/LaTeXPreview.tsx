"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { Printer, Eye, FileText, ZoomIn, ZoomOut, Maximize2, ShieldCheck, AlertCircle } from "lucide-react";
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
 * unescaping, and preserves bullet point hierarchies and company subheadings.
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
    .replace(/\\$/g, "$")
    .replace(/~/g, " ")
    .replace(/\\textquotesingle/g, "'")
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
      rawLine.startsWith("\\setlist") ||
      rawLine === "\\hr" ||
      rawLine === "\\hrule"
    ) {
      continue;
    }

    // Clean inline formatting macros
    let line = rawLine
      .replace(/\\(small|footnotesize|normalsize|large|Large|Huge|huge|centering|noindent|bfseries|uppercase|scshape)/g, "")
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

      if (headingText.includes("<strong>") || headingText.length > 2) {
        if (!currentSubsection || currentSubsection.items.length > 0) {
          // New subsection (e.g. Job Role + Date)
          currentSubsection = {
            heading: headingText,
            date,
            items: [],
          };
          currentSection.subsections.push(currentSubsection);
        } else if (!currentSubsection.heading) {
          currentSubsection.heading = headingText;
          currentSubsection.date = date;
        } else if (!currentSubsection.subheading) {
          // Company / organization subhead (e.g. SVKM EduConnect | educonnect.svkm.ac.in)
          currentSubsection.subheading = headingText;
          if (date && !currentSubsection.date) {
            currentSubsection.date = date;
          }
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
    const isAllCapsHeader =
      !sectionMatch &&
      line.length < 35 &&
      line === line.toUpperCase() &&
      /^[A-Z\s&,-]+$/.test(line) &&
      !line.includes("@") &&
      !line.includes("|");

    if (sectionMatch || isAllCapsHeader) {
      const headerTitle = sectionMatch ? sectionMatch[1].trim() : line.trim();
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
    if (
      !currentSection &&
      (line.includes("@") || line.includes("linkedin") || line.includes("github") || line.includes("|") || line.includes("+"))
    ) {
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
      } else if (!currentSubsection.subheading) {
        currentSubsection.subheading = headingText;
        if (date && !currentSubsection.date) {
          currentSubsection.date = date;
        }
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(90);
  const [contentHeight, setContentHeight] = useState<number>(0);

  const parsedResume = useMemo(() => {
    return mode === "plaintext"
      ? compilePlaintextToResume(latexCode)
      : compileLaTeXToResume(latexCode);
  }, [latexCode, mode]);

  useEffect(() => {
    if (printRef.current) {
      setContentHeight(printRef.current.scrollHeight);
    }
  }, [parsedResume, zoom]);

  const handlePrint = () => {
    window.print();
  };

  const handleFit = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 48;
      const targetWidth = 800;
      const fitZoom = Math.min(100, Math.max(50, Math.round((containerWidth / targetWidth) * 100)));
      setZoom(fitZoom);
    } else {
      setZoom(85);
    }
  };

  const isOnePage = contentHeight <= 1160;

  return (
    <div
      className="flex h-full flex-col rounded-3xl border bg-white/95 dark:bg-zinc-950/95 shadow-2xl backdrop-blur-2xl overflow-hidden"
      style={{ borderColor: `${selectedModel.colors.primary}30` }}
    >
      {/* Studio Header Bar */}
      <div
        className="flex flex-wrap items-center justify-between border-b px-4 py-2.5 bg-zinc-50/90 dark:bg-black/60 gap-2 shrink-0"
        style={{ borderColor: `${selectedModel.colors.primary}20` }}
      >
        <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-white">A4 Live Compiled Preview</span>
              {/* 1-Page Status Badge */}
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                  isOnePage
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                }`}
                title={isOnePage ? "Content fits within standard 1-page A4 height" : "Content spans onto page 2"}
              >
                {isOnePage ? <ShieldCheck className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                <span>{isOnePage ? "1 Page (ATS Optimal)" : "2 Pages"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar Controls: Zoom & Print */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center rounded-full border border-zinc-200 dark:border-white/10 p-0.5 bg-zinc-100/90 dark:bg-zinc-900/90 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="p-1 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut className="h-3 w-3" />
            </button>
            <span className="px-1.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-300 min-w-[36px] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(130, z + 10))}
              className="p-1 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn className="h-3 w-3" />
            </button>
            <button
              onClick={handleFit}
              className="px-2 py-0.5 ml-0.5 rounded-full text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
              title="Fit to Window"
            >
              Fit
            </button>
          </div>

          {/* Export to PDF Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-white shadow-md hover:brightness-110 active:scale-95 transition-all"
            style={{
              background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
              boxShadow: `0 4px 12px ${selectedModel.colors.primary}35`,
            }}
            title="Download or Print A4 PDF"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Export to PDF</span>
          </button>
        </div>
      </div>

      {/* A4 Sheet Viewport Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 sm:p-8 bg-zinc-950/95 flex flex-col items-center relative"
      >
        {/* Scaled A4 Document Container */}
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            marginBottom: zoom !== 100 ? `${((zoom / 100) - 1) * (contentHeight || 1130)}px` : "2rem",
            transition: "transform 0.15s ease-out",
          }}
          className="w-full max-w-[800px] flex flex-col items-center"
        >
          {/* Printable White A4 Sheet */}
          <div
            ref={printRef}
            id="resume-a4-canvas"
            className="w-full bg-white text-zinc-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)] rounded-sm p-10 sm:p-14 min-h-[1130px] h-fit shrink-0 font-serif print:p-0 print:shadow-none print:w-full print:min-h-0"
            style={{
              fontFamily: "'Latin Modern Roman', 'Computer Modern', 'Times New Roman', serif",
            }}
          >
            {/* Header Name & Contacts */}
            <div className="text-center border-b border-zinc-900 pb-3 mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 uppercase font-sans">
                {parsedResume.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-700 font-sans">
                {parsedResume.contactLine.map((c, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-zinc-400 font-bold">•</span>}
                    <span>{c}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Resume Sections */}
            <div className="space-y-4 text-xs leading-normal">
              {parsedResume.sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-2">
                  {/* Section Title with Jake's ATS titlerule */}
                  <div className="border-b border-zinc-950 pb-0.5 mt-3 mb-2 flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-950 font-sans">
                      {section.title}
                    </h2>
                  </div>

                  {/* Subsections */}
                  <div className="space-y-3">
                    {section.subsections.map((sub, subIdx) => (
                      <div key={subIdx} className="space-y-1">
                        {/* Heading & Right-aligned Date */}
                        {sub.heading && (
                          <div className="flex items-baseline justify-between font-sans">
                            <span className="font-bold text-zinc-950 text-[12.5px]">
                              {renderFormattedText(sub.heading)}
                            </span>
                            {sub.date && (
                              <span className="text-zinc-600 text-[11px] font-medium shrink-0 ml-2">
                                {sub.date.replace(/--/g, "–")}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Subheading (Company / Organization / Tech stack) */}
                        {sub.subheading && (
                          <div className="text-zinc-700 italic text-[11.5px] font-sans -mt-0.5">
                            {renderFormattedText(sub.subheading)}
                          </div>
                        )}

                        {/* High-density Bullet Items */}
                        {sub.items.length > 0 && (
                          <ul className="list-disc ml-4 space-y-1 text-zinc-800 text-[11.5px] leading-relaxed">
                            {sub.items.map((item, itemIdx) => (
                              <li key={itemIdx} className="pl-0.5">
                                {renderFormattedText(item.replace(/--/g, "–"))}
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

      {/* Embedded Print CSS */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          nav, header, aside, button, .no-print {
            display: none !important;
          }
          #resume-a4-canvas {
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: 0 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
