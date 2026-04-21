import { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { categoryColor, categoryLabel, getTool } from "@/lib/tools";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
}

const ToolLayout = ({ children }: Props) => {
  const { slug = "" } = useParams();
  const tool = getTool(slug);

  if (!tool) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-24 text-center">
          <h1 className="font-display text-3xl font-bold">Tool not found</h1>
          <Link to="/" className="mt-4 inline-block text-primary-deep underline">Back to home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const Icon = tool.icon;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="border-b border-border bg-gradient-hero">
        <div className="container py-10 md:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All tools
          </Link>
          <div className="mt-5 flex flex-col items-start gap-5 md:flex-row md:items-center">
            <div
              className={cn(
                "grid h-16 w-16 place-items-center rounded-2xl shadow-card",
                categoryColor[tool.category]
              )}
            >
              <Icon className="h-8 w-8" strokeWidth={2} />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {categoryLabel[tool.category]}
              </span>
              <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                {tool.name}
              </h1>
              <p className="mt-1 max-w-xl text-muted-foreground">{tool.description}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-10 md:py-14">
        <div className="mx-auto max-w-3xl">{children}</div>
        <p className="mx-auto mt-8 flex max-w-3xl items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-success" />
          Files are processed locally in your browser. Nothing is uploaded.
        </p>
      </section>

      <Footer />
    </div>
  );
};

export default ToolLayout;
