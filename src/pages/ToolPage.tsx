import { useParams } from "react-router-dom";
import { Construction } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import { getTool } from "@/lib/tools";
import MergePdf from "./tools/MergePdf";
import SplitPdf from "./tools/SplitPdf";
import RotatePdf from "./tools/RotatePdf";
import OrganizePdf from "./tools/OrganizePdf";
import CompressPdf from "./tools/CompressPdf";
import RepairPdf from "./tools/RepairPdf";
import JpgToPdf from "./tools/JpgToPdf";
import WordToPdf from "./tools/WordToPdf";
import ExcelToPdf from "./tools/ExcelToPdf";
import PowerPointToPdf from "./tools/PowerPointToPdf";
import PdfToJpg from "./tools/PdfToJpg";
import PdfToWord from "./tools/PdfToWord";
import PdfToExcel from "./tools/PdfToExcel";
import PdfToPowerPoint from "./tools/PdfToPowerPoint";
import EditPdf from "./tools/EditPdf";
import WatermarkPdf from "./tools/WatermarkPdf";
import ProtectPdf from "./tools/ProtectPdf";
import UnlockPdf from "./tools/UnlockPdf";

const ComingSoon = () => (
  <div className="rounded-3xl border border-dashed border-border bg-secondary/40 p-12 text-center">
    <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary-deep">
      <Construction className="h-7 w-7" />
    </div>
    <h2 className="font-display text-2xl font-bold text-foreground">Coming soon</h2>
    <p className="mx-auto mt-2 max-w-md text-muted-foreground">This tool is on the way.</p>
  </div>
);

const REGISTRY: Record<string, () => JSX.Element> = {
  "merge-pdf": MergePdf,
  "split-pdf": SplitPdf,
  "rotate-pdf": RotatePdf,
  "organize-pdf": OrganizePdf,
  "compress-pdf": CompressPdf,
  "repair-pdf": RepairPdf,
  "jpg-to-pdf": JpgToPdf,
  "word-to-pdf": WordToPdf,
  "powerpoint-to-pdf": PowerPointToPdf,
  "excel-to-pdf": ExcelToPdf,
  "pdf-to-jpg": PdfToJpg,
  "pdf-to-word": PdfToWord,
  "pdf-to-powerpoint": PdfToPowerPoint,
  "pdf-to-excel": PdfToExcel,
  "edit-pdf": EditPdf,
  "watermark-pdf": WatermarkPdf,
  "protect-pdf": ProtectPdf,
  "unlock-pdf": UnlockPdf,
};

const ToolPage = () => {
  const { slug = "" } = useParams();
  const tool = getTool(slug);
  const Comp = REGISTRY[slug];

  return <ToolLayout>{Comp ? <Comp /> : <ComingSoon />}</ToolLayout>;
};

export default ToolPage;
