import { FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { tools, categoryLabel, ToolCategory } from "@/lib/tools";

const Footer = () => {
  const cats: ToolCategory[] = ["organize", "optimize", "convert-to", "convert-from"];

  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                <FileText className="h-5 w-5" />
              </span>
              PDF<span className="text-primary-deep">ly</span>
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
          <p>© {new Date().getFullYear()} PDFly. All rights reserved.</p>
          <p>Made with care · Files never leave your device.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
