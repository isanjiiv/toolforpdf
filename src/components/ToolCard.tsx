import { Link } from "react-router-dom";
import { Tool, categoryColor } from "@/lib/tools";
import { cn } from "@/lib/utils";

const ToolCard = ({ tool }: { tool: Tool }) => {
  const Icon = tool.icon;
  return (
    <Link
      to={`/tools/${tool.slug}`}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-bounce",
        "hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-hover"
      )}
    >
      {!tool.available && (
        <span className="absolute right-3 top-3 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Soon
        </span>
      )}
      <div
        className={cn(
          "mb-4 grid h-12 w-12 place-items-center rounded-xl transition-smooth group-hover:scale-110",
          categoryColor[tool.category]
        )}
      >
        <Icon className="h-6 w-6" strokeWidth={2} />
      </div>
      <h3 className="font-display text-base font-bold text-foreground">{tool.name}</h3>
      <p className="mt-1 text-sm leading-snug text-muted-foreground">{tool.description}</p>
    </Link>
  );
};

export default ToolCard;
