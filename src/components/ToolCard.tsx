import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Tool, categoryColor } from "@/lib/tools";
import { cn } from "@/lib/utils";

const ToolCard = ({ tool }: { tool: Tool }) => {
  const Icon = tool.icon;
  return (
    <Link
      to={`/tools/${tool.slug}`}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border/70 bg-card p-6 shadow-card transition-bounce overflow-hidden",
        "hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-card-hover"
      )}
    >
      {/* subtle gradient sheen on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/0 opacity-0 transition-smooth group-hover:from-primary/5 group-hover:to-primary/0 group-hover:opacity-100" />

      {!tool.available && (
        <span className="absolute right-3 top-3 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Soon
        </span>
      )}

      <div
        className={cn(
          "relative mb-5 grid h-12 w-12 place-items-center rounded-xl ring-1 ring-inset ring-border/60 transition-bounce group-hover:scale-110 group-hover:ring-transparent",
          categoryColor[tool.category]
        )}
      >
        <Icon className="h-6 w-6" strokeWidth={2} />
      </div>

      <h3 className="relative font-display text-base font-bold tracking-tight text-foreground">
        {tool.name}
      </h3>
      <p className="relative mt-1.5 text-sm leading-snug text-muted-foreground">
        {tool.description}
      </p>

      <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground/40 opacity-0 transition-bounce group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary group-hover:opacity-100" />
    </Link>
  );
};

export default ToolCard;
