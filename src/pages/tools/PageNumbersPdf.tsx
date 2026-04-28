import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Download, Loader2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

type Pos = "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";

const PageNumbersPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pos, setPos] = useState<Pos>("bottom-center");
  const [size, setSize] = useState(12);
  const [start, setStart] = useState(1);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const pdf = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();
      pages.forEach((p, i) => {
        const text = `${i + start} / ${pages.length + start - 1}`;
        const tw = font.widthOfTextAtSize(text, size);
        const { width, height } = p.getSize();
        const margin = 24;
        let x = margin, y = margin;
        if (pos.includes("right")) x = width - tw - margin;
        if (pos.includes("center")) x = (width - tw) / 2;
        if (pos.startsWith("top")) y = height - margin - size;
        p.drawText(text, { x, y, size, font, color: rgb(0.2, 0.2, 0.2) });
      });
      const out = await pdf.save();
      const url = URL.createObjectURL(new Blob([out as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + "-numbered.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Done", description: "Page numbers added." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file && <FileDropzone onFiles={(f) => setFile(f[0] ?? null)} accept={{ "application/pdf": [".pdf"] }} multiple={false} label="Select a PDF" />}
      {file && (
        <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">{file.name}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Position</Label>
              <Select value={pos} onValueChange={(v) => setPos(v as Pos)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-center">Bottom center</SelectItem>
                  <SelectItem value="bottom-right">Bottom right</SelectItem>
                  <SelectItem value="bottom-left">Bottom left</SelectItem>
                  <SelectItem value="top-center">Top center</SelectItem>
                  <SelectItem value="top-right">Top right</SelectItem>
                  <SelectItem value="top-left">Top left</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Font size</Label>
              <Input type="number" min={6} max={48} value={size} onChange={(e) => setSize(Number(e.target.value))} className="mt-1.5" />
            </div>
            <div>
              <Label>Start at</Label>
              <Input type="number" min={1} value={start} onChange={(e) => setStart(Number(e.target.value))} className="mt-1.5" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setFile(null)} disabled={busy}>Choose another</Button>
            <Button variant="hero" size="lg" onClick={run} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {busy ? "Working..." : "Add page numbers"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageNumbersPdf;
