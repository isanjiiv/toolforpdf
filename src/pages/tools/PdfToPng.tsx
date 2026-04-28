import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Loader2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { toast } from "@/hooks/use-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const PdfToPng = () => {
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: File[]) => {
    const f = files[0]; if (!f) return;
    setBusy(true);
    try {
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
      const zip = new JSZip();
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width; canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/png"));
        zip.file(`page-${String(i).padStart(3, "0")}.png`, blob);
      }
      const out = await zip.generateAsync({ type: "blob" });
      saveAs(out, f.name.replace(/\.pdf$/i, "") + "-png.zip");
      toast({ title: "Done", description: `${pdf.numPages} PNG page(s) zipped.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Conversion failed", variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <FileDropzone onFiles={handleFiles} accept={{ "application/pdf": [".pdf"] }} multiple={false}
        label={busy ? "Converting..." : "Select a PDF"} hint="Each page becomes a PNG image inside a .zip." />
      {busy && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Rendering pages...
        </div>
      )}
    </div>
  );
};

export default PdfToPng;
