import {
  Combine, Scissors, FileDown, FileUp, Image as ImageIcon, FileImage,
  FileText, Presentation, FileSpreadsheet, Minimize2, RotateCw,
  Lock, Unlock, Stamp, PenLine, FileSearch, ListOrdered,
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

  // Optimize
  { slug: "compress-pdf", name: "Compress PDF", description: "Reduce file size while keeping quality.", icon: Minimize2, category: "optimize", available: true },
  { slug: "repair-pdf", name: "Repair PDF", description: "Recover damaged PDF files.", icon: FileSearch, category: "optimize", available: true },

  // Convert TO PDF
  { slug: "jpg-to-pdf", name: "JPG to PDF", description: "Convert JPG images to PDF in seconds.", icon: ImageIcon, category: "convert-to", available: true },
  { slug: "word-to-pdf", name: "Word to PDF", description: "Make DOCX files easy to read.", icon: FileText, category: "convert-to", available: true },
  { slug: "powerpoint-to-pdf", name: "PowerPoint to PDF", description: "Convert PPTX into PDF.", icon: Presentation, category: "convert-to", available: true },
  { slug: "excel-to-pdf", name: "Excel to PDF", description: "Convert XLSX/CSV into PDF.", icon: FileSpreadsheet, category: "convert-to", available: true },

  // Convert FROM PDF
  { slug: "pdf-to-jpg", name: "PDF to JPG", description: "Extract pages as JPG images.", icon: FileImage, category: "convert-from", available: true },
  { slug: "pdf-to-word", name: "PDF to Word", description: "Convert PDFs to editable DOCX.", icon: FileDown, category: "convert-from", available: true },
  { slug: "pdf-to-powerpoint", name: "PDF to PowerPoint", description: "Convert PDFs to PPTX slides.", icon: FileUp, category: "convert-from", available: true },
  { slug: "pdf-to-excel", name: "PDF to Excel", description: "Pull data straight from PDFs into Excel.", icon: FileSpreadsheet, category: "convert-from", available: true },

  // Edit
  { slug: "edit-pdf", name: "Edit PDF", description: "Add text and annotations to your PDF.", icon: PenLine, category: "edit", available: true },
  { slug: "watermark-pdf", name: "Watermark", description: "Stamp text over every page of your PDF.", icon: Stamp, category: "edit", available: true },

  // Security
  { slug: "protect-pdf", name: "Protect PDF", description: "Encrypt PDFs with a password (AES-256).", icon: Lock, category: "security", available: true },
  { slug: "unlock-pdf", name: "Unlock PDF", description: "Decrypt protected PDFs with the password.", icon: Unlock, category: "security", available: true },
];

export const categoryColor: Record<ToolCategory, string> = {
  organize: "bg-tool-organize/10 text-tool-organize",
  optimize: "bg-tool-optimize/10 text-tool-optimize",
  "convert-to": "bg-tool-convert-to/10 text-tool-convert-to",
  "convert-from": "bg-tool-convert-from/10 text-tool-convert-from",
  edit: "bg-tool-edit/10 text-tool-edit",
  security: "bg-tool-security/10 text-tool-security",
};

export const getTool = (slug: string) => tools.find((t) => t.slug === slug);
