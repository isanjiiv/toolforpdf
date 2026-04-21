import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as XLSX from "xlsx";
import { Loader2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { toast } from "@/hooks/use-toast";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const PdfToExcel = () => {
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      const data = new Uint8Array(await f.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const wb = XLSX.utils.book_new();

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();

        // Bucket items by row (y), sort columns by x
        const rowsMap: Record<number, { x: number; str: string }[]> = {};
        for (const item of text.items as any[]) {
          const y = Math.round(item.transform[5]);
          (rowsMap[y] ??= []).push({ x: item.transform[4], str: item.str });
        }
        const ys = Object.keys(rowsMap).map(Number).sort((a, b) => b - a);
        const aoa: string[][] = ys.map((y) =>
          rowsMap[y].sort((a, b) => a.x - b.x).map((c) => c.str)
        );

        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(wb, ws, `Page ${i}`.slice(0, 31));
      }

      XLSX.writeFile(wb, f.name.replace(/\.pdf$/i, "") + ".xlsx");
      toast({ title: "Converted", description: "Each PDF page exported to a sheet." });
    } catch (e) {
      console.error(e);
      toast({ title: "Conversion failed", description: "Best with text-based, tabular PDFs.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        onFiles={handleFiles}
        accept={{ "application/pdf": [".pdf"] }}
        multiple={false}
        label={busy ? "Converting..." : "Select a PDF to convert to Excel"}
        hint="Each page becomes a sheet with rows & columns inferred from layout."
      />
      {busy && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Building spreadsheet...
        </div>
      )}
    </div>
  );
};

export default PdfToExcel;
