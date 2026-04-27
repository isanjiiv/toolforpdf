import { useEffect, useRef, useState } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  Download, Loader2, Trash2, Type, Highlighter, Image as ImageIcon,
  PenTool, Undo2, MousePointer2, Square,
} from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

type Tool = "select" | "text" | "highlight" | "rect" | "image" | "draw";

interface BaseItem {
  id: string;
  page: number;
  type: "text" | "highlight" | "rect" | "image" | "draw";
}
interface TextItem extends BaseItem {
  type: "text";
  xRatio: number;
  yRatio: number;
  text: string;
  size: number;
  color: string;
}
interface RectItem extends BaseItem {
  type: "highlight" | "rect";
  xRatio: number;
  yRatio: number;
  wRatio: number;
  hRatio: number;
  color: string;
  opacity: number; // 0..1
}
interface ImageItem extends BaseItem {
  type: "image";
  xRatio: number;
  yRatio: number;
  wRatio: number;
  hRatio: number;
  dataUrl: string;
  mime: "image/png" | "image/jpeg";
}
interface DrawItem extends BaseItem {
  type: "draw";
  points: { x: number; y: number }[]; // ratios
  color: string;
  width: number; // px in display
}
type AnyItem = TextItem | RectItem | ImageItem | DrawItem;

