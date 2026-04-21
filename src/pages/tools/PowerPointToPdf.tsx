import { useState } from "react";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { Loader2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { toast } from "@/hooks/use-toast";

// Lightweight client-side PPTX → PDF: extracts text from each slide's XML.
// Keeps things working without a server. Layout/visuals won't match the original deck.

const PowerPointToPdf = () => {
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (!/\.pptx$/i.test(f.name)) {
      toast({ title: "PPTX only", description: "Older .ppt is not supported in browser." });
      return;
    }
    setBusy(true);
    try {
      const zip = await JSZip.loadAsync(f);
      const slideNames = Object.keys(zip.files)
        .filter((n) => /^ppt\/slides\/slide\d+\.xml$/i.test(n))
        .sort((a, b) => {
          const na = parseInt(a.match(/slide(\d+)\.xml/i)![1], 10);
          const nb = parseInt(b.match(/slide(\d+)\.xml/i)![1], 10);
          return na - nb;
        });

      if (!slideNames.length) {
        toast({ title: "No slides found", variant: "destructive" });
        setBusy(false);
        return;
      }

      const pdf = new jsPDF({ unit: "pt", format: [960, 540], orientation: "landscape" });
      const margin = 60;
      let first = true;
      const parser = new DOMParser();

      for (const name of slideNames) {
        if (!first) pdf.addPage([960, 540], "landscape");
        first = false;

        // Yellow accent bar
        pdf.setFillColor(255, 204, 0);
        pdf.rect(0, 0, 12, 540, "F");

        const xml = await zip.file(name)!.async("string");
        const doc = parser.parseFromString(xml, "application/xml");
        const paragraphs = Array.from(doc.getElementsByTagName("a:p"));

        let y = margin + 10;
        let isFirstPara = true;

        for (const p of paragraphs) {
          const runs = Array.from(p.getElementsByTagName("a:t"));
          const text = runs.map((r) => r.textContent || "").join("").trim();
          if (!text) continue;

          if (isFirstPara) {
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(28);
            pdf.setTextColor(20);
            isFirstPara = false;
          } else {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(16);
            pdf.setTextColor(60);
          }

          const lines = pdf.splitTextToSize(text, 960 - margin * 2);
          if (y + lines.length * 22 > 540 - margin) break;
          pdf.text(lines, margin, y);
          y += lines.length * 22 + 8;
        }

        // Slide number
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        const num = name.match(/slide(\d+)/i)![1];
        pdf.text(`${num} / ${slideNames.length}`, 960 - margin, 540 - 24);
      }

      pdf.save(f.name.replace(/\.pptx$/i, "") + ".pdf");
      toast({ title: "Converted", description: `${slideNames.length} slides saved as PDF.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Conversion failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        onFiles={handleFiles}
        accept={{ "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"] }}
        multiple={false}
        label={busy ? "Converting..." : "Select a PowerPoint file (.pptx)"}
        hint="Extracts slide text into clean PDF pages. Visuals are simplified."
      />
      {busy && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Converting your slides...
        </div>
      )}
    </div>
  );
};

export default PowerPointToPdf;
