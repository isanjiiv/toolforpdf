import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Zap, Lock, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolCard from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { tools, categoryLabel, ToolCategory } from "@/lib/tools";

const orderedCategories: ToolCategory[] = [
  "organize",
  "optimize",
  "convert-to",
  "convert-from",
  "edit",
  "security",
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-background">
        <div className="container relative py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-deep backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Free · Private · No signup
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Every PDF tool you need,{" "}
              <span className="bg-gradient-to-r from-primary-deep via-primary to-primary-glow bg-clip-text text-transparent">
                in one place
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Merge, split, convert, compress and edit PDFs straight in your browser.
              Files never leave your device.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="hero" size="lg">
                <a href="#all-tools">
                  Explore tools <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="soft" size="lg">
                <Link to="/tools/merge-pdf">Try Merge PDF</Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-success" /> 100% private</span>
              <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary-deep" /> Lightning fast</span>
              <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-tool-security" /> No uploads</span>
            </div>
          </div>
        </div>
      </section>

      {/* All tools */}
      <section id="all-tools" className="container py-16 md:py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            All the tools you'll ever need
          </h2>
          <p className="mt-3 text-muted-foreground">
            Pick a tool below to get started — most run instantly in your browser.
          </p>
        </div>

        <div className="space-y-14">
          {orderedCategories.map((cat) => {
            const list = tools.filter((t) => t.category === cat);
            if (!list.length) return null;
            return (
              <div key={cat}>
                <div className="mb-5 flex items-end justify-between">
                  <h3 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {categoryLabel[cat]}
                  </h3>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {list.length} tools
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {list.map((t) => (
                    <ToolCard key={t.slug} tool={t} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
