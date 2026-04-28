import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, Loader2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const parseRanges = (s: string, max: number): number[] => {
  const out = new Set<number>();
  s.split(",").map((p) => p.trim()).filter(Boolean).forEach((p) => {
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const a = Math.max(1, +m[1]); const b = Math.min(max, +m[2]);
      for (let i = a; i <= b; i++) out.add(i);
    } else if (/^\d+$/.test(p)) {
      const n = +p; if (n >= 1 && n <= max) out.add(n);
    }
  });
  return [...out].sort((a, b) => a - b);
};

const ExtractPages = () => {
  const [file, setFile] = useState<File | null>(null);
  const [count, setCount] = useState(0);
  const [ranges, setRanges] = useState("1");
  const [busy, setBusy] = useState(false);

  const onFile = async (files: File[]) => {
    const f = files[0]; if (!f) return;
    setFile(f);
    const pdf = await PDFDocument.load(new Uint8Array(await f.arrayBuffer()));
    setCount(pdf.getPageCount());
    setRanges(`1-${pdf.getPageCount()}`);
  };

  const run = async () => {
    if (!file) return;
    const pages = parseRanges(ranges, count);
    if (!pages.length) { toast({ title: "No valid pages", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const src = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, pages.map((p) => p - 1));
      copied.forEach((p) => out.addPage(p));
      const data = await out.save();
      const url = URL.createObjectURL(new Blob([data as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = file.name.replace(/\.pdf$/i, "") + "-extracted.pdf"; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Done", description: `${pages.length} page(s) extracted.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed", variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      {!file && <FileDropzone onFiles={onFile} accept={{ "application/pdf": [".pdf"] }} multiple={false} label="Select a PDF" />}
      {file && (
        <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">{file.name} — {count} pages</p>
          <div>
            <Label>Pages to extract</Label>
            <Input value={ranges} onChange={(e) => setRanges(e.target.value)} className="mt-1.5" placeholder="e.g. 1-3, 5, 8-10" />
            <p className="mt-1 text-xs text-muted-foreground">Use commas and ranges. Available: 1-{count}.</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setFile(null)} disabled={busy}>Choose another</Button>
            <Button variant="hero" size="lg" onClick={run} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {busy ? "Working..." : "Extract pages"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtractPages;
