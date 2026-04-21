import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { Loader2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { toast } from "@/hooks/use-toast";

const ExcelToPdf = () => {
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      const data = new Uint8Array(await f.arrayBuffer());
      const wb = XLSX.read(data, { type: "array" });
      const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 32;
      let first = true;

      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: "" });
        if (!rows.length) continue;

        if (!first) pdf.addPage();
        first = false;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text(sheetName, margin, margin);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);

        const cols = Math.max(...rows.map((r) => r.length));
        const colW = (pageW - margin * 2) / cols;
        const rowH = 16;
        let y = margin + 18;

        rows.forEach((row, ri) => {
          if (y + rowH > pageH - margin) {
            pdf.addPage();
            y = margin;
          }
          // header style
          if (ri === 0) {
            pdf.setFillColor(255, 222, 80);
            pdf.rect(margin, y - rowH + 4, pageW - margin * 2, rowH, "F");
            pdf.setFont("helvetica", "bold");
          } else if (ri % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(margin, y - rowH + 4, pageW - margin * 2, rowH, "F");
            pdf.setFont("helvetica", "normal");
          } else {
            pdf.setFont("helvetica", "normal");
          }
          for (let ci = 0; ci < cols; ci++) {
            const val = String(row[ci] ?? "");
            const truncated = val.length > Math.floor(colW / 5) ? val.slice(0, Math.floor(colW / 5) - 1) + "…" : val;
            pdf.setTextColor(20);
            pdf.text(truncated, margin + ci * colW + 4, y);
            pdf.setDrawColor(220);
            pdf.rect(margin + ci * colW, y - rowH + 4, colW, rowH);
          }
          y += rowH;
        });
      }

      pdf.save(f.name.replace(/\.(xlsx?|csv)$/i, "") + ".pdf");
      toast({ title: "Converted", description: "Spreadsheet saved as PDF." });
    } catch (e) {
      console.error(e);
      toast({ title: "Conversion failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        onFiles={handleFiles}
        accept={{
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
          "application/vnd.ms-excel": [".xls"],
          "text/csv": [".csv"],
        }}
        multiple={false}
        label={busy ? "Converting..." : "Select an Excel file (.xlsx, .xls, .csv)"}
        hint="Each sheet becomes a page. Best with simple tabular data."
      />
      {busy && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Converting your spreadsheet...
        </div>
      )}
    </div>
  );
};

export default ExcelToPdf;