const hexToRgb = (hex: string) => {
  const m = hex.replace("#", "");
  const n = parseInt(m, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
};

const EditPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [thumbs, setThumbs] = useState<{ url: string; w: number; h: number }[]>([]);
  const [items, setItems] = useState<AnyItem[]>([]);
  const [activePage, setActivePage] = useState(0);
  const [tool, setTool] = useState<Tool>("text");

  // shared style controls
  const [text, setText] = useState("Your text");
  const [size, setSize] = useState(18);
  const [color, setColor] = useState("#1a1a1a");
  const [highlightColor, setHighlightColor] = useState("#ffeb3b");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [pendingImage, setPendingImage] = useState<{ dataUrl: string; mime: "image/png" | "image/jpeg" } | null>(null);

  // drag state
  const [drag, setDrag] = useState<
    | { kind: "rect"; startX: number; startY: number; id: string }
    | { kind: "draw"; id: string }
    | { kind: "image"; startX: number; startY: number; id: string }
    | null
  >(null);

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

  const getRatios = (e: React.MouseEvent | React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return {
      x: ((e as any).clientX - rect.left) / rect.width,
      y: ((e as any).clientY - rect.top) / rect.height,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (tool === "select") return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    const { x, y } = getRatios(e);

    if (tool === "text") {
      setItems((p) => [
        ...p,
        { id: crypto.randomUUID(), type: "text", page: activePage, xRatio: x, yRatio: y, text, size, color },
      ]);
      return;
    }
    if (tool === "highlight" || tool === "rect") {
      const id = crypto.randomUUID();
      setItems((p) => [
        ...p,
        {
          id, type: tool, page: activePage,
          xRatio: x, yRatio: y, wRatio: 0, hRatio: 0,
          color: tool === "highlight" ? highlightColor : color,
          opacity: tool === "highlight" ? 0.4 : 1,
        } as RectItem,
      ]);
      setDrag({ kind: "rect", startX: x, startY: y, id });
      return;
    }
    if (tool === "image") {
      if (!pendingImage) {
        toast({ title: "Pick an image first", description: "Use the Upload button in the sidebar." });
        return;
      }
      const id = crypto.randomUUID();
      setItems((p) => [
        ...p,
        {
          id, type: "image", page: activePage,
          xRatio: x, yRatio: y, wRatio: 0, hRatio: 0,
          dataUrl: pendingImage.dataUrl, mime: pendingImage.mime,
        } as ImageItem,
      ]);
      setDrag({ kind: "image", startX: x, startY: y, id });
      return;
    }
    if (tool === "draw") {
      const id = crypto.randomUUID();
      setItems((p) => [
        ...p,
        { id, type: "draw", page: activePage, points: [{ x, y }], color, width: strokeWidth } as DrawItem,
      ]);
      setDrag({ kind: "draw", id });
      return;
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const { x, y } = getRatios(e);
    if (drag.kind === "rect" || drag.kind === "image") {
      const sx = drag.startX, sy = drag.startY;
      setItems((p) =>
        p.map((it) =>
          it.id === drag.id
            ? ({ ...(it as any), xRatio: Math.min(sx, x), yRatio: Math.min(sy, y), wRatio: Math.abs(x - sx), hRatio: Math.abs(y - sy) } as AnyItem)
            : it
        )
      );
    } else if (drag.kind === "draw") {
      setItems((p) =>
        p.map((it) => (it.id === drag.id && it.type === "draw" ? { ...it, points: [...it.points, { x, y }] } : it))
      );
    }
  };

  const onPointerUp = () => {
    if (!drag) return;
    // discard zero-size rects/images
    setItems((p) =>
      p.filter((it) => {
        if ((it.type === "highlight" || it.type === "rect" || it.type === "image") && it.id === (drag as any).id) {
          return (it as RectItem | ImageItem).wRatio > 0.005 && (it as RectItem | ImageItem).hRatio > 0.005;
        }
        return true;
      })
    );
    setDrag(null);
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const mime: "image/png" | "image/jpeg" = f.type === "image/png" ? "image/png" : "image/jpeg";
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage({ dataUrl: reader.result as string, mime });
      setTool("image");
      toast({ title: "Image ready", description: "Drag on the page to place it." });
    };
    reader.readAsDataURL(f);
  };

  const removeItem = (id: string) => setItems((p) => p.filter((i) => i.id !== id));
  const undo = () => setItems((p) => p.slice(0, -1));

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

        if (item.type === "text") {
          const c = hexToRgb(item.color);
          page.drawText(item.text, {
            x: item.xRatio * pw,
            y: ph - item.yRatio * ph - item.size,
            size: item.size,
            font,
            color: rgb(c.r, c.g, c.b),
          });
        } else if (item.type === "highlight" || item.type === "rect") {
          const c = hexToRgb(item.color);
          page.drawRectangle({
            x: item.xRatio * pw,
            y: ph - (item.yRatio + item.hRatio) * ph,
            width: item.wRatio * pw,
            height: item.hRatio * ph,
            color: rgb(c.r, c.g, c.b),
            opacity: item.opacity,
          });
        } else if (item.type === "image") {
          const bin = Uint8Array.from(atob(item.dataUrl.split(",")[1]), (ch) => ch.charCodeAt(0));
          const img = item.mime === "image/png" ? await pdf.embedPng(bin) : await pdf.embedJpg(bin);
          page.drawImage(img, {
            x: item.xRatio * pw,
            y: ph - (item.yRatio + item.hRatio) * ph,
            width: item.wRatio * pw,
            height: item.hRatio * ph,
          });
        } else if (item.type === "draw") {
          if (item.points.length < 2) continue;
          const c = hexToRgb(item.color);
          for (let i = 1; i < item.points.length; i++) {
            const a = item.points[i - 1];
            const b = item.points[i];
            page.drawLine({
              start: { x: a.x * pw, y: ph - a.y * ph },
              end: { x: b.x * pw, y: ph - b.y * ph },
              thickness: item.width,
              color: rgb(c.r, c.g, c.b),
            });
          }
        }
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

  const tools: { id: Tool; label: string; icon: typeof Type }[] = [
    { id: "select", label: "Select", icon: MousePointer2 },
    { id: "text", label: "Text", icon: Type },
    { id: "highlight", label: "Highlight", icon: Highlighter },
    { id: "rect", label: "Rectangle", icon: Square },
    { id: "image", label: "Image", icon: ImageIcon },
    { id: "draw", label: "Draw", icon: PenTool },
  ];

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone onFiles={handleFiles} accept={{ "application/pdf": [".pdf"] }} multiple={false}
          label="Select a PDF to edit" hint="Add text, highlights, shapes, images, and signatures." />
      )}

      {file && current && (
        <div className="grid gap-5 md:grid-cols-[280px_1fr]">
          <aside className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card">
            <div>
              <Label className="text-xs">Tool</Label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {tools.map(({ id, label, icon: I }) => (
                  <button key={id} onClick={() => setTool(id)} title={label}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-medium transition-smooth",
                      tool === id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary hover:border-primary/50"
                    )}>
                    <I className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {tool === "text" && (
              <>
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
              </>
            )}

            {tool === "highlight" && (
              <div>
                <Label className="text-xs">Highlight color</Label>
                <Input type="color" value={highlightColor} onChange={(e) => setHighlightColor(e.target.value)} className="h-10 cursor-pointer p-1" />
              </div>
            )}

            {tool === "rect" && (
              <div>
                <Label className="text-xs">Fill color</Label>
                <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 cursor-pointer p-1" />
              </div>
            )}

            {tool === "draw" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Stroke</Label>
                  <Input type="number" min={1} max={20} value={strokeWidth} onChange={(e) => setStrokeWidth(parseInt(e.target.value) || 3)} />
                </div>
                <div>
                  <Label className="text-xs">Color</Label>
                  <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 cursor-pointer p-1" />
                </div>
              </div>
            )}

            {tool === "image" && (
              <div>
                <Label className="text-xs">Upload image</Label>
                <Input type="file" accept="image/png,image/jpeg" onChange={onPickImage} className="mt-1.5" />
                {pendingImage && (
                  <p className="mt-1.5 text-xs text-muted-foreground">Drag on the page to place it.</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={undo} disabled={!items.length}>
                <Undo2 className="h-3.5 w-3.5" /> Undo
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setItems([])} disabled={!items.length}>
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </Button>
            </div>

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
                <Label className="text-xs">On this page ({pageItems.length})</Label>
                <ul className="mt-1.5 max-h-40 space-y-1 overflow-auto">
                  {pageItems.map((it) => (
                    <li key={it.id} className="flex items-center justify-between rounded-md bg-secondary px-2 py-1 text-xs">
                      <span className="truncate capitalize">
                        {it.type}{it.type === "text" ? `: ${it.text}` : ""}
                      </span>
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
            <div
              ref={containerRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className={cn(
                "relative mx-auto select-none overflow-hidden rounded-xl border border-border bg-card shadow-card touch-none",
                tool === "select" ? "cursor-default" : "cursor-crosshair"
              )}
              style={{ aspectRatio: `${current.w} / ${current.h}`, maxWidth: 720 }}
            >
              <img src={current.url} alt="page" className="pointer-events-none absolute inset-0 h-full w-full object-contain" draggable={false} />

              {pageItems.map((it) => {
                if (it.type === "text") {
                  return (
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
                  );
                }
                if (it.type === "highlight" || it.type === "rect") {
                  return (
                    <div key={it.id}
                      className="pointer-events-none absolute"
                      style={{
                        left: `${it.xRatio * 100}%`,
                        top: `${it.yRatio * 100}%`,
                        width: `${it.wRatio * 100}%`,
                        height: `${it.hRatio * 100}%`,
                        background: it.color,
                        opacity: it.opacity,
                      }}
                    />
                  );
                }
                if (it.type === "image") {
                  return (
                    <img key={it.id} src={it.dataUrl} alt=""
                      className="pointer-events-none absolute"
                      style={{
                        left: `${it.xRatio * 100}%`,
                        top: `${it.yRatio * 100}%`,
                        width: `${it.wRatio * 100}%`,
                        height: `${it.hRatio * 100}%`,
                      }}
                    />
                  );
                }
                if (it.type === "draw") {
                  const d = it.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x * 100} ${p.y * 100}`).join(" ");
                  return (
                    <svg key={it.id} viewBox="0 0 100 100" preserveAspectRatio="none"
                      className="pointer-events-none absolute inset-0 h-full w-full">
                      <path d={d} stroke={it.color} strokeWidth={(it.width / current.w) * 100} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    </svg>
                  );
                }
                return null;
              })}
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
