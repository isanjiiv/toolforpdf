import { useEffect, useRef, useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Download, Loader2, Plus, Trash2, Type } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface TextItem {
  id: string;
  page: number; // 0-based
  xRatio: number; // 0..1 of canvas width
  yRatio: number; // 0..1 of canvas height (from top)
  text: string;
  size: number;
  color: string; // hex
}

const hexToRgb = (hex: string) => {
  const m = hex.replace("#", "");
  const n = parseInt(m, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
};

const EditPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [thumbs, setThumbs] = useState<{ url: string; w: number; h: number }[]>([]);
  const [items, setItems] = useState<TextItem[]>([]);
  const [activePage, setActivePage] = useState(0);
  const [text, setText] = useState("Your text");
  const [size, setSize] = useState(18);
  const [color, setColor] = useState("#1a1a1a");
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    const buf = new Uint8Array(await f.arrayBuffer());
    setBytes(buf);
    const pdf = await pdfjsLib.getDocument({ data: buf.slice() }).promise;
    const out: { url: string; w: number; h: number }[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.4 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      out.push({ url: canvas.toDataURL("image/jpeg", 0.85), w: viewport.width, h: viewport.height });
    }
    setThumbs(out);
    setActivePage(0);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), page: activePage, xRatio, yRatio, text, size, color },
    ]);
  };

  const removeItem = (id: string) => setItems((p) => p.filter((i) => i.id !== id));

  const save = async () => {
    if (!bytes || !file) return;
    setBusy(true);
    try {
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();
      for (const item of items) {
        const page = pages[item.page];
        if (!page) continue;
        const { width: pw, height: ph } = page.getSize();
        const x = item.xRatio * pw;
        // pdf coords origin is bottom-left
        const y = ph - item.yRatio * ph - item.size;
        const c = hexToRgb(item.color);
        page.drawText(item.text, {
          x, y, size: item.size, font,
          color: rgb(c.r, c.g, c.b),
        });
      }
      const data = await pdf.save();
      const blob = new Blob([data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + "-edited.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Saved", description: "Edited PDF downloaded." });
    } catch (e) {
      console.error(e);
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => () => thumbs.forEach((t) => URL.revokeObjectURL(t.url)), []);

  const pageItems = items.filter((i) => i.page === activePage);
  const current = thumbs[activePage];

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone onFiles={handleFiles} accept={{ "application/pdf": [".pdf"] }} multiple={false}
          label="Select a PDF to edit" hint="Click anywhere on a page to drop text on it." />
      )}

      {file && current && (
        <div className="grid gap-5 md:grid-cols-[260px_1fr]">
          <aside className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card">
            <div>
              <Label htmlFor="edit-text" className="text-xs">Text</Label>
              <Input id="edit-text" value={text} onChange={(e) => setText(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Size</Label>
                <Input type="number" min={6} max={120} value={size} onChange={(e) => setSize(parseInt(e.target.value) || 18)} />
              </div>
              <div>
                <Label className="text-xs">Color</Label>
                <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 cursor-pointer p-1" />
              </div>
            </div>
            <p className="rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
              <Type className="mr-1 inline h-3.5 w-3.5" />
              Click on the page to place text.
            </p>

            <div>
              <Label className="text-xs">Pages</Label>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {thumbs.map((_, i) => (
                  <button key={i} onClick={() => setActivePage(i)}
                    className={cn(
                      "h-8 w-8 rounded-md border text-xs font-bold transition-smooth",
                      activePage === i ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary hover:border-primary/50"
                    )}>{i + 1}</button>
                ))}
              </div>
            </div>

            {pageItems.length > 0 && (
              <div>
                <Label className="text-xs">On this page</Label>
                <ul className="mt-1.5 space-y-1">
                  {pageItems.map((it) => (
                    <li key={it.id} className="flex items-center justify-between rounded-md bg-secondary px-2 py-1 text-xs">
                      <span className="truncate">{it.text}</span>
                      <button onClick={() => removeItem(it.id)} className="text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          <div className="space-y-3">
            <div ref={containerRef} onClick={onCanvasClick}
              className="relative mx-auto cursor-crosshair overflow-hidden rounded-xl border border-border bg-card shadow-card"
              style={{ aspectRatio: `${current.w} / ${current.h}`, maxWidth: 720 }}>
              <img src={current.url} alt="page" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
              {pageItems.map((it) => (
                <span key={it.id}
                  className="pointer-events-none absolute whitespace-nowrap"
                  style={{
                    left: `${it.xRatio * 100}%`,
                    top: `${it.yRatio * 100}%`,
                    fontSize: it.size,
                    color: it.color,
                    fontFamily: "Helvetica, Arial, sans-serif",
                  }}>
                  {it.text}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => { setFile(null); setBytes(null); setThumbs([]); setItems([]); }} disabled={busy}>
                Choose another file
              </Button>
              <Button variant="hero" size="lg" onClick={save} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {busy ? "Saving..." : "Download edited PDF"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditPdf;
