import { Link } from "react-router-dom";
import { Tool, toolIconStyles } from "@/lib/tools";
import ToolIcon from "@/components/ToolIcon";
import { cn } from "@/lib/utils";

const ToolCard = ({ tool }: { tool: Tool }) => {
  const style = toolIconStyles[tool.slug] ?? { palette: "yellow" as const };
  return (
    <Link
      to={`/tools/${tool.slug}`}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-bounce",
        "hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-hover"
      )}
    >
      {!tool.available && (
        <span className="absolute right-3 top-3 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Soon
        </span>
      )}
      <div className="mb-5 transition-bounce group-hover:scale-110 group-hover:-rotate-3">
        <ToolIcon
          palette={style.palette}
          letter={style.letter}
          arrow={style.arrow}
          single={style.single}
        />
      </div>
      <h3 className="font-display text-lg font-bold text-foreground">{tool.name}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
    </Link>
  );
};

export default ToolCard;
