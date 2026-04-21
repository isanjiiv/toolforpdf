import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Download, Loader2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

type Quality = "low" | "medium" | "high";
const SCALE: Record<Quality, number> = { low: 1.0, medium: 1.4, high: 2.0 };
const JPEG_Q: Record<Quality, number> = { low: 0.55, medium: 0.72, high: 0.85 };

const CompressPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [quality, setQuality] = useState<Quality>("medium");
  const [result, setResult] = useState<{ url: string; size: number; orig: number } | null>(null);

  const compress = async (f: File) => {
    setBusy(true);
    setResult(null);
    try {
      const buf = new Uint8Array(await f.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data: buf.slice() }).promise;
      const out = await PDFDocument.create();
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: SCALE[quality] });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_Q[quality]);
        const jpgBytes = Uint8Array.from(atob(dataUrl.split(",")[1]), (c) => c.charCodeAt(0));
        const img = await out.embedJpg(jpgBytes);
        const p = out.addPage([viewport.width, viewport.height]);
        p.drawImage(img, { x: 0, y: 0, width: viewport.width, height: viewport.height });
      }
      const data = await out.save();
      const blob = new Blob([data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setResult({ url, size: blob.size, orig: f.size });
      toast({ title: "Compressed", description: `${(blob.size / 1024).toFixed(0)} KB ready.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Compression failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleFiles = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    compress(f);
  };

  const download = () => {
    if (!result || !file) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = file.name.replace(/\.pdf$/i, "") + "-compressed.pdf";
    a.click();
  };

  const reduction = result ? Math.max(0, Math.round((1 - result.size / result.orig) * 100)) : 0;

  return (
    <div className="space-y-6">
      {!file && (
        <>
          <div className="space-y-3">
            <Label>Compression level</Label>
            <div className="flex flex-wrap gap-2">
              {(["low", "medium", "high"] as Quality[]).map((q) => (
                <Button key={q} variant={quality === q ? "hero" : "soft"} size="sm" onClick={() => setQuality(q)}>
                  {q === "low" ? "Strong (smallest)" : q === "medium" ? "Recommended" : "Less compression"}
                </Button>
              ))}
            </div>
          </div>
          <FileDropzone onFiles={handleFiles} accept={{ "application/pdf": [".pdf"] }} multiple={false}
            label="Select a PDF to compress" hint="Pages are re-rendered as JPEGs to shrink the file." />
        </>
      )}

      {file && (
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-card">
          {busy && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary-deep" />
              Compressing {file.name}...
            </div>
          )}
          {result && !busy && (
            <>
              <p className="text-sm text-muted-foreground">{file.name}</p>
              <div className="my-4 flex items-center justify-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Original</p>
                  <p className="font-display text-xl font-bold">{(result.orig / 1024).toFixed(0)} KB</p>
                </div>
                <div className="text-3xl text-muted-foreground">→</div>
                <div>
                  <p className="text-xs text-muted-foreground">Compressed</p>
                  <p className="font-display text-xl font-bold text-primary-deep">{(result.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <p className="mb-5 inline-block rounded-full bg-success/15 px-3 py-1 text-sm font-semibold text-success">
                {reduction}% smaller
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button variant="ghost" onClick={() => { setFile(null); setResult(null); }}>Choose another</Button>
                <Button variant="hero" size="lg" onClick={download}>
                  <Download className="h-4 w-4" /> Download compressed
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CompressPdf;
