import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import { Loader2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { toast } from "@/hooks/use-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const PdfToWord = () => {
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      const data = new Uint8Array(await f.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const sections: Paragraph[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        sections.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: `Page ${i}`, bold: true })],
          spacing: { before: 240, after: 120 },
        }));

        // Group items into lines using their y position
        const lines: Record<string, string[]> = {};
        for (const item of text.items as any[]) {
          const y = Math.round(item.transform[5]);
          (lines[y] ??= []).push(item.str);
        }
        const ys = Object.keys(lines).map(Number).sort((a, b) => b - a);
        for (const y of ys) {
          const lineText = lines[y].join(" ").replace(/\s+/g, " ").trim();
          if (lineText) {
            sections.push(new Paragraph({ children: [new TextRun(lineText)] }));
          }
        }
      }

      const doc = new Document({ sections: [{ children: sections }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, f.name.replace(/\.pdf$/i, "") + ".docx");
      toast({ title: "Converted", description: "PDF text exported to Word." });
    } catch (e) {
      console.error(e);
      toast({ title: "Conversion failed", description: "Scanned PDFs without selectable text won't work.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        onFiles={handleFiles}
        accept={{ "application/pdf": [".pdf"] }}
        multiple={false}
        label={busy ? "Converting..." : "Select a PDF to convert to Word"}
        hint="Extracts selectable text into an editable .docx file."
      />
      {busy && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Building your Word document...
        </div>
      )}
    </div>
  );
};

export default PdfToWord;
