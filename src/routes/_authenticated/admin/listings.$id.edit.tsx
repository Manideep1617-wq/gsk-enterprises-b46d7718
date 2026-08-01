import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ListingForm, type ListingFormSubmitValues } from "@/components/listing-form";
import { adminGetListing, adminUpdateListing } from "@/lib/admin.functions";
import { prepareImageUploads } from "@/lib/image-upload-browser";

export const Route = createFileRoute("/_authenticated/admin/listings/$id/edit")({
  component: EditListingPage,
});

function EditListingPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(adminGetListing);
  const upd = useServerFn(adminUpdateListing);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "listings", id],
    queryFn: () => get({ data: { id } }),
  });
  const mut = useMutation({
    mutationFn: async ({ pendingImages, ...values }: ListingFormSubmitValues) =>
      upd({
        data: {
          id,
          patch: { ...values, image_uploads: await prepareImageUploads(pendingImages) } as any,
        },
      }),
    onSuccess: () => {
      toast.success("Listing updated");
      qc.invalidateQueries({ queryKey: ["admin", "listings"] });
      nav({ to: "/admin/listings" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!data) throw notFound();

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-brand">Edit Listing</h1>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <ListingForm
          initial={data as any}
          submitting={mut.isPending}
          submitLabel="Update Listing"
          onCancel={() => nav({ to: "/admin/listings" })}
          onSubmit={(v) => mut.mutate(v)}
        />
      </div>
    </div>
  );
}
