import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ArrowDown, ArrowUp, Download, FileText, Loader2, Trash2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const MergePdf = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const addFiles = (incoming: File[]) => {
    const pdfs = incoming.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length === 0) {
      toast({ title: "PDF files only", description: "Please drop PDF files to merge." });
      return;
    }
    setFiles((prev) => [...prev, ...pdfs]);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= files.length) return;
    const copy = [...files];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setFiles(copy);
  };

  const remove = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const merge = async () => {
    if (files.length < 2) {
      toast({ title: "Add at least 2 PDFs", description: "You need two or more files to merge." });
      return;
    }
    setBusy(true);
    try {
      const out = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const merged = await out.save();
      const blob = new Blob([merged], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Merged successfully", description: `${files.length} PDFs combined.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Merge failed", description: "One of the files might be corrupted.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        onFiles={addFiles}
        accept={{ "application/pdf": [".pdf"] }}
        label="Select PDF files to merge"
        hint="Drag & drop or click — they'll be combined in the order shown below."
      />

      {files.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <ul className="divide-y divide-border">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-3 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent text-primary-deep">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(1)} KB</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === files.length - 1}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {files.length > 0 && (
          <Button variant="ghost" onClick={() => setFiles([])} disabled={busy}>Clear all</Button>
        )}
        <Button variant="hero" size="lg" onClick={merge} disabled={busy || files.length < 2}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {busy ? "Merging..." : "Merge & download"}
        </Button>
      </div>
    </div>
  );
};

export default MergePdf;
