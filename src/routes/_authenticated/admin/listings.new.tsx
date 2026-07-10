import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ListingForm, type ListingFormSubmitValues } from "@/components/listing-form";
import { adminCreateListing } from "@/lib/admin.functions";
import { prepareImageUploads } from "@/lib/image-upload.client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/listings/new")({
  component: NewListingPage,
});

function NewListingPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const create = useServerFn(adminCreateListing);
  const prefill = (Route as any).useSearch?.() as Partial<ListingFormSubmitValues> | undefined;

  const mut = useMutation({
    mutationFn: async ({ pendingImages, ...values }: ListingFormSubmitValues) =>
      create({ data: { ...values, image_uploads: await prepareImageUploads(pendingImages) } as any }),
    onSuccess: () => {
      toast.success("Listing created");
      qc.invalidateQueries({ queryKey: ["admin", "listings"] });
      nav({ to: "/admin/listings" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-brand">New Listing</h1>
      <p className="mt-1 text-muted-foreground">
        Fill in property details. Only Active listings appear to visitors.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <ListingForm
          initial={prefill}
          submitting={mut.isPending}
          onSubmit={(v) => mut.mutate(v)}
        />
      </div>
    </div>
  );
}
