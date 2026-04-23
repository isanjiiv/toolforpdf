import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { tools, categoryLabel, ToolCategory } from "@/lib/tools";
import appIcon from "@/assets/app-icon.png";

const Footer = () => {
  const cats: ToolCategory[] = ["organize", "optimize", "convert-to", "convert-from"];

  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-display text-lg font-extrabold md:text-xl">
              <img src={appIcon} alt="TOOL FOR PDF logo" className="h-9 w-9 object-contain" />

              <span className="flex items-baseline gap-1">
                <span className="text-foreground">TOOL</span>
                <span className="text-sm font-semibold text-muted-foreground md:text-base">FOR</span>
                <span className="text-primary-deep">PDF</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Free, private, in-browser PDF tools. No uploads to a server.
            </p>
          </div>

          {cats.map((c) => (
            <div key={c}>
              <h4 className="mb-3 text-sm font-semibold text-foreground">{categoryLabel[c]}</h4>
              <ul className="space-y-2">
                {tools.filter((t) => t.category === c).map((t) => (
                  <li key={t.slug}>
                    <Link
                      to={`/tools/${t.slug}`}
                      className="text-sm text-muted-foreground transition-smooth hover:text-primary-deep"
                    >
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} TOOL FOR PDF. All rights reserved.</p>
          <p>
            Made with{" "}
            <Heart className="inline h-4 w-4 text-destructive" fill="currentColor" />{" "}
            by{" "}
            <a
              href="https://isanjiiv.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground transition-smooth hover:text-primary-deep"
            >
              Sanjeev Kumar
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
