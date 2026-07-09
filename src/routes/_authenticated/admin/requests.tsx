import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, X, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminListRequests, adminUpdateRequestStatus } from "@/lib/admin.functions";
import { AREA_UNITS, formatINR, labelForEnum, PROPERTY_TYPES, LISTING_TYPES, FACING_DIRS } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/requests")({
  component: RequestsPage,
});

const statusColor: Record<string, string> = {
  pending: "bg-gold text-gold-foreground",
  approved: "bg-whatsapp text-white",
  rejected: "bg-destructive text-destructive-foreground",
  contacted: "bg-brand text-brand-foreground",
};

function RequestsPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const list = useServerFn(adminListRequests);
  const upd = useServerFn(adminUpdateRequestStatus);
  const { data = [] } = useQuery({ queryKey: ["admin", "requests"], queryFn: () => list() });
  const mut = useMutation({
    mutationFn: (v: { id: string; status: any }) => upd({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "requests"] }),
  });

  const approve = (r: any) => {
    mut.mutate({ id: r.id, status: "approved" });
    nav({
      to: "/admin/listings/new",
      search: {
        title: `${labelForEnum(PROPERTY_TYPES, r.property_type)} in ${r.location}`,
        listing_type: r.listing_type,
        property_type: r.property_type,
        address_text: r.location,
        area_value: r.area_value ? Number(r.area_value) : undefined,
        area_unit: r.area_unit ?? undefined,
        price: r.expected_price ? Number(r.expected_price) : undefined,
        facing: r.facing ?? undefined,
        description: r.description ?? undefined,
      } as never,
    });
    toast.success("Approved — pre-filled new listing form");
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-brand">Seller Requests</h1>
      <p className="mt-1 text-muted-foreground">
        Review submitted requests. Approve to pre-fill a new listing.
      </p>

      <div className="mt-6 grid gap-4">
        {data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No seller requests yet.
          </div>
        )}
        {data.map((r: any) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-brand">{r.seller_name}</h3>
                  <Badge className={statusColor[r.status] ?? ""}>{r.status}</Badge>
                </div>
                <a
                  href={`tel:${r.phone}`}
                  className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand"
                >
                  <Phone className="h-3.5 w-3.5" /> {r.phone}
                </a>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString("en-IN")}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <Field label="Type">
                {labelForEnum(LISTING_TYPES, r.listing_type)} · {labelForEnum(PROPERTY_TYPES, r.property_type)}
              </Field>
              <Field label="Location">{r.location}</Field>
              <Field label="Area">
                {r.area_value ? `${r.area_value} ${labelForEnum(AREA_UNITS, r.area_unit)}` : "—"}
              </Field>
              <Field label="Expected Price">{formatINR(r.expected_price)}</Field>
            </div>
            {r.facing && (
              <div className="mt-3 text-xs text-muted-foreground">
                Facing: {labelForEnum(FACING_DIRS, r.facing)}
              </div>
            )}
            {r.description && (
              <p className="mt-3 rounded-lg bg-surface p-3 text-sm text-foreground">{r.description}</p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-whatsapp text-white hover:bg-whatsapp/90"
                onClick={() => approve(r)}
              >
                <Check className="mr-1.5 h-4 w-4" /> Approve & Convert to Listing
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => mut.mutate({ id: r.id, status: "contacted" })}
              >
                Mark Contacted
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => mut.mutate({ id: r.id, status: "rejected" })}
              >
                <X className="mr-1.5 h-4 w-4" /> Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm text-foreground">{children}</div>
    </div>
  );
}
