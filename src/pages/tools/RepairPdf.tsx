import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const RepairPdf = () => {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"ok" | "fail" | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const repair = async (f: File) => {
    setBusy(true);
    setResult(null);
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true, throwOnInvalidObject: false });
      const out = await PDFDocument.create();
      const pages = await out.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((p) => out.addPage(p));
      const data = await out.save({ useObjectStreams: true });
      const blob = new Blob([data as BlobPart], { type: "application/pdf" });
      setUrl(URL.createObjectURL(blob));
      setResult("ok");
      toast({ title: "Repaired", description: "PDF rebuilt successfully." });
    } catch (e) {
      console.error(e);
      setResult("fail");
      toast({ title: "Could not repair", description: "The file is too damaged to recover.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleFiles = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    repair(f);
  };

  const download = () => {
    if (!url || !file) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name.replace(/\.pdf$/i, "") + "-repaired.pdf";
    a.click();
  };

  return (
    <div className="space-y-6">
      {!file && (
        <FileDropzone onFiles={handleFiles} accept={{ "application/pdf": [".pdf"] }} multiple={false}
          label="Select a damaged PDF" hint="We'll try to read the structure and rebuild a clean copy." />
      )}

      {file && (
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-card">
          {busy && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary-deep" />
              Analyzing {file.name}...
            </div>
          )}
          {result === "ok" && !busy && (
            <>
              <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
              <h3 className="mt-3 font-display text-xl font-bold">Repair successful</h3>
              <p className="mt-1 text-muted-foreground">Your PDF was rebuilt and is ready to download.</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Button variant="ghost" onClick={() => { setFile(null); setUrl(null); setResult(null); }}>Choose another</Button>
                <Button variant="hero" size="lg" onClick={download}>
                  <Download className="h-4 w-4" /> Download repaired PDF
                </Button>
              </div>
            </>
          )}
          {result === "fail" && !busy && (
            <>
              <XCircle className="mx-auto h-14 w-14 text-destructive" />
              <h3 className="mt-3 font-display text-xl font-bold">Could not repair</h3>
              <p className="mt-1 text-muted-foreground">The file appears too damaged to recover automatically.</p>
              <Button variant="soft" className="mt-5" onClick={() => { setFile(null); setResult(null); }}>Try another file</Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RepairPdf;
