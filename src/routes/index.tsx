import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, PhoneCall, ShieldCheck, Sparkles, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ListingCard } from "@/components/listing-card";
import { getFeaturedListings } from "@/lib/listings.functions";
import { SITE, waLink } from "@/lib/site";

const featuredQO = queryOptions({
  queryKey: ["listings", "featured"],
  queryFn: () => getFeaturedListings(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(featuredQO),
  component: HomePage,
});

function HomePage() {
  const { data: featured } = useSuspenseQuery(featuredQO);
  const primary = SITE.phones[0];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-brand via-brand to-brand/90 text-brand-foreground">
          <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
          <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-20 text-center md:py-28">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5 text-gold" /> Hyderabad · {SITE.regionShort}
            </span>
            <h1 className="max-w-4xl font-display text-4xl font-bold leading-[1.1] md:text-6xl">
              Find Verified Properties in{" "}
              <span className="text-gold">Kattedan ,Jalpally, Sri Ram Colony , Madhuban & Surrounding areas</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/70">
              Trusted local mediator for open plots, houses, and land. Real listings, direct
              contact, no platform fees.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-gold text-gold-foreground hover:bg-gold/90"
              >
                <Link to="/browse">
                  Browse Properties <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <a href={`tel:${primary.tel}`}>
                  <PhoneCall className="mr-2 h-4 w-4" /> Call {primary.display}
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold text-brand">
                Featured Listings
              </h2>
              <p className="mt-1 text-muted-foreground">
                Verified plots and homes in your neighborhood.
              </p>
            </div>
            <Link
              to="/browse"
              className="hidden shrink-0 items-center gap-1 border-b-2 border-gold/30 pb-0.5 text-sm font-semibold text-gold hover:border-gold sm:inline-flex"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featured.length === 0 ? (
            <EmptyPlaceholder />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="bg-brand py-20 text-brand-foreground">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <h2 className="font-display text-3xl font-bold">The path to your new home</h2>
              <p className="mt-2 text-white/60">
                Simple, transparent, and trusted process.
              </p>
            </div>
            <div className="grid gap-12 md:grid-cols-3">
              {[
                {
                  n: "01",
                  icon: Sparkles,
                  title: "Browse & Filter",
                  body:
                    "Explore verified listings in Kattedan and Sri Ram Colony with clear price, area, and facing details.",
                },
                {
                  n: "02",
                  icon: PhoneCall,
                  title: "Direct Contact",
                  body:
                    "Connect directly via Call or WhatsApp. No middlemen, no hidden platform fees.",
                },
                {
                  n: "03",
                  icon: Handshake,
                  title: "Close the Deal",
                  body:
                    "We assist with documentation and verification to ensure a smooth legal handover.",
                },
              ].map((s) => (
                <div key={s.n} className="relative">
                  <div className="absolute -top-8 -left-2 font-display text-6xl font-bold text-white/5">
                    {s.n}
                  </div>
                  <s.icon className="mb-3 h-8 w-8 text-gold" />
                  <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-white/60">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services strip */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-2xl border border-border bg-surface p-8 md:p-10">
            <div className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
              <ShieldCheck className="h-4 w-4" /> Services
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {SITE.services.map((s) => (
                <div
                  key={s}
                  className="rounded-lg border border-border/70 bg-card px-4 py-3 text-sm font-medium text-foreground"
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="px-6 pb-20">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 rounded-3xl bg-gold p-10 text-center text-gold-foreground md:flex-row md:text-left">
            <div>
              <h2 className="font-display text-2xl font-bold md:text-3xl">
                Want to sell or rent your property?
              </h2>
              <p className="mt-2 opacity-80">
                Active buyers are searching in your area right now.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
                <Link to="/sell">List Your Property Free</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-brand/30 bg-transparent text-brand hover:bg-brand/10"
              >
                <a
                  href={waLink(primary.wa, "Hi, I'd like to list my property with GSK Enterprises.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp Us
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function EmptyPlaceholder() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-16 text-center">
      <p className="mb-2 font-display text-xl font-semibold text-brand">
        Fresh listings coming soon
      </p>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">
        We're onboarding verified properties. Call or WhatsApp us for the latest availability
        in Kattedan and Sri Ram Colony.
      </p>
    </div>
  );
}
