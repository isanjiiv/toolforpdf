import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { ArrowLeft, ArrowRight, Download, Loader2, Trash2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface Page {
  origIndex: number; // original index 0-based
  thumb: string;
  removed: boolean;
}

const OrganizePdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    const buf = new Uint8Array(await f.arrayBuffer());
    setBytes(buf);
    const pdf = await pdfjsLib.getDocument({ data: buf.slice() }).promise;
    const out: Page[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.4 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      out.push({ origIndex: i - 1, thumb: canvas.toDataURL("image/jpeg", 0.7), removed: false });
    }
    setPages(out);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= pages.length) return;
    const copy = [...pages];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setPages(copy);
  };
  const toggleRemove = (i: number) => setPages((p) => p.map((x, idx) => idx === i ? { ...x, removed: !x.removed } : x));

  const save = async () => {
    if (!bytes || !file) return;
    const kept = pages.filter((p) => !p.removed);
    if (!kept.length) { toast({ title: "No pages to save" }); return; }
    setBusy(true);
    try {
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, kept.map((p) => p.origIndex));
      copied.forEach((p) => out.addPage(p));
      const data = await out.save();
      const blob = new Blob([data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + "-organized.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Saved", description: `${kept.length} pages exported.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone onFiles={handleFiles} accept={{ "application/pdf": [".pdf"] }} multiple={false}
          label="Select a PDF to organize" hint="Reorder, delete and rearrange pages." />
      )}

      {file && (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{file.name}</span>
            <span>{pages.filter((p) => !p.removed).length} of {pages.length} pages kept</span>
          </div>

          {pages.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {pages.map((p, i) => (
                <div key={i}
                  className={cn(
                    "relative overflow-hidden rounded-xl border bg-card shadow-card transition-smooth",
                    p.removed ? "border-destructive/40 opacity-40" : "border-border"
                  )}>
                  <div className="aspect-[3/4] bg-secondary">
                    <img src={p.thumb} alt={`Page ${p.origIndex + 1}`} className="h-full w-full object-contain" />
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 text-xs">
                    <span className="font-semibold text-foreground">#{i + 1}</span>
                    <span className="text-muted-foreground">orig {p.origIndex + 1}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 border-t border-border bg-secondary/40 p-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(i, -1)} disabled={i === 0}>
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleRemove(i)}>
                      <Trash2 className={cn("h-3.5 w-3.5", p.removed ? "text-success" : "text-destructive")} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(i, 1)} disabled={i === pages.length - 1}>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading pages...
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => { setFile(null); setBytes(null); setPages([]); }} disabled={busy}>
              Choose another file
            </Button>
            <Button variant="hero" size="lg" onClick={save} disabled={busy || !pages.length}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {busy ? "Saving..." : "Save organized PDF"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrganizePdf;
