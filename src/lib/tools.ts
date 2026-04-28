import {
  Combine, Scissors, FileDown, FileUp, Image as ImageIcon, FileImage,
  FileText, Presentation, FileSpreadsheet, Minimize2, RotateCw,
  Lock, Unlock, Stamp, PenLine, FileSearch, ListOrdered,
  Hash, Crop, FileOutput, FileMinus2, Images, LayoutGrid, Code2, Signature,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ToolCategory = "organize" | "optimize" | "convert-to" | "convert-from" | "edit" | "security";

export interface Tool {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: ToolCategory;
  available: boolean;
}

export const categoryLabel: Record<ToolCategory, string> = {
  organize: "Organize PDF",
  optimize: "Optimize PDF",
  "convert-to": "Convert to PDF",
  "convert-from": "Convert from PDF",
  edit: "Edit PDF",
  security: "PDF Security",
};

export const tools: Tool[] = [
  // Organize
  { slug: "merge-pdf", name: "Merge PDF", description: "Combine PDFs in the order you want.", icon: Combine, category: "organize", available: true },
  { slug: "split-pdf", name: "Split PDF", description: "Separate one page or a range into independent files.", icon: Scissors, category: "organize", available: true },
  { slug: "rotate-pdf", name: "Rotate PDF", description: "Rotate your PDFs the way you need them.", icon: RotateCw, category: "organize", available: true },
  { slug: "organize-pdf", name: "Organize PDF", description: "Sort, add and delete PDF pages.", icon: ListOrdered, category: "organize", available: true },
  { slug: "extract-pages", name: "Extract Pages", description: "Pull selected pages into a new PDF.", icon: FileOutput, category: "organize", available: true },
  { slug: "remove-pages", name: "Remove Pages", description: "Delete the pages you don't need.", icon: FileMinus2, category: "organize", available: true },
  { slug: "nup-pdf", name: "N-up Pages", description: "Place multiple pages on one sheet.", icon: LayoutGrid, category: "organize", available: true },

  // Optimize
  { slug: "compress-pdf", name: "Compress PDF", description: "Reduce file size while keeping quality.", icon: Minimize2, category: "optimize", available: true },
  { slug: "repair-pdf", name: "Repair PDF", description: "Recover damaged PDF files.", icon: FileSearch, category: "optimize", available: true },

  // Convert TO PDF
  { slug: "jpg-to-pdf", name: "JPG to PDF", description: "Convert JPG images to PDF in seconds.", icon: ImageIcon, category: "convert-to", available: true },
  { slug: "word-to-pdf", name: "Word to PDF", description: "Make DOCX files easy to read.", icon: FileText, category: "convert-to", available: true },
  { slug: "powerpoint-to-pdf", name: "PowerPoint to PDF", description: "Convert PPTX into PDF.", icon: Presentation, category: "convert-to", available: true },
  { slug: "excel-to-pdf", name: "Excel to PDF", description: "Convert XLSX/CSV into PDF.", icon: FileSpreadsheet, category: "convert-to", available: true },
  { slug: "html-to-pdf", name: "HTML to PDF", description: "Render HTML markup into a PDF document.", icon: Code2, category: "convert-to", available: true },

  // Convert FROM PDF
  { slug: "pdf-to-jpg", name: "PDF to JPG", description: "Extract pages as JPG images.", icon: FileImage, category: "convert-from", available: true },
  { slug: "pdf-to-png", name: "PDF to PNG", description: "Render each page as a PNG image.", icon: Images, category: "convert-from", available: true },
  { slug: "pdf-to-word", name: "PDF to Word", description: "Convert PDFs to editable DOCX.", icon: FileDown, category: "convert-from", available: true },
  { slug: "pdf-to-powerpoint", name: "PDF to PowerPoint", description: "Convert PDFs to PPTX slides.", icon: FileUp, category: "convert-from", available: true },
  { slug: "pdf-to-excel", name: "PDF to Excel", description: "Pull data straight from PDFs into Excel.", icon: FileSpreadsheet, category: "convert-from", available: true },

  // Edit
  { slug: "edit-pdf", name: "Edit PDF", description: "Add text and annotations to your PDF.", icon: PenLine, category: "edit", available: true },
  { slug: "watermark-pdf", name: "Watermark", description: "Stamp text over every page of your PDF.", icon: Stamp, category: "edit", available: true },
  { slug: "page-numbers", name: "Page Numbers", description: "Add page numbers anywhere on your PDF.", icon: Hash, category: "edit", available: true },
  { slug: "crop-pdf", name: "Crop PDF", description: "Trim margins from every page.", icon: Crop, category: "edit", available: true },
  { slug: "sign-pdf", name: "Sign PDF", description: "Draw a signature and place it on a page.", icon: Signature, category: "edit", available: true },

  // Security
  { slug: "protect-pdf", name: "Protect PDF", description: "Encrypt PDFs with a password (AES-256).", icon: Lock, category: "security", available: true },
  { slug: "unlock-pdf", name: "Unlock PDF", description: "Decrypt protected PDFs with the password.", icon: Unlock, category: "security", available: true },
];

// A varied palette so icons never stay fixed to a single (yellow) hue.
// Each entry pairs a soft tinted background with a vivid foreground.
const iconPalette: string[] = [
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-orange-100 text-orange-600",
  "bg-purple-100 text-purple-600",
  "bg-rose-100 text-rose-600",
  "bg-sky-100 text-sky-600",
  "bg-amber-100 text-amber-600",
  "bg-teal-100 text-teal-600",
  "bg-pink-100 text-pink-600",
  "bg-indigo-100 text-indigo-600",
  "bg-lime-100 text-lime-600",
  "bg-fuchsia-100 text-fuchsia-600",
  "bg-cyan-100 text-cyan-600",
  "bg-red-100 text-red-600",
  "bg-violet-100 text-violet-600",
  "bg-green-100 text-green-600",
];

const pickRandom = () => iconPalette[Math.floor(Math.random() * iconPalette.length)];

// Per-tool randomized colors (stable for the lifetime of the module load).
export const toolColor: Record<string, string> = tools.reduce((acc, t) => {
  acc[t.slug] = pickRandom();
  return acc;
}, {} as Record<string, string>);

// Category fallback colors — also randomized, kept for ToolLayout header.
export const categoryColor: Record<ToolCategory, string> = {
  organize: pickRandom(),
  optimize: pickRandom(),
  "convert-to": pickRandom(),
  "convert-from": pickRandom(),
  edit: pickRandom(),
  security: pickRandom(),
};

export const getTool = (slug: string) => tools.find((t) => t.slug === slug);
