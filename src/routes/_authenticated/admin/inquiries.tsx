import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminListInquiries, adminUpdateInquiryStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/inquiries")({
  component: InquiriesPage,
});

const statusColor: Record<string, string> = {
  new: "bg-gold text-gold-foreground",
  contacted: "bg-brand text-brand-foreground",
  closed: "bg-muted text-muted-foreground",
};

function InquiriesPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminListInquiries);
  const upd = useServerFn(adminUpdateInquiryStatus);
  const { data = [] } = useQuery({ queryKey: ["admin", "inquiries"], queryFn: () => list() });
  const mut = useMutation({
    mutationFn: (v: { id: string; status: any }) => upd({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "inquiries"] }),
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-brand">Buyer Inquiries</h1>
      <p className="mt-1 text-muted-foreground">Leads submitted via listing detail pages.</p>
      <div className="mt-6 grid gap-4">
        {data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No inquiries yet.
          </div>
        )}
        {data.map((i: any) => (
          <div key={i.id} className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-brand">{i.buyer_name}</h3>
                  <Badge className={statusColor[i.status] ?? ""}>{i.status}</Badge>
                </div>
                <a href={`tel:${i.phone}`} className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand">
                  <Phone className="h-3.5 w-3.5" /> {i.phone}
                </a>
                <div className="mt-1 text-xs text-muted-foreground">
                  Property: <span className="text-foreground">{i.listings?.title ?? i.listing_id}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(i.created_at).toLocaleString("en-IN")}
              </div>
            </div>
            {i.message && (
              <p className="mt-3 rounded-lg bg-surface p-3 text-sm text-foreground">{i.message}</p>
            )}
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => mut.mutate({ id: i.id, status: "contacted" })}
              >
                Mark Contacted
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => mut.mutate({ id: i.id, status: "closed" })}
              >
                Close
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
