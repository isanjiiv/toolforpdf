import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Sparkles,
  FileUp,
  Globe,
  Cpu,
  Heart,
  Star,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolCard from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tools, categoryLabel, ToolCategory } from "@/lib/tools";

const orderedCategories: ToolCategory[] = [
  "organize",
  "optimize",
  "convert-to",
  "convert-from",
  "edit",
  "security",
];

type FilterValue = "all" | ToolCategory;

const filters: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "organize", label: "Organize PDF" },
  { value: "optimize", label: "Optimize PDF" },
  { value: "convert-to", label: "Convert to PDF" },
  { value: "convert-from", label: "Convert from PDF" },
  { value: "edit", label: "Edit PDF" },
  { value: "security", label: "PDF Security" },
];

const features = [
  {
    icon: ShieldCheck,
    title: "Privacy First",
    desc: "Your files are processed in your browser. Nothing is uploaded to a server.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Instant results powered by modern WebAssembly no waiting in queues.",
  },
  {
    icon: Cpu,
    title: "No Installation",
    desc: "Works directly in the browser. No software, no plugins, no accounts.",
  },
  {
    icon: Globe,
    title: "Works Everywhere",
    desc: "Beautiful experience on desktop, tablet, and mobile devices.",
  },
  {
    icon: Lock,
    title: "Secure by Design",
    desc: "AES-256 encryption available for password-protecting your PDFs.",
  },
  {
    icon: Heart,
    title: "Free Forever",
    desc: "All tools are free to use, with no hidden fees or watermarks.",
  },
];

const Index = () => {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const visibleTools =
    activeFilter === "all" ? tools : tools.filter((t) => t.category === activeFilter);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh" />
        <div className="absolute inset-0 bg-gradient-radial opacity-80" />
        <div className="container relative pt-20 pb-10 md:pt-28 md:pb-12 lg:pt-32 lg:pb-14">
          <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-deep shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Free · Private · No signup
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-[4.25rem]">
              Every tool you need to work with{" "}
              <span className="text-primary">
                PDFs in one place
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              Merge, split, convert, compress, edit and sign PDFs with ease 100% free,
              private, and beautifully simple.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/tools/merge-pdf">
                  <FileUp className="h-4 w-4" />
                  Select PDF File
                </Link>
              </Button>
              <Button asChild variant="soft" size="lg">
                <a href="#all-tools">
                  Explore All Tools <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-success" /> 100% private
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary-deep" /> Lightning fast
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-tool-security" /> No uploads
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 text-tool-convert-to" fill="currentColor" /> Loved by
                thousands
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* All tools */}
      <section id="all-tools" className="container pt-6 pb-20 md:pt-8 md:pb-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-deep">
            All Tools
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Everything you'll ever need
          </h2>
          <p className="mt-4 text-muted-foreground">
            18 powerful PDF tools most run instantly in your browser, no upload required.
          </p>
        </div>

        {/* Filter pills */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {filters.map((f) => {
            const isActive = activeFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={cn(
                  "rounded-full border px-5 py-2 text-sm font-semibold transition-bounce",
                  isActive
                    ? "border-foreground bg-foreground text-background shadow-card"
                    : "border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary-deep hover:shadow-card",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Unified grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {visibleTools.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>

        {visibleTools.length === 0 && (
          <p className="mt-10 text-center text-muted-foreground">No tools in this category yet.</p>
        )}
      </section>

      {/* Why choose us */}
      <section className="border-y border-border/60 bg-secondary/40">
        <div className="container py-20 md:py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-deep">
              Why choose us
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Trusted by thousands worldwide
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built with the highest standards of speed, privacy, and design.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-border/60 bg-card p-6 shadow-card transition-bounce hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary-deep transition-bounce group-hover:scale-110">
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 md:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-primary/10 px-8 py-14 text-center shadow-elegant md:px-16 md:py-20">
          <div className="absolute inset-0 bg-gradient-radial opacity-60" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Ready to work smarter with PDFs?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Pick any tool and start in seconds no signup, no uploads, no limits.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/tools/merge-pdf">
                  <FileUp className="h-4 w-4" /> Select PDF File
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#all-tools">Browse all tools</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
