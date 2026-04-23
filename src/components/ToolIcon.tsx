import { ArrowDownLeft, ArrowDownRight, ArrowUpLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Palette = "red" | "green" | "blue" | "orange" | "purple" | "pink" | "teal" | "indigo" | "yellow";

interface BadgeStyle {
  /** Tailwind classes for the back square (lighter / tinted) */
  back: string;
  /** Tailwind classes for the front square (solid color) */
  front: string;
  /** Optional letter shown inside the front square (e.g. W, P, X) */
  letter?: string;
  /** Optional letter color override for the back square */
  letterColor?: string;
}

const palettes: Record<Palette, { back: string; front: string; letterColor: string }> = {
  red:    { back: "bg-[hsl(8_85%_92%)]",  front: "bg-[hsl(8_82%_60%)]",   letterColor: "text-[hsl(8_82%_55%)]" },
  green:  { back: "bg-[hsl(142_55%_88%)]", front: "bg-[hsl(142_55%_50%)]", letterColor: "text-[hsl(142_55%_38%)]" },
  blue:   { back: "bg-[hsl(215_85%_92%)]", front: "bg-[hsl(215_82%_55%)]", letterColor: "text-[hsl(215_82%_50%)]" },
  orange: { back: "bg-[hsl(22_92%_92%)]",  front: "bg-[hsl(22_92%_58%)]",  letterColor: "text-[hsl(22_92%_52%)]" },
  purple: { back: "bg-[hsl(280_55%_92%)]", front: "bg-[hsl(280_55%_60%)]", letterColor: "text-[hsl(280_55%_55%)]" },
  pink:   { back: "bg-[hsl(330_75%_92%)]", front: "bg-[hsl(330_75%_60%)]", letterColor: "text-[hsl(330_75%_55%)]" },
  teal:   { back: "bg-[hsl(180_60%_88%)]", front: "bg-[hsl(180_60%_45%)]", letterColor: "text-[hsl(180_60%_38%)]" },
  indigo: { back: "bg-[hsl(245_70%_92%)]", front: "bg-[hsl(245_70%_60%)]", letterColor: "text-[hsl(245_70%_55%)]" },
  yellow: { back: "bg-[hsl(45_95%_88%)]",  front: "bg-[hsl(45_95%_55%)]",  letterColor: "text-[hsl(40_95%_45%)]" },
};

export type ArrowDir = "up-right" | "down-right" | "up-left" | "down-left";

const arrows: Record<ArrowDir, typeof ArrowUpRight> = {
  "up-right": ArrowUpRight,
  "down-right": ArrowDownRight,
  "up-left": ArrowUpLeft,
  "down-left": ArrowDownLeft,
};

interface ToolIconProps {
  palette: Palette;
  /** Letter shown inside the front (white) square — e.g. "W", "P", "X". If omitted an arrow is shown. */
  letter?: string;
  /** Direction of the arrow shown in the back tile */
  arrow?: ArrowDir;
  /** Show only one tile (no back square) */
  single?: boolean;
  className?: string;
}

const ToolIcon = ({ palette, letter, arrow = "up-right", single = false, className }: ToolIconProps) => {
  const p = palettes[palette];
  const Arrow = arrows[arrow];

  if (single) {
    return (
      <div className={cn("relative h-12 w-12", className)}>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-md shadow-sm", p.front)}>
          {letter ? (
            <span className="text-sm font-bold text-white">{letter}</span>
          ) : (
            <Arrow className="h-5 w-5 text-white" strokeWidth={2.5} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative h-14 w-14", className)}>
      {/* Back tile (lighter) */}
      <div
        className={cn(
          "absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-md",
          p.back
        )}
      >
        <Arrow className={cn("h-4 w-4", p.letterColor)} strokeWidth={2.75} />
      </div>
      {/* Front tile (solid) */}
      <div
        className={cn(
          "absolute bottom-0 left-0 flex h-9 w-9 items-center justify-center rounded-md shadow-sm",
          p.front
        )}
      >
        {letter ? (
          <span className="text-sm font-bold text-white">{letter}</span>
        ) : (
          <Arrow className="h-4 w-4 text-white" strokeWidth={2.75} />
        )}
      </div>
    </div>
  );
};

export default ToolIcon;
export type { Palette };
