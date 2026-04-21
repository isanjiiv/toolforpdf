import { useParams } from "react-router-dom";
import { Construction } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import { getTool } from "@/lib/tools";
import MergePdf from "./tools/MergePdf";
import JpgToPdf from "./tools/JpgToPdf";
import PdfToJpg from "./tools/PdfToJpg";

const ComingSoon = () => (
  <div className="rounded-3xl border border-dashed border-border bg-secondary/40 p-12 text-center">
    <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary-deep">
      <Construction className="h-7 w-7" />
    </div>
    <h2 className="font-display text-2xl font-bold text-foreground">Coming soon</h2>
    <p className="mx-auto mt-2 max-w-md text-muted-foreground">
      This tool is on the way. In the meantime, try Merge PDF, JPG to PDF, or PDF to JPG.
    </p>
  </div>
);

const ToolPage = () => {
  const { slug = "" } = useParams();
  const tool = getTool(slug);

  let content: JSX.Element = <ComingSoon />;
  if (tool?.slug === "merge-pdf") content = <MergePdf />;
  else if (tool?.slug === "jpg-to-pdf") content = <JpgToPdf />;
  else if (tool?.slug === "pdf-to-jpg") content = <PdfToJpg />;

  return <ToolLayout>{content}</ToolLayout>;
};

export default ToolPage;
