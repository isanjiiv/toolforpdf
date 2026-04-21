import { useState } from "react";
import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Download, Loader2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";

const WatermarkPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(30);
  const [size, setSize] = useState(60);
  const [angle, setAngle] = useState(45);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setBytes(new Uint8Array(await f.arrayBuffer()));
  };

  const apply = async () => {
    if (!bytes || !file) return;
    setBusy(true);
    try {
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      pdf.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, size);
        page.drawText(text, {
          x: width / 2 - textWidth / 2,
          y: height / 2 - size / 2,
          size,
          font,
          color: rgb(0.95, 0.75, 0),
          opacity: opacity / 100,
          rotate: degrees(angle),
        });
      });
      const data = await pdf.save();
      const blob = new Blob([data as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + "-watermarked.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Watermark added" });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone onFiles={handleFiles} accept={{ "application/pdf": [".pdf"] }} multiple={false}
          label="Select a PDF to watermark" hint="Add a text stamp across every page." />
      )}

      {file && (
        <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">{file.name}</p>

          <div>
            <Label htmlFor="wm-text">Watermark text</Label>
            <Input id="wm-text" value={text} onChange={(e) => setText(e.target.value)} className="mt-1.5" />
          </div>

          <div>
            <Label>Opacity: {opacity}%</Label>
            <Slider value={[opacity]} min={5} max={100} step={1} onValueChange={(v) => setOpacity(v[0])} className="mt-2" />
          </div>
          <div>
            <Label>Font size: {size}pt</Label>
            <Slider value={[size]} min={20} max={140} step={2} onValueChange={(v) => setSize(v[0])} className="mt-2" />
          </div>
          <div>
            <Label>Rotation: {angle}°</Label>
            <Slider value={[angle]} min={-90} max={90} step={5} onValueChange={(v) => setAngle(v[0])} className="mt-2" />
          </div>

          {/* Live preview */}
          <div className="relative grid h-48 place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-secondary/40">
            <span style={{
              fontSize: Math.min(size, 64),
              opacity: opacity / 100,
              transform: `rotate(${angle}deg)`,
              color: "#e6b800",
              fontWeight: 800,
              fontFamily: "Helvetica, Arial, sans-serif",
            }}>{text}</span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => { setFile(null); setBytes(null); }} disabled={busy}>Choose another</Button>
            <Button variant="hero" size="lg" onClick={apply} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {busy ? "Applying..." : "Add watermark & download"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatermarkPdf;
