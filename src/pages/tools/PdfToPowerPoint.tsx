import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import PptxGenJS from "pptxgenjs";
import { Loader2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { toast } from "@/hooks/use-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const PdfToPowerPoint = () => {
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      const data = new Uint8Array(await f.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        const slide = pptx.addSlide();
        // Fit image into 13.33 x 7.5 inches preserving aspect
        const slideW = 13.33;
        const slideH = 7.5;
        const ar = viewport.width / viewport.height;
        let w = slideW, h = slideW / ar;
        if (h > slideH) { h = slideH; w = slideH * ar; }
        slide.addImage({ data: dataUrl, x: (slideW - w) / 2, y: (slideH - h) / 2, w, h });
      }

      await pptx.writeFile({ fileName: f.name.replace(/\.pdf$/i, "") + ".pptx" });
      toast({ title: "Converted", description: "Each PDF page is now a slide." });
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
        accept={{ "application/pdf": [".pdf"] }}
        multiple={false}
        label={busy ? "Converting..." : "Select a PDF to convert to PowerPoint"}
        hint="Each page becomes a slide image inside a .pptx deck."
      />
      {busy && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Building your slides...
        </div>
      )}
    </div>
  );
};

export default PdfToPowerPoint;
