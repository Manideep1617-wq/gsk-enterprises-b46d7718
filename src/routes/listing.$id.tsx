import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { queryOptions, useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, Compass, MapPin, PhoneCall, Ruler, Tag } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getListing, getSimilarListings, submitInquiry } from "@/lib/listings.functions";
import {
  AREA_UNITS,
  FACING_DIRS,
  PROPERTY_TYPES,
  SITE,
  formatINR,
  labelForEnum,
  waLink,
} from "@/lib/site";

const listingQO = (id: string) =>
  queryOptions({
    queryKey: ["listings", "detail", id],
    queryFn: () => getListing({ data: { id } }),
  });

export const Route = createFileRoute("/listing/$id")({
  loader: async ({ context, params }) => {
    const l = await context.queryClient.ensureQueryData(listingQO(params.id));
    if (!l) throw notFound();
    void context.queryClient.prefetchQuery({
      queryKey: ["listings", "similar", params.id, l.property_type, l.listing_type],
      queryFn: () =>
        getSimilarListings({
          data: {
            id: params.id,
            property_type: l.property_type as string,
            listing_type: l.listing_type as string,
          },
        }),
    });
  },
  head: ({ loaderData: _l, params }) => ({
    meta: [
      { title: `Property Details — GSK Enterprises` },
      { name: "description", content: `Verified property in Kattedan / Sri Ram Colony. Listing ${params.id}.` },
    ],
  }),
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-brand">Listing unavailable</h1>
        <p className="mt-2 text-muted-foreground">
          This property may have been sold, rented, or is no longer active.
        </p>
        <Button asChild className="mt-6 bg-brand text-brand-foreground">
          <Link to="/browse">Back to browse</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">{error.message}</div>
  ),
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = Route.useParams();
  const { data: listing } = useSuspenseQuery(listingQO(id));
  if (!listing) return null;

  const isRent = listing.listing_type === "rent";
  const primary = SITE.phones[0];
  const waMessage = `Hi, I'm interested in "${listing.title}" (${formatINR(listing.price)}). Please share more details.`;
  const gallery: string[] = [
    ...(listing.cover_image ? [listing.cover_image] : []),
    ...((listing.images ?? []).filter((u: string) => u !== listing.cover_image) as string[]),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6">
        <Link
          to="/browse"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" /> Back to browse
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* Gallery */}
          <div>
            {gallery.length > 0 ? (
              <Carousel className="overflow-hidden rounded-2xl">
                <CarouselContent>
                  {gallery.map((url, i) => (
                    <CarouselItem key={i}>
                      <div className="aspect-[16/10] bg-muted">
                        <img
                          src={url}
                          alt={`${listing.title} ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {gallery.length > 1 && (
                  <>
                    <CarouselPrevious className="left-3" />
                    <CarouselNext className="right-3" />
                  </>
                )}
              </Carousel>
            ) : (
              <div className="grid aspect-[16/10] place-items-center rounded-2xl bg-gradient-to-br from-brand/10 to-gold/10 text-xs uppercase tracking-widest text-muted-foreground">
                No image available
              </div>
            )}

            <div className="mt-8">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className={isRent ? "bg-gold text-gold-foreground" : "bg-brand text-brand-foreground"}>
                  {isRent ? "For Rent" : "For Sale"}
                </Badge>
                <Badge variant="outline">
                  {labelForEnum(PROPERTY_TYPES, listing.property_type)}
                </Badge>
              </div>
              <h1 className="font-display text-3xl font-bold text-brand md:text-4xl">
                {listing.title}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {listing.address_text}
              </p>
              <div className="mt-6 font-display text-4xl font-bold text-brand">
                {formatINR(listing.price)}
                {isRent && <span className="text-lg font-medium text-muted-foreground">/mo</span>}
              </div>

              <dl className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-4">
                <Spec
                  icon={Ruler}
                  label="Area"
                  value={`${listing.area_value} ${labelForEnum(AREA_UNITS, listing.area_unit)}`}
                />
                <Spec
                  icon={Compass}
                  label="Facing"
                  value={labelForEnum(FACING_DIRS, listing.facing)}
                />
                <Spec
                  icon={Tag}
                  label="Type"
                  value={labelForEnum(PROPERTY_TYPES, listing.property_type)}
                />
                <Spec
                  icon={MapPin}
                  label="Listed on"
                  value={new Date(listing.created_at as string).toLocaleDateString("en-IN")}
                />
              </dl>

              {listing.description && (
                <div className="mt-8">
                  <h2 className="mb-3 font-display text-xl font-bold text-brand">Description</h2>
                  <p className="whitespace-pre-line leading-relaxed text-foreground">
                    {listing.description}
                  </p>
                </div>
              )}

              {listing.amenities && listing.amenities.length > 0 && (
                <div className="mt-8">
                  <h2 className="mb-3 font-display text-xl font-bold text-brand">Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {(listing.amenities as string[]).map((a) => (
                      <Badge key={a} variant="secondary">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {listing.latitude != null && listing.longitude != null && (
                <div className="mt-8">
                  <h2 className="mb-3 font-display text-xl font-bold text-brand">Location</h2>
                  <div className="overflow-hidden rounded-2xl border border-border">
                    <iframe
                      title="Map"
                      className="h-72 w-full"
                      loading="lazy"
                      src={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}&z=15&output=embed`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact rail */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-gold">
                Contact GSK Enterprises
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Talk to our team directly. No middlemen, no platform fees.
              </p>
              <div className="mt-5 grid gap-2">
                <Button asChild size="lg" className="bg-brand text-brand-foreground">
                  <a href={`tel:${primary.tel}`}>
                    <PhoneCall className="mr-2 h-4 w-4" /> Call {primary.display}
                  </a>
                </Button>
                <Button asChild size="lg" className="bg-whatsapp text-white hover:bg-whatsapp/90">
                  <a href={waLink(primary.wa, waMessage)} target="_blank" rel="noreferrer">
                    WhatsApp Enquiry
                  </a>
                </Button>
              </div>
              <hr className="my-6 border-border" />
              <InquiryForm listingId={listing.id as string} listingTitle={listing.title as string} />
            </div>
          </aside>
        </div>

        <SimilarSection
          id={id}
          propertyType={listing.property_type as string}
          listingType={listing.listing_type as string}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

function Spec({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

const inquirySchema = z.object({
  buyer_name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(20),
  message: z.string().trim().max(1000).optional(),
});
type InquiryValues = z.infer<typeof inquirySchema>;

function InquiryForm({ listingId, listingTitle }: { listingId: string; listingTitle: string }) {
  const form = useForm<InquiryValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      buyer_name: "",
      phone: "",
      message: `I'm interested in "${listingTitle}". Please contact me.`,
    },
  });
  const submit = useServerFn(submitInquiry);
  const mutation = useMutation({
    mutationFn: (data: InquiryValues) => submit({ data: { ...data, listing_id: listingId } }),
    onSuccess: () => {
      toast.success("Enquiry sent — we'll be in touch shortly.");
      form.reset({ buyer_name: "", phone: "", message: "" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to submit enquiry"),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="space-y-3"
      >
        <p className="text-sm font-semibold text-foreground">Or send an enquiry</p>
        <FormField
          control={form.control}
          name="buyer_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Your name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Phone</FormLabel>
              <FormControl>
                <Input inputMode="tel" placeholder="Phone / WhatsApp" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Message</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Your message (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
        >
          {mutation.isPending ? "Sending…" : "Send Enquiry"}
        </Button>
      </form>
    </Form>
  );
}

function SimilarSection({
  id,
  propertyType,
  listingType,
}: {
  id: string;
  propertyType: string;
  listingType: string;
}) {
  const [{ data }] = [
    useSuspenseQuery(
      queryOptions({
        queryKey: ["listings", "similar", id, propertyType, listingType],
        queryFn: () =>
          getSimilarListings({
            data: { id, property_type: propertyType, listing_type: listingType },
          }),
      }),
    ),
  ];
  if (!data || data.length === 0) return null;
  return (
    <section className="mt-16">
      <h2 className="mb-6 font-display text-2xl font-bold text-brand">Similar Properties</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </section>
  );
}
