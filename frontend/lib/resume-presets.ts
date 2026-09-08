export interface ResumePreset {
  id: string;
  name: string;
  shortName: string;
  category: "tech" | "minimal" | "research" | "plaintext";
  badge: string;
  description: string;
  templateFormat: "latex" | "plaintext";
  latexSkeleton: string;
}

export const RESUME_PRESETS: ResumePreset[] = [
  {
    id: "classic_tech",
    name: "Jake's Resume (Ivy League Tech Standard)",
    shortName: "Classic Tech",
    category: "tech",
    badge: "ATS Gold Standard",
    description:
      "The most widely accepted software engineering and finance format worldwide. Full-width horizontal section rules, high-density bullets, right-aligned dates.",
    templateFormat: "latex",
    latexSkeleton: `\\documentclass[10pt, letterpaper]{article}
\\usepackage[margin=0.65in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{xcolor}

\\hypersetup{colorlinks=true, linkcolor=black, urlcolor=black}

\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{10pt}{4pt}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{3pt}

\\begin{document}
\\begin{center}
    {\\Huge \\textbf{{{NAME}}}} \\\\
    {{CONTACT}}
\\end{center}

\\section*{Education}
{{EDUCATION}}

\\section*{Technical Skills}
{{SKILLS}}

\\section*{Experience}
{{EXPERIENCE}}

\\section*{Projects}
{{PROJECTS}}

\\end{document}`
  },
  {
    id: "modern_clean",
    name: "Modern Minimalist (Executive)",
    shortName: "Modern Minimal",
    category: "minimal",
    badge: "Sleek & Compact",
    description:
      "Contemporary sans-serif aesthetic with balanced whitespace, subtle divider rules, and emphasized title groupings.",
    templateFormat: "latex",
    latexSkeleton: `\\documentclass[10pt, letterpaper]{article}
\\usepackage[margin=0.7in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}

\\hypersetup{colorlinks=true, linkcolor=black, urlcolor=black}
\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\vspace{-2pt}\\rule{\\textwidth}{0.5pt}]
\\titlespacing*{\\section}{0pt}{12pt}{5pt}
\\setlength{\\parindent}{0pt}

\\begin{document}
\\begin{center}
    {\\LARGE \\textbf{{{NAME}}}} \\\\
    {{CONTACT}}
\\end{center}

\\section*{Summary}
{{SUMMARY}}

\\section*{Core Competencies}
{{SKILLS}}

\\section*{Professional Experience}
{{EXPERIENCE}}

\\section*{Education}
{{EDUCATION}}

\\end{document}`
  },
  {
    id: "compact_research",
    name: "Academic & Systems Research",
    shortName: "Research & Systems",
    category: "research",
    badge: "AI & Deep Tech",
    description:
      "Engineered for research scientists, AI practitioners, and systems engineers with dedicated sections for Research, Publications, and Tooling.",
    templateFormat: "latex",
    latexSkeleton: `\\documentclass[10pt, letterpaper]{article}
\\usepackage[margin=0.65in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}

\\hypersetup{colorlinks=true, linkcolor=black, urlcolor=black}
\\titleformat{\\section}{\\large\\bfseries\\scshape}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{10pt}{4pt}
\\setlength{\\parindent}{0pt}

\\begin{document}
\\begin{center}
    {\\Huge \\textbf{{{NAME}}}} \\\\
    {{CONTACT}}
\\end{center}

\\section*{Research & Technical Focus}
{{SKILLS}}

\\section*{Experience}
{{EXPERIENCE}}

\\section*{Key Projects & Systems}
{{PROJECTS}}

\\section*{Education}
{{EDUCATION}}

\\end{document}`
  },
  {
    id: "plaintext_standard",
    name: "Universal ATS Plaintext",
    shortName: "Plaintext",
    category: "plaintext",
    badge: "Universal ATS",
    description:
      "Structured Markdown / plain text format. Flawlessly parses in every web application form, copy-paste box, and text scanner.",
    templateFormat: "plaintext",
    latexSkeleton: `# {{NAME}}
{{CONTACT}}

## TECHNICAL SKILLS
{{SKILLS}}

## PROFESSIONAL EXPERIENCE
{{EXPERIENCE}}

## PROJECTS
{{PROJECTS}}

## EDUCATION
{{EDUCATION}}`
  }
];

export const DEFAULT_PRESET_ID = "classic_tech";
