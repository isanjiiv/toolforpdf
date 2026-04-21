import { useState } from "react";
import { degrees, PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Download, Loader2, RotateCw } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const RotatePdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [rot, setRot] = useState<number[]>([]); // 0/90/180/270 per page
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    const buf = new Uint8Array(await f.arrayBuffer());
    setBytes(buf);
    const pdf = await pdfjsLib.getDocument({ data: buf.slice() }).promise;
    const out: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.4 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      out.push(canvas.toDataURL("image/jpeg", 0.7));
    }
    setThumbs(out);
    setRot(new Array(out.length).fill(0));
  };

  const rotateOne = (i: number) => {
    setRot((prev) => prev.map((r, idx) => (idx === i ? (r + 90) % 360 : r)));
  };
  const rotateAll = () => setRot((prev) => prev.map((r) => (r + 90) % 360));

  const apply = async () => {
    if (!bytes || !file) return;
    setBusy(true);
    try {
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      pdf.getPages().forEach((page, i) => {
        if (rot[i]) {
          const current = page.getRotation().angle;
          page.setRotation(degrees((current + rot[i]) % 360));
        }
      });
      const data = await pdf.save();
      const blob = new Blob([data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + "-rotated.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Saved", description: "Rotated PDF downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Rotation failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone
          onFiles={handleFiles}
          accept={{ "application/pdf": [".pdf"] }}
          multiple={false}
          label="Select a PDF to rotate"
          hint="Click each page to rotate it 90° clockwise."
        />
      )}

      {file && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="soft" size="sm" onClick={rotateAll}>
              <RotateCw className="h-4 w-4" /> Rotate all
            </Button>
            <div className="ml-auto text-sm text-muted-foreground">{file.name}</div>
          </div>

          {thumbs.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {thumbs.map((src, i) => (
                <button
                  key={i}
                  onClick={() => rotateOne(i)}
                  className="group overflow-hidden rounded-xl border border-border bg-card shadow-card transition-smooth hover:-translate-y-0.5 hover:border-primary"
                  type="button"
                >
                  <div className="grid aspect-[3/4] place-items-center bg-secondary">
                    <img
                      src={src}
                      alt={`Page ${i + 1}`}
                      className="max-h-full max-w-full object-contain transition-bounce"
                      style={{ transform: `rotate(${rot[i]}deg)` }}
                    />
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 text-xs">
                    <span className="font-semibold text-foreground">Page {i + 1}</span>
                    <span className="text-muted-foreground">{rot[i]}°</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading pages...
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => { setFile(null); setBytes(null); setThumbs([]); setRot([]); }} disabled={busy}>
              Choose another file
            </Button>
            <Button variant="hero" size="lg" onClick={apply} disabled={busy || !thumbs.length}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {busy ? "Saving..." : "Apply & download"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default RotatePdf;
