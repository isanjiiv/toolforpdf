import { useState } from "react";
import mammoth from "mammoth";
import jsPDF from "jspdf";
import { Download, Loader2 } from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const WordToPdf = () => {
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    if (!/\.docx?$/i.test(f.name)) {
      toast({ title: "Word files only", description: ".docx files supported (older .doc may not work)." });
      return;
    }
    setBusy(true);
    try {
      const arrayBuffer = await f.arrayBuffer();
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
      // Render html in a hidden container, then convert to PDF using jsPDF.html
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-99999px;top:0;width:680px;padding:40px;font-family:Inter,Arial,sans-serif;font-size:12pt;line-height:1.5;color:#111;background:#fff;";
      container.innerHTML = html;
      document.body.appendChild(container);

      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      await pdf.html(container, {
        callback: (doc) => {
          doc.save(f.name.replace(/\.docx?$/i, "") + ".pdf");
          document.body.removeChild(container);
          toast({ title: "Converted", description: "Word document saved as PDF." });
        },
        x: 0,
        y: 0,
        width: 595, // A4 width in pt
        windowWidth: 760,
        autoPaging: "text",
        margin: [40, 40, 40, 40],
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Conversion failed", description: "Try with a simpler .docx file.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        onFiles={handleFiles}
        accept={{ "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] }}
        multiple={false}
        label={busy ? "Converting..." : "Select a Word document (.docx)"}
        hint="Text and basic formatting are preserved. Complex layouts may differ."
      />
      {busy && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Converting your document...
        </div>
      )}
    </div>
  );
};

export default WordToPdf;
