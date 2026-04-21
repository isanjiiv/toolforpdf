import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ArrowDown, ArrowUp, Download, Loader2, Trash2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Item {
  file: File;
  url: string;
}

const JpgToPdf = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  const addFiles = (incoming: File[]) => {
    const imgs = incoming.filter((f) => /image\/(jpe?g|png)/.test(f.type));
    if (!imgs.length) {
      toast({ title: "Images only", description: "Please add JPG or PNG files." });
      return;
    }
    const next = imgs.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setItems((prev) => [...prev, ...next]);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const copy = [...items];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setItems(copy);
  };

  const remove = (i: number) => {
    URL.revokeObjectURL(items[i].url);
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  };

  const convert = async () => {
    if (!items.length) return;
    setBusy(true);
    try {
      const pdf = await PDFDocument.create();
      for (const { file } of items) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const isPng = file.type === "image/png";
        const img = isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
        const page = pdf.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const out = await pdf.save();
      const blob = new Blob([out], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "images.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF created", description: `${items.length} image(s) converted.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Conversion failed", description: "Please try with different images.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        onFiles={addFiles}
        accept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] }}
        label="Select JPG or PNG images"
        hint="Each image becomes a single PDF page in the order shown."
      />

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item, i) => (
            <div key={i} className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <div className="aspect-square bg-secondary">
                <img src={item.url} alt={item.file.name} className="h-full w-full object-cover" />
              </div>
              <div className="px-2 py-1.5 text-[11px] truncate text-muted-foreground">{item.file.name}</div>
              <div className="absolute inset-x-1 top-1 flex items-center justify-between opacity-0 transition-smooth group-hover:opacity-100">
                <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => remove(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {items.length > 0 && (
          <Button variant="ghost" onClick={() => { items.forEach(i => URL.revokeObjectURL(i.url)); setItems([]); }} disabled={busy}>
            Clear all
          </Button>
        )}
        <Button variant="hero" size="lg" onClick={convert} disabled={busy || !items.length}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {busy ? "Converting..." : "Convert to PDF"}
        </Button>
      </div>
    </div>
  );
};

export default JpgToPdf;
