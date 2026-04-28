import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, Loader2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const CropPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [m, setM] = useState({ top: 20, right: 20, bottom: 20, left: 20 });
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const pdf = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      pdf.getPages().forEach((p) => {
        const { width, height } = p.getSize();
        const x = m.left, y = m.bottom;
        const w = Math.max(10, width - m.left - m.right);
        const h = Math.max(10, height - m.top - m.bottom);
        p.setCropBox(x, y, w, h);
        p.setMediaBox(x, y, w, h);
      });
      const out = await pdf.save();
      const url = URL.createObjectURL(new Blob([out as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = file.name.replace(/\.pdf$/i, "") + "-cropped.pdf"; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Done", description: "PDF cropped." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const fields: (keyof typeof m)[] = ["top", "right", "bottom", "left"];

  return (
    <div className="space-y-6">
      {!file && <FileDropzone onFiles={(f) => setFile(f[0] ?? null)} accept={{ "application/pdf": [".pdf"] }} multiple={false} label="Select a PDF" hint="Trim margins from every page (values in points, 72 = 1 inch)." />}
      {file && (
        <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">{file.name}</p>
          <div className="grid gap-4 sm:grid-cols-4">
            {fields.map((k) => (
              <div key={k}>
                <Label className="capitalize">{k} margin</Label>
                <Input type="number" min={0} value={m[k]} onChange={(e) => setM({ ...m, [k]: Number(e.target.value) })} className="mt-1.5" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setFile(null)} disabled={busy}>Choose another</Button>
            <Button variant="hero" size="lg" onClick={run} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {busy ? "Working..." : "Crop PDF"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropPdf;
