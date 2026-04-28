import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, Eraser, Loader2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const SignPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [pos, setPos] = useState<"br" | "bl" | "tr" | "tl" | "center">("br");
  const [width, setWidth] = useState(180);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const onFile = async (files: File[]) => {
    const f = files[0]; if (!f) return;
    setFile(f);
    const pdf = await PDFDocument.load(new Uint8Array(await f.arrayBuffer()));
    setPageCount(pdf.getPageCount());
    setPageNum(1);
  };

  const start = (x: number, y: number) => {
    drawing.current = true; last.current = { x, y };
  };
  const move = (x: number, y: number) => {
    if (!drawing.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = "#0f172a";
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last.current = { x, y };
  };
  const end = () => { drawing.current = false; last.current = null; };

  const ptr = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const clearCanvas = () => {
    const c = canvasRef.current; if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
  };

  const run = async () => {
    if (!file || !canvasRef.current) return;
    setBusy(true);
    try {
      const pngUrl = canvasRef.current.toDataURL("image/png");
      const pngBytes = Uint8Array.from(atob(pngUrl.split(",")[1]), (c) => c.charCodeAt(0));
      const pdf = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      const png = await pdf.embedPng(pngBytes);
      const ratio = png.width / png.height;
      const w = width; const h = w / ratio;
      const page = pdf.getPage(Math.max(0, Math.min(pageCount - 1, pageNum - 1)));
      const { width: pw, height: ph } = page.getSize();
      const margin = 36;
      let x = pw - w - margin, y = margin;
      if (pos === "bl") { x = margin; }
      if (pos === "tr") { x = pw - w - margin; y = ph - h - margin; }
      if (pos === "tl") { x = margin; y = ph - h - margin; }
      if (pos === "center") { x = (pw - w) / 2; y = (ph - h) / 2; }
      page.drawImage(png, { x, y, width: w, height: h });
      const out = await pdf.save();
      const url = URL.createObjectURL(new Blob([out as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = file.name.replace(/\.pdf$/i, "") + "-signed.pdf"; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Signed", description: "Signature added." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed", variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      {!file && <FileDropzone onFiles={onFile} accept={{ "application/pdf": [".pdf"] }} multiple={false} label="Select a PDF to sign" hint="Draw your signature, then place it on a page." />}
      {file && (
        <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-sm text-muted-foreground">{file.name} — {pageCount} pages</p>
          <div>
            <Label>Draw signature</Label>
            <div className="mt-1.5 rounded-xl border border-border bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="block w-full touch-none rounded-xl"
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); const p = ptr(e); start(p.x, p.y); }}
                onPointerMove={(e) => { const p = ptr(e); move(p.x, p.y); }}
                onPointerUp={end}
                onPointerLeave={end}
              />
            </div>
            <div className="mt-2 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearCanvas}><Eraser className="h-4 w-4" /> Clear</Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Page</Label>
              <Input type="number" min={1} max={pageCount} value={pageNum} onChange={(e) => setPageNum(Number(e.target.value))} className="mt-1.5" />
            </div>
            <div>
              <Label>Position</Label>
              <Select value={pos} onValueChange={(v) => setPos(v as typeof pos)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="br">Bottom right</SelectItem>
                  <SelectItem value="bl">Bottom left</SelectItem>
                  <SelectItem value="tr">Top right</SelectItem>
                  <SelectItem value="tl">Top left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Width (pt)</Label>
              <Input type="number" min={50} max={500} value={width} onChange={(e) => setWidth(Number(e.target.value))} className="mt-1.5" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setFile(null)} disabled={busy}>Choose another</Button>
            <Button variant="hero" size="lg" onClick={run} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {busy ? "Working..." : "Sign & download"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignPdf;
