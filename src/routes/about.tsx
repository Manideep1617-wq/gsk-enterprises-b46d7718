import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE, waLink } from "@/lib/site";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About & Contact — GSK Enterprises" },
      {
        name: "description",
        content:
          "Meet GSK Enterprises — trusted real estate mediator in Kattedan, Jalpally, Sri Ram Colony, Madhuban & surrounding areas, Hyderabad. Contact us directly by phone, WhatsApp, or email.",
      },
      { property: "og:title", content: "About & Contact — GSK Enterprises" },
      {
        property: "og:description",
        content: "Trusted property broker in South Hyderabad. Call, WhatsApp, or email.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const primary = SITE.phones[0];
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <section className="border-b border-border/60 bg-brand text-brand-foreground">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <span className="mb-3 inline-block text-xs uppercase tracking-widest text-gold">
            About GSK Enterprises
          </span>
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            Your trusted local property partner
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            We're a Hyderabad-based real estate mediator specializing in open plots, houses,
            and land in {SITE.regionShort}. Every listing on the site is personally verified
            by our team before it goes live.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold text-brand">Our Story</h2>
            <div className="mt-4 space-y-4 leading-relaxed text-foreground">
              <p>
                GSK Enterprises has been serving families and investors in the Kattedan,
                Jalpally, Sri Ram Colony, Madhuban, and greater South Hyderabad belt for years. We know the
                streets, the sub-locations, and the paperwork — so you can move ahead
                with clarity.
              </p>
              <p>
                Our model is simple: no online payments, no middlemen chain, no hidden
                platform fees. You browse verified listings, contact us directly, and we
                walk you through documentation and site visits.
              </p>
              <p>
                Beyond property, we also assist with home loans, business loans, and
                personal loans so buyers can move ahead with a single trusted partner.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { n: "10+", l: "Years experience" },
                { n: "200+", l: "Properties closed" },
                { n: "100%", l: "Verified listings" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-border bg-surface p-4 text-center">
                  <div className="font-display text-2xl font-bold text-gold">{s.n}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
              <ShieldCheck className="h-4 w-4" /> Get in touch
            </div>
            <h2 className="font-display text-2xl font-bold text-brand">
              Talk to us directly
            </h2>
            <p className="mt-2 text-muted-foreground">
              We respond fast. Call or WhatsApp during business hours for the quickest
              reply.
            </p>

            <div className="mt-6 space-y-4">
              {SITE.phones.map((p) => (
                <a
                  key={p.tel}
                  href={`tel:${p.tel}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-gold"
                >
                  <Phone className="h-5 w-5 text-brand" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Call
                    </div>
                    <div className="font-semibold text-foreground">{p.display}</div>
                  </div>
                </a>
              ))}
              <a
                href={`mailto:${SITE.email}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-gold"
              >
                <Mail className="h-5 w-5 text-brand" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Email
                  </div>
                  <div className="font-semibold text-foreground">{SITE.email}</div>
                </div>
              </a>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
                <MapPin className="mt-0.5 h-5 w-5 text-brand" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Service area
                  </div>
                  <div className="font-semibold text-foreground">{SITE.regionLong}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{SITE.hours}</div>
                </div>
              </div>
            </div>

            <Button
              asChild
              size="lg"
              className="mt-6 w-full bg-whatsapp text-white hover:bg-whatsapp/90"
            >
              <a
                href={waLink(primary.wa, "Hi GSK Enterprises, I have a question.")}
                target="_blank"
                rel="noreferrer"
              >
                Message on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
