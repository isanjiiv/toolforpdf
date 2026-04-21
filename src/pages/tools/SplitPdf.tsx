import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Download, Loader2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

type Mode = "ranges" | "extract";

const SplitPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("extract");
  const [ranges, setRanges] = useState("1-1");

  const handleFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setSelected(new Set());
    setThumbs([]);
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
  };

  const toggle = (i: number) => {
    const next = new Set(selected);
    next.has(i) ? next.delete(i) : next.add(i);
    setSelected(next);
  };

  const parseRanges = (input: string, total: number): number[][] => {
    return input
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [a, b] = part.split("-").map((s) => parseInt(s.trim(), 10));
        const start = Math.max(1, a);
        const end = Math.min(total, isNaN(b) ? a : b);
        const arr: number[] = [];
        for (let i = start; i <= end; i++) arr.push(i);
        return arr;
      })
      .filter((arr) => arr.length > 0);
  };

  const split = async () => {
    if (!bytes || !file) return;
    setBusy(true);
    try {
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const total = src.getPageCount();
      let groups: number[][] = [];
      if (mode === "extract") {
        const sel = [...selected].sort((a, b) => a - b);
        if (!sel.length) {
          toast({ title: "Select pages first" });
          setBusy(false);
          return;
        }
        groups = [sel];
      } else {
        groups = parseRanges(ranges, total);
        if (!groups.length) {
          toast({ title: "Invalid ranges", description: "Try '1-3, 5, 7-9'." });
          setBusy(false);
          return;
        }
      }
      const baseName = file.name.replace(/\.pdf$/i, "");
      for (let g = 0; g < groups.length; g++) {
        const out = await PDFDocument.create();
        const pages = await out.copyPages(src, groups[g].map((p) => p - 1));
        pages.forEach((p) => out.addPage(p));
        const data = await out.save();
        const blob = new Blob([data as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = groups.length === 1 ? `${baseName}-split.pdf` : `${baseName}-part-${g + 1}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast({ title: "Done", description: `${groups.length} file(s) downloaded.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Split failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => () => setThumbs([]), []);

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone
          onFiles={handleFiles}
          accept={{ "application/pdf": [".pdf"] }}
          multiple={false}
          label="Select a PDF to split"
          hint="Pick pages or define ranges to extract."
        />
      )}

      {file && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button variant={mode === "extract" ? "hero" : "soft"} size="sm" onClick={() => setMode("extract")}>
              Pick pages
            </Button>
            <Button variant={mode === "ranges" ? "hero" : "soft"} size="sm" onClick={() => setMode("ranges")}>
              Custom ranges
            </Button>
            <div className="ml-auto text-sm text-muted-foreground">{file.name}</div>
          </div>

          {mode === "ranges" && (
            <div>
              <Label htmlFor="ranges">Ranges (e.g. 1-3, 5, 7-9)</Label>
              <Input id="ranges" value={ranges} onChange={(e) => setRanges(e.target.value)} className="mt-1.5" />
              <p className="mt-1 text-xs text-muted-foreground">Each range becomes its own PDF file.</p>
            </div>
          )}

          {thumbs.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {thumbs.map((src, i) => {
                const idx = i + 1;
                const isSel = selected.has(idx);
                return (
                  <button
                    key={i}
                    onClick={() => mode === "extract" && toggle(idx)}
                    className={cn(
                      "relative overflow-hidden rounded-xl border-2 bg-card shadow-card transition-smooth",
                      mode === "extract" && "cursor-pointer hover:-translate-y-0.5",
                      isSel && mode === "extract" ? "border-primary ring-2 ring-primary/30" : "border-border"
                    )}
                    type="button"
                  >
                    <div className="aspect-[3/4] bg-secondary">
                      <img src={src} alt={`Page ${idx}`} className="h-full w-full object-contain" />
                    </div>
                    <div className="px-2 py-1 text-xs font-semibold text-foreground">Page {idx}</div>
                    {isSel && mode === "extract" && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading pages...
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => { setFile(null); setBytes(null); setThumbs([]); setSelected(new Set()); }} disabled={busy}>
              Choose another file
            </Button>
            <Button variant="hero" size="lg" onClick={split} disabled={busy || !thumbs.length}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {busy ? "Splitting..." : "Split & download"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default SplitPdf;
