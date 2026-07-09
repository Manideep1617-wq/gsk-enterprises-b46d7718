import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { adminMe } from "@/lib/admin.functions";
import { toast } from "sonner";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminShell,
});

const NAV = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/listings", label: "Listings" },
  { to: "/admin/requests", label: "Seller Requests" },
  { to: "/admin/inquiries", label: "Inquiries" },
] as const;

function AdminShell() {
  const navigate = useNavigate();
  const me = useServerFn(adminMe);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "me"],
    queryFn: () => me(),
  });

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }
  if (error || !data?.isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-destructive">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only the site owner can access the admin dashboard. This account is not
            authorized.
          </p>
          <Button
            className="mt-6"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/" });
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-brand text-brand-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-gold text-gold-foreground font-display text-xs font-bold">
              GSK
            </div>
            <span className="font-display font-bold">Admin Dashboard</span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeProps={{ className: "text-gold" }}
                activeOptions={{ exact: n.exact }}
                className="text-sm text-white/80 hover:text-white"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-white/60 hover:text-white">
              View site
            </Link>
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={async () => {
                await supabase.auth.signOut();
                toast.success("Signed out");
                navigate({ to: "/" });
              }}
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-4 overflow-x-auto px-6 pb-3 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeProps={{ className: "text-gold" }}
              className="whitespace-nowrap text-xs text-white/80"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-background py-6 text-center text-xs text-muted-foreground">
        {SITE.brand} · Admin
      </footer>
    </div>
  );
}
