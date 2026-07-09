import { Link } from "@tanstack/react-router";
import { Menu, Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SITE } from "@/lib/site";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Browse" },
  { to: "/sell", label: "Sell / Rent" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const primary = SITE.phones[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-brand text-brand-foreground">
            <span className="font-display text-sm font-bold tracking-tight">GSK</span>
          </div>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="font-display text-base font-bold tracking-tight text-brand">
              GSK Enterprises
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Real Estate Developers
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-brand"
              activeProps={{ className: "text-brand" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${primary.tel}`}
            className="hidden items-center gap-2 text-sm font-medium text-brand hover:text-gold md:flex"
          >
            <Phone className="h-4 w-4" />
            {primary.display}
          </a>
          <Button asChild className="hidden bg-gold text-gold-foreground hover:bg-gold/90 md:inline-flex">
            <Link to="/sell">List Property</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-4">
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="text-lg font-medium text-foreground"
                  >
                    {n.label}
                  </Link>
                ))}
                <a
                  href={`tel:${primary.tel}`}
                  className="mt-4 flex items-center gap-2 text-sm text-brand"
                >
                  <Phone className="h-4 w-4" /> {primary.display}
                </a>
                <Button asChild className="mt-2 bg-gold text-gold-foreground">
                  <Link to="/sell" onClick={() => setOpen(false)}>
                    List Your Property
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
