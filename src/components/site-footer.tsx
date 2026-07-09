import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-surface">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-brand text-brand-foreground">
              <span className="font-display text-sm font-bold tracking-tight">GSK</span>
            </div>
            <div>
              <div className="font-display text-lg font-bold tracking-tight text-brand">
                GSK Enterprises
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Real Estate Developers
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Trusted local property mediators in {SITE.regionShort}. Open plots, houses, lands
            — purchase and sale. Home, business and personal loan assistance available.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground">
            Contact
          </h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {SITE.phones.map((p) => (
              <li key={p.tel}>
                <a
                  href={`tel:${p.tel}`}
                  className="flex items-center gap-2 hover:text-brand"
                >
                  <Phone className="h-4 w-4" /> {p.display}
                </a>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${SITE.email}`}
                className="flex items-center gap-2 hover:text-brand"
              >
                <Mail className="h-4 w-4" /> {SITE.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {SITE.regionLong}
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground">
            Explore
          </h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <Link to="/browse" className="hover:text-brand">
                Browse Properties
              </Link>
            </li>
            <li>
              <Link to="/sell" className="hover:text-brand">
                List Your Property
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-brand">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-brand">
                Admin Login
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} GSK Enterprises. All rights reserved.</span>
          <span>{SITE.hours}</span>
        </div>
      </div>
    </footer>
  );
}
