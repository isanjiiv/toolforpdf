import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import appIcon from "@/assets/app-icon.png";

const nav = [
  { to: "/", label: "Home" },
  { to: "/tools/merge-pdf", label: "Merge PDF" },
  { to: "/tools/jpg-to-pdf", label: "JPG to PDF" },
  { to: "/tools/pdf-to-jpg", label: "PDF to JPG" },
  { to: "/#all-tools", label: "All Tools" },
];

const Header = () => {
  const [open, setOpen] = useState(false);

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

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground",
                  isActive && "bg-secondary text-foreground"
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/#all-tools">Pricing</Link>
          </Button>
          <Button asChild variant="hero" size="sm">
            <Link to="/#all-tools">Get started</Link>
          </Button>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-border md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container flex flex-col gap-1 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {n.label}
              </Link>
            ))}
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
