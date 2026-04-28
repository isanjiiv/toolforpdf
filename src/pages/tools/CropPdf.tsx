import { useEffect, useRef, useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

type Side = "top" | "right" | "bottom" | "left";
type Margins = Record<Side, number>; // in PDF points

const PREVIEW_MAX = 560;

const CropPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [m, setM] = useState<Margins>({ top: 20, right: 20, bottom: 20, left: 20 });
  const [busy, setBusy] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 }); // PDF points
  const [renderSize, setRenderSize] = useState({ width: 0, height: 0 }); // CSS px
  const [applyToAll, setApplyToAll] = useState(true);
  const [perPage, setPerPage] = useState<Record<number, Margins>>({});

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const dragRef = useRef<{ side: Side | "move" | null; startX: number; startY: number; start: Margins }>({
    side: null, startX: 0, startY: 0, start: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  const currentMargins = applyToAll ? m : (perPage[pageIndex] ?? m);

  const setMargins = useCallback((next: Margins) => {
    if (applyToAll) setM(next);
    else setPerPage((p) => ({ ...p, [pageIndex]: next }));
  }, [applyToAll, pageIndex]);

  // Load PDF when file changes
  useEffect(() => {
    if (!file) {
      pdfDocRef.current = null;
      setNumPages(0);
      setPageIndex(0);
      setPerPage({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const buf = await file.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buf }).promise;
        if (cancelled) return;
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setPageIndex(0);
      } catch (e) {
        console.error(e);
        toast({ title: "Could not load PDF", variant: "destructive" });
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  // Render the current page
  useEffect(() => {
    const doc = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas || numPages === 0) return;
    let cancelled = false;
    (async () => {
      const page = await doc.getPage(pageIndex + 1);
      if (cancelled) return;
      const viewport1 = page.getViewport({ scale: 1 });
      const scale = PREVIEW_MAX / Math.max(viewport1.width, viewport1.height);
      const viewport = page.getViewport({ scale });
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      setPageSize({ width: viewport1.width, height: viewport1.height });
      setRenderSize({ width: viewport.width, height: viewport.height });
    })();
    return () => { cancelled = true; };
  }, [pageIndex, numPages]);

  // Convert PDF points <-> CSS px (uniform scale, since both axes use same scale)
  const ptToPx = renderSize.width && pageSize.width ? renderSize.width / pageSize.width : 1;

  const clampMargins = (next: Margins): Margins => {
    const minGap = 10; // points
    const maxH = Math.max(0, pageSize.width - minGap);
    const maxV = Math.max(0, pageSize.height - minGap);
    let { top, right, bottom, left } = next;
    left = Math.max(0, Math.min(left, maxH));
    right = Math.max(0, Math.min(right, maxH - left));
    top = Math.max(0, Math.min(top, maxV));
    bottom = Math.max(0, Math.min(bottom, maxV - top));
    return { top, right, bottom, left };
  };

  const onPointerDown = (side: Side | "move") => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      side,
      startX: e.clientX,
      startY: e.clientY,
      start: { ...currentMargins },
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const { side, startX, startY, start } = dragRef.current;
    if (!side) return;
    const dxPt = (e.clientX - startX) / ptToPx;
    const dyPt = (e.clientY - startY) / ptToPx;
    let next: Margins = { ...start };
    if (side === "left") next.left = start.left + dxPt;
    else if (side === "right") next.right = start.right - dxPt;
    else if (side === "top") next.top = start.top + dyPt;
    else if (side === "bottom") next.bottom = start.bottom - dyPt;
    else if (side === "move") {
      // Move the crop window: keep width/height, shift position
      const w = pageSize.width - start.left - start.right;
      const h = pageSize.height - start.top - start.bottom;
      let newLeft = start.left + dxPt;
      let newTop = start.top + dyPt;
      newLeft = Math.max(0, Math.min(newLeft, pageSize.width - w));
      newTop = Math.max(0, Math.min(newTop, pageSize.height - h));
      next = {
        left: newLeft,
        right: pageSize.width - w - newLeft,
        top: newTop,
        bottom: pageSize.height - h - newTop,
      };
    }
    setMargins(clampMargins(next));
  };

  const onPointerUp = () => { dragRef.current.side = null; };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const pdf = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      pdf.getPages().forEach((p, i) => {
        const mm = applyToAll ? m : (perPage[i] ?? m);
        const { width, height } = p.getSize();
        const x = mm.left, y = mm.bottom;
        const w = Math.max(10, width - mm.left - mm.right);
        const h = Math.max(10, height - mm.top - mm.bottom);
        p.setCropBox(x, y, w, h);
        p.setMediaBox(x, y, w, h);
      });
      const out = await pdf.save();
      const url = URL.createObjectURL(new Blob([out as BlobPart], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.pdf$/i, "") + "-cropped.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Done", description: "PDF cropped." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  // Crop rectangle in CSS pixels, top-left origin
  const cropPx = {
    left: currentMargins.left * ptToPx,
    top: currentMargins.top * ptToPx,
    right: currentMargins.right * ptToPx,
    bottom: currentMargins.bottom * ptToPx,
  };
  const cropW = Math.max(0, renderSize.width - cropPx.left - cropPx.right);
  const cropH = Math.max(0, renderSize.height - cropPx.top - cropPx.bottom);

  const fields: Side[] = ["top", "right", "bottom", "left"];

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone
          onFiles={(f) => setFile(f[0] ?? null)}
          accept={{ "application/pdf": [".pdf"] }}
          multiple={false}
          label="Select a PDF"
          hint="Drag the handles on the preview to crop, or fine-tune with the inputs below."
        />
      )}
      {file && (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Preview */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="truncate text-sm text-muted-foreground">{file.name}</p>
              {numPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                    disabled={pageIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm tabular-nums">
                    {pageIndex + 1} / {numPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPageIndex((i) => Math.min(numPages - 1, i + 1))}
                    disabled={pageIndex >= numPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <div
                ref={wrapRef}
                className="relative inline-block touch-none select-none"
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <canvas ref={canvasRef} className="block rounded-md shadow-sm" />

                {renderSize.width > 0 && (
                  <>
                    {/* Dimming overlays outside crop area */}
                    <div className="pointer-events-none absolute inset-0">
                      <div
                        className="absolute bg-foreground/40"
                        style={{ left: 0, top: 0, right: 0, height: cropPx.top }}
                      />
                      <div
                        className="absolute bg-foreground/40"
                        style={{ left: 0, bottom: 0, right: 0, height: cropPx.bottom }}
                      />
                      <div
                        className="absolute bg-foreground/40"
                        style={{ left: 0, top: cropPx.top, width: cropPx.left, bottom: cropPx.bottom }}
                      />
                      <div
                        className="absolute bg-foreground/40"
                        style={{ right: 0, top: cropPx.top, width: cropPx.right, bottom: cropPx.bottom }}
                      />
                    </div>

                    {/* Crop window border + move handle */}
                    <div
                      className="absolute cursor-move border-2 border-primary"
                      style={{ left: cropPx.left, top: cropPx.top, width: cropW, height: cropH }}
                      onPointerDown={onPointerDown("move")}
                    />

                    {/* Edge handles */}
                    <div
                      className="absolute cursor-ns-resize"
                      style={{ left: cropPx.left, top: cropPx.top - 6, width: cropW, height: 12 }}
                      onPointerDown={onPointerDown("top")}
                    />
                    <div
                      className="absolute cursor-ns-resize"
                      style={{ left: cropPx.left, top: cropPx.top + cropH - 6, width: cropW, height: 12 }}
                      onPointerDown={onPointerDown("bottom")}
                    />
                    <div
                      className="absolute cursor-ew-resize"
                      style={{ left: cropPx.left - 6, top: cropPx.top, width: 12, height: cropH }}
                      onPointerDown={onPointerDown("left")}
                    />
                    <div
                      className="absolute cursor-ew-resize"
                      style={{ left: cropPx.left + cropW - 6, top: cropPx.top, width: 12, height: cropH }}
                      onPointerDown={onPointerDown("right")}
                    />

                    {/* Corner dots */}
                    {[
                      { l: cropPx.left, t: cropPx.top },
                      { l: cropPx.left + cropW, t: cropPx.top },
                      { l: cropPx.left, t: cropPx.top + cropH },
                      { l: cropPx.left + cropW, t: cropPx.top + cropH },
                    ].map((c, i) => (
                      <div
                        key={i}
                        className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background"
                        style={{ left: c.l, top: c.t }}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Drag the edges or inside the box to adjust the crop. Values are in PDF points (72 = 1 inch).
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <Label htmlFor="apply-all" className="text-sm">Apply to all pages</Label>
              <input
                id="apply-all"
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {fields.map((k) => (
                <div key={k}>
                  <Label className="capitalize text-xs">{k}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={Math.round(currentMargins[k])}
                    onChange={(e) =>
                      setMargins(clampMargins({ ...currentMargins, [k]: Number(e.target.value) || 0 }))
                    }
                    className="mt-1"
                  />
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Page size</span><span className="tabular-nums">{Math.round(pageSize.width)} × {Math.round(pageSize.height)} pt</span></div>
              <div className="flex justify-between"><span>Crop size</span><span className="tabular-nums">{Math.round(pageSize.width - currentMargins.left - currentMargins.right)} × {Math.round(pageSize.height - currentMargins.top - currentMargins.bottom)} pt</span></div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => setMargins({ top: 0, right: 0, bottom: 0, left: 0 })}
              >
                Reset margins
              </Button>
              <Button variant="hero" size="lg" onClick={run} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {busy ? "Working..." : "Crop PDF"}
              </Button>
              <Button variant="ghost" onClick={() => setFile(null)} disabled={busy}>
                Choose another
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropPdf;
