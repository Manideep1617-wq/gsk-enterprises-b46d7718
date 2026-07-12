import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AREA_UNITS, FACING_DIRS, LISTING_STATUSES, LISTING_TYPES, PROPERTY_TYPES,
} from "@/lib/site";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional().nullable(),
  listing_type: z.enum(["sale", "rent"]),
  property_type: z.enum(["house", "flat", "plot", "commercial", "agricultural"]),
  price: z.number().nonnegative(),
  area_value: z.number().nonnegative(),
  area_unit: z.enum(["sqft", "sqyd", "acre", "cent", "gunta"]),
  facing: z
    .enum(["north","south","east","west","north_east","north_west","south_east","south_west"])
    .nullable()
    .optional(),
  address_text: z.string().trim().min(1).max(400),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  cover_image: z.string().min(1).nullable().optional(),
  images: z.array(z.string().url()),
  amenities: z.array(z.string()),
  status: z.enum(["active", "sold", "rented", "inactive"]),
});
export type ListingFormValues = z.infer<typeof schema>;

export type ListingFormSubmitValues = ListingFormValues & {
  pendingImages: Array<{ file: File; previewUrl: string }>;
};

function cleanInitialValues(initial?: Partial<ListingFormValues>) {
  return Object.fromEntries(
    Object.entries(initial ?? {}).filter(([, value]) => value !== undefined),
  ) as Partial<ListingFormValues>;
}

export function ListingForm({
  initial,
  submitting,
  submitLabel = "Save Listing",
  onCancel,
  onSubmit,
}: {
  initial?: Partial<ListingFormValues>;
  submitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  onSubmit: (v: ListingFormSubmitValues) => void;
}) {
  const safeInitial = cleanInitialValues(initial);
  const form = useForm<ListingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      listing_type: "sale",
      property_type: "plot",
      price: 0,
      area_value: 0,
      area_unit: "sqft",
      facing: null,
      address_text: "",
      latitude: null,
      longitude: null,
      cover_image: null,
      images: [],
      amenities: [],
      status: "active",
      ...safeInitial,
    },
  });

  useEffect(() => {
    if (initial) form.reset({ ...form.getValues(), ...cleanInitialValues(initial) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.title]);

  const images = form.watch("images");
  const cover = form.watch("cover_image");
  const [pendingFiles, setPendingFiles] = useState<Array<{ id: string; file: File; url: string }>>([]);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const nextFiles = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }));
    setPendingFiles((current) => [...current, ...nextFiles]);
    form.clearErrors("images");
    if (!cover && !images[0] && nextFiles[0]) {
      form.setValue("cover_image", nextFiles[0].url, { shouldDirty: true });
    }
  };

  const removeImage = (url: string) => {
    const next = images.filter((u) => u !== url);
    form.setValue("images", next, { shouldDirty: true });
    if (cover === url) form.setValue("cover_image", next[0] ?? null);
  };

  const removePendingImage = (url: string) => {
    setPendingFiles((current) => {
      const item = current.find((pending) => pending.url === url);
      if (item) URL.revokeObjectURL(item.url);
      return current.filter((pending) => pending.url !== url);
    });
    if (cover === url) form.setValue("cover_image", images[0] ?? pendingFiles.find((p) => p.url !== url)?.url ?? null);
  };

  const handleSubmit = (values: ListingFormValues) => {
    if (values.images.length + pendingFiles.length === 0) {
      form.setError("images", { type: "manual", message: "Add at least one image." });
      return;
    }

    onSubmit({
      ...values,
      pendingImages: pendingFiles.map((pending) => ({ file: pending.file, previewUrl: pending.url })),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="listing_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Listing type *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {LISTING_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="property_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property type *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {PROPERTY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₹) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="area_value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="area_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {AREA_UNITS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="facing"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Facing</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v || null)}
                >
                  <FormControl><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {FACING_DIRS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {LISTING_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="address_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address *</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />

        <div>
          <label className="text-sm font-medium leading-none">Images *</label>
          <div className="mt-2 flex flex-wrap gap-3">
            {images.map((url) => (
              <div key={url} className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white"
                  onClick={() => removeImage(url)}
                >
                  <X className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue("cover_image", url)}
                  className={`absolute inset-x-0 bottom-0 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                    cover === url ? "bg-gold text-gold-foreground" : "bg-black/60 text-white"
                  }`}
                >
                  {cover === url ? "Cover" : "Set cover"}
                </button>
              </div>
            ))}
            {pendingFiles.map((pending) => (
              <div key={pending.id} className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
                <img src={pending.url} alt="Pending property upload" className="h-full w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white"
                  onClick={() => removePendingImage(pending.url)}
                >
                  <X className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue("cover_image", pending.url)}
                  className={`absolute inset-x-0 bottom-0 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                    cover === pending.url ? "bg-gold text-gold-foreground" : "bg-black/60 text-white"
                  }`}
                >
                  {cover === pending.url ? "Cover" : "Set cover"}
                </button>
              </div>
            ))}
            <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-lg border border-dashed border-border text-muted-foreground hover:border-gold">
              <div className="flex flex-col items-center text-xs">
                <Upload className="mb-1 h-4 w-4" />
                Upload Images
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => upload(e.target.files)}
              />
            </label>
          </div>
          {form.formState.errors.images?.message && (
            <p className="mt-2 text-sm font-medium text-destructive">
              {form.formState.errors.images.message}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={submitting} className="w-full bg-brand text-brand-foreground sm:w-auto">
            {submitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
