import { Link, NavLink } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import appIcon from "@/assets/app-icon.png";
import { tools, categoryLabel, type ToolCategory } from "@/lib/tools";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categories: ToolCategory[] = [
  "organize",
  "optimize",
  "convert-to",
  "convert-from",
  "edit",
  "security",
];

const simpleLinks = [
  { to: "/", label: "Home" },
  { to: "/#all-tools", label: "All Tools" },
];

const Header = () => {
  const [open, setOpen] = useState(false);
  const [mobileCat, setMobileCat] = useState<ToolCategory | null>(null);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4 md:h-18">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight md:text-xl"
        >
          <img src={appIcon} alt="TOOL FOR PDF logo" className="h-9 w-9 object-contain" />
          <span className="flex items-baseline gap-1">
            <span className="text-foreground">TOOL</span>
            <span className="text-sm font-semibold text-muted-foreground md:text-base">FOR</span>
            <span className="bg-gradient-to-r from-primary-deep to-primary bg-clip-text text-transparent">
              PDF
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground",
                isActive && "bg-secondary text-foreground",
              )
            }
          >
            Home
          </NavLink>

          {categories.map((cat) => {
            const catTools = tools.filter((t) => t.category === cat);
            return (
              <DropdownMenu key={cat}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {categoryLabel[cat]}
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>{categoryLabel[cat]}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {catTools.map((t) => {
                    const Icon = t.icon;
                    return (
                      <DropdownMenuItem key={t.slug} asChild>
                        <Link to={`/tools/${t.slug}`} className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{t.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}

          <NavLink
            to="/#all-tools"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground"
          >
            All Tools
          </NavLink>
        </nav>

        <div className="hidden lg:block">
          <Button asChild variant="hero" size="sm">
            <Link to="/#all-tools">Get started</Link>
          </Button>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-border lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="container flex flex-col gap-1 py-3">
            {simpleLinks.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {n.label}
              </Link>
            ))}

            {categories.map((cat) => {
              const catTools = tools.filter((t) => t.category === cat);
              const expanded = mobileCat === cat;
              return (
                <div key={cat} className="flex flex-col">
                  <button
                    onClick={() => setMobileCat(expanded ? null : cat)}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    <span>{categoryLabel[cat]}</span>
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
                    />
                  </button>
                  {expanded && (
                    <div className="ml-2 flex flex-col border-l border-border pl-2">
                      {catTools.map((t) => {
                        const Icon = t.icon;
                        return (
                          <Link
                            key={t.slug}
                            to={`/tools/${t.slug}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            <Icon className="h-4 w-4" />
                            {t.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            <Button asChild variant="hero" size="sm" className="mt-2">
              <Link to="/#all-tools" onClick={() => setOpen(false)}>
                Get started
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
