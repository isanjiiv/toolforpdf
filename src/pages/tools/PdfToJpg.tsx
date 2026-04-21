import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Download, Loader2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface PageImg {
  url: string;
  blob: Blob;
  index: number;
}

const PdfToJpg = () => {
  const [pages, setPages] = useState<PageImg[]>([]);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "PDF only", description: "Please pick a PDF file." });
      return;
    }
    setBusy(true);
    setPages([]);
    setFileName(file.name.replace(/\.pdf$/i, ""));
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const out: PageImg[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const blob: Blob = await new Promise((res) =>
          canvas.toBlob((b) => res(b!), "image/jpeg", 0.92)
        );
        out.push({ url: URL.createObjectURL(blob), blob, index: i });
      }
      setPages(out);
      toast({ title: "Converted", description: `${out.length} page(s) ready.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to read PDF", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const downloadOne = (p: PageImg) => {
    const a = document.createElement("a");
    a.href = p.url;
    a.download = `${fileName || "page"}-${p.index}.jpg`;
    a.click();
  };

  const downloadAll = () => pages.forEach(downloadOne);

  return (
    <div className="space-y-6">
      <FileDropzone
        onFiles={handleFiles}
        accept={{ "application/pdf": [".pdf"] }}
        multiple={false}
        label="Select a PDF file"
        hint="Each page will be rendered to a high-quality JPG image."
      />

      {busy && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Rendering pages...
        </div>
      )}

      {pages.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pages.map((p) => (
              <button
                key={p.index}
                onClick={() => downloadOne(p)}
                className="group overflow-hidden rounded-xl border border-border bg-card text-left shadow-card transition-bounce hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className="aspect-[3/4] bg-secondary">
                  <img src={p.url} alt={`Page ${p.index}`} className="h-full w-full object-contain" />
                </div>
                <div className="flex items-center justify-between px-2.5 py-1.5 text-xs">
                  <span className="font-semibold text-foreground">Page {p.index}</span>
                  <Download className="h-3.5 w-3.5 text-primary-deep opacity-0 transition-smooth group-hover:opacity-100" />
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="hero" size="lg" onClick={downloadAll}>
              <Download className="h-4 w-4" /> Download all
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PdfToJpg;
