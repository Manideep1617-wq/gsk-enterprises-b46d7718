import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { adminDeleteListing, adminListListings, adminUpdateListing } from "@/lib/admin.functions";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LISTING_STATUSES, formatINR, labelForEnum, PROPERTY_TYPES } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/listings")({
  component: ListingsAdmin,
});

function ListingsAdmin() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const list = useServerFn(adminListListings);
  const upd = useServerFn(adminUpdateListing);
  const del = useServerFn(adminDeleteListing);
  const { data = [] } = useQuery({ queryKey: ["admin", "listings"], queryFn: () => list() });

  const updateMut = useMutation({
    mutationFn: (v: { id: string; patch: any }) => upd({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "listings"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Listing deleted");
      qc.invalidateQueries({ queryKey: ["admin", "listings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand">Listings</h1>
          <p className="text-muted-foreground">Add, edit, or change status of properties.</p>
        </div>
        <Button
          className="bg-brand text-brand-foreground"
          onClick={() => navigate({ to: "/admin/listings/new" })}
        >
          <Plus className="mr-1.5 h-4 w-4" /> New Listing
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No listings yet.
                </TableCell>
              </TableRow>
            )}
            {data.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell>
                  <div className="font-medium text-foreground">{l.title}</div>
                  <div className="text-xs text-muted-foreground">{l.address_text}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{labelForEnum(PROPERTY_TYPES, l.property_type)}</Badge>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {l.listing_type === "rent" ? "Rent" : "Sale"}
                  </div>
                </TableCell>
                <TableCell>{formatINR(l.price)}</TableCell>
                <TableCell>
                  <Select
                    value={l.status}
                    onValueChange={(v) =>
                      updateMut.mutate({ id: l.id, patch: { status: v as any } })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LISTING_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/admin/listings/$id/edit" params={{ id: l.id }}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`Delete "${l.title}"?`)) deleteMut.mutate(l.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
