import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, Loader2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const layouts: Record<string, { cols: number; rows: number }> = {
  "2": { cols: 2, rows: 1 },
  "4": { cols: 2, rows: 2 },
  "6": { cols: 3, rows: 2 },
  "9": { cols: 3, rows: 3 },
};

const NupPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [layout, setLayout] = useState("4");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const src = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      const out = await PDFDocument.create();
      const { cols, rows } = layouts[layout];
      const per = cols * rows;
      const pages = src.getPages();
      const A4 = [595.28, 841.89] as const;
      const cellW = A4[0] / cols;
      const cellH = A4[1] / rows;
      const embedded = await out.embedPages(pages);
      for (let i = 0; i < embedded.length; i += per) {
        const sheet = out.addPage([A4[0], A4[1]]);
        for (let j = 0; j < per && i + j < embedded.length; j++) {
          const ep = embedded[i + j];
          const c = j % cols;
          const r = Math.floor(j / cols);
          const scale = Math.min(cellW / ep.width, cellH / ep.height) * 0.95;
          const w = ep.width * scale; const h = ep.height * scale;
          const x = c * cellW + (cellW - w) / 2;
          const y = A4[1] - (r + 1) * cellH + (cellH - h) / 2;
          sheet.drawPage(ep, { x, y, xScale: scale, yScale: scale });
        }
      }
      const data = await out.save();
      const url = URL.createObjectURL(new Blob([data as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = file.name.replace(/\.pdf$/i, "") + `-${layout}up.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Done", description: `${layout} pages per sheet.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed", variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      {!file && <FileDropzone onFiles={(f) => setFile(f[0] ?? null)} accept={{ "application/pdf": [".pdf"] }} multiple={false} label="Select a PDF" hint="Save paper by placing multiple pages on one sheet." />}
      {file && (
        <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">{file.name}</p>
          <div>
            <Label>Pages per sheet</Label>
            <Select value={layout} onValueChange={setLayout}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 (1×2)</SelectItem>
                <SelectItem value="4">4 (2×2)</SelectItem>
                <SelectItem value="6">6 (2×3)</SelectItem>
                <SelectItem value="9">9 (3×3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setFile(null)} disabled={busy}>Choose another</Button>
            <Button variant="hero" size="lg" onClick={run} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {busy ? "Working..." : "Build N-up PDF"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NupPdf;
