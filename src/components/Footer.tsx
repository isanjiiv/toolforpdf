import { Heart, Github, Twitter, Linkedin, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { tools, categoryLabel, ToolCategory } from "@/lib/tools";
import appIcon from "@/assets/app-icon.png";

const Footer = () => {
  const cats: ToolCategory[] = ["organize", "optimize", "convert-to", "convert-from"];

  return (
    <footer className="mt-8 border-t border-border bg-secondary/50">
      <div className="container py-16">
        <div className="grid gap-10 md:grid-cols-6">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-extrabold md:text-xl">
              <img src={appIcon} alt="TOOL FOR PDF logo" className="h-9 w-9 object-contain" />
              <span className="flex items-baseline gap-1">
                <span className="text-foreground">TOOL</span>
                <span className="text-sm font-semibold text-muted-foreground md:text-base">FOR</span>
                <span className="bg-gradient-to-r from-primary-deep to-primary bg-clip-text text-transparent">
                  PDF
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Free, private, in-browser PDF tools. Beautifully designed for everyone — no
              uploads, no signup, no limits.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { Icon: Globe, href: "https://isanjiiv.github.io/", label: "Website" },
                { Icon: Github, href: "https://github.com/", label: "GitHub" },
                { Icon: Twitter, href: "https://twitter.com/", label: "Twitter" },
                { Icon: Linkedin, href: "https://linkedin.com/", label: "LinkedIn" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-smooth hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary-deep"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {cats.map((c) => (
            <div key={c}>
              <h4 className="mb-4 text-sm font-semibold text-foreground">{categoryLabel[c]}</h4>
              <ul className="space-y-2.5">
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

        {/* secondary links */}
        <div className="mt-12 grid gap-3 border-t border-border pt-8 sm:grid-cols-2 md:grid-cols-5">
          {["About", "Privacy Policy", "Terms", "Contact", "Blog"].map((l) => (
            <Link
              key={l}
              to="/"
              className="text-sm font-medium text-muted-foreground transition-smooth hover:text-primary-deep"
            >
              {l}
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} TOOL FOR PDF. All rights reserved.</p>
          <p>
            Made with{" "}
            <Heart className="inline h-4 w-4 text-destructive" fill="currentColor" /> by{" "}
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
