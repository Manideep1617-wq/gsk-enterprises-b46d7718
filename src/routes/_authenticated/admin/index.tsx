import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Inbox, MailQuestion } from "lucide-react";
import { adminStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(adminStats);
  const { data } = useQuery({ queryKey: ["admin", "stats"], queryFn: () => fn() });

  const cards = [
    { label: "Active Listings", value: data?.activeListings ?? "—", icon: Building2, to: "/admin/listings" },
    { label: "Pending Seller Requests", value: data?.pendingRequests ?? "—", icon: Inbox, to: "/admin/requests" },
    { label: "New Inquiries", value: data?.newInquiries ?? "—", icon: MailQuestion, to: "/admin/inquiries" },
  ] as const;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-brand">Overview</h1>
      <p className="mt-1 text-muted-foreground">Quick snapshot of platform activity.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-gold"
          >
            <c.icon className="mb-3 h-6 w-6 text-gold" />
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {c.label}
            </div>
            <div className="mt-2 font-display text-4xl font-bold text-brand">{c.value}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
