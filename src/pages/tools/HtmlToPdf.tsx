import { useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const HtmlToPdf = () => {
  const [html, setHtml] = useState("<h1>Hello</h1>\n<p>Edit this HTML and export to PDF.</p>");
  const [name, setName] = useState("document");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const wrap = document.createElement("div");
      wrap.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;padding:40px;background:#fff;color:#000;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;";
      wrap.innerHTML = html;
      document.body.appendChild(wrap);
      const canvas = await html2canvas(wrap, { scale: 2, backgroundColor: "#ffffff" });
      document.body.removeChild(wrap);

      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      let y = 0;
      const img = canvas.toDataURL("image/png");
      if (imgH <= pageH) {
        pdf.addImage(img, "PNG", 0, 0, imgW, imgH);
      } else {
        // Slice into pages
        let remaining = imgH;
        while (remaining > 0) {
          pdf.addImage(img, "PNG", 0, y, imgW, imgH);
          remaining -= pageH;
          y -= pageH;
          if (remaining > 0) pdf.addPage();
        }
      }
      pdf.save(`${name || "document"}.pdf`);
      toast({ title: "Done", description: "HTML exported to PDF." });
    } catch (e) {
      console.error(e);
      toast({ title: "Failed", variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <Label>File name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
      </div>
      <div>
        <Label>HTML content</Label>
        <Textarea value={html} onChange={(e) => setHtml(e.target.value)} className="mt-1.5 min-h-[280px] font-mono text-sm" />
      </div>
      <div className="flex justify-end">
        <Button variant="hero" size="lg" onClick={run} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {busy ? "Working..." : "Export PDF"}
        </Button>
      </div>
    </div>
  );
};

export default HtmlToPdf;
