import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitSellerRequest } from "@/lib/listings.functions";
import { AREA_UNITS, FACING_DIRS, LISTING_TYPES, PROPERTY_TYPES } from "@/lib/site";
import { useState } from "react";

const schema = z.object({
  seller_name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(20),
  listing_type: z.enum(["sale", "rent"]),
  property_type: z.enum(["house", "flat", "plot", "commercial", "agricultural"]),
  location: z.string().trim().min(1, "Location is required").max(200),
  area_value: z.string().optional(),
  area_unit: z.enum(["sqft", "sqyd", "acre", "cent", "gunta"]),
  expected_price: z.string().optional(),
  facing: z
    .enum(["north","south","east","west","north_east","north_west","south_east","south_west"])
    .optional(),
  description: z.string().trim().max(2000).optional(),
});
type Values = z.infer<typeof schema>;

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "List Your Property — GSK Enterprises" },
      {
        name: "description",
        content:
          "Submit your property to GSK Enterprises. Our team reviews and lists verified plots, houses, and land in Kattedan and Sri Ram Colony.",
      },
      { property: "og:title", content: "List Your Property — GSK Enterprises" },
      {
        property: "og:description",
        content: "Sell or rent your property with a trusted local mediator in Hyderabad.",
      },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      seller_name: "",
      phone: "",
      listing_type: "sale",
      property_type: "plot",
      location: "",
      area_unit: "sqft",
      area_value: "",
      expected_price: "",
      description: "",
    },
  });
  const submit = useServerFn(submitSellerRequest);
  const mutation = useMutation({
    mutationFn: (v: Values) =>
      submit({
        data: {
          seller_name: v.seller_name,
          phone: v.phone,
          listing_type: v.listing_type,
          property_type: v.property_type,
          location: v.location,
          area_value: v.area_value ? Number(v.area_value) : null,
          area_unit: v.area_unit,
          expected_price: v.expected_price ? Number(v.expected_price) : null,
          facing: v.facing ?? null,
          description: v.description || undefined,
        },
      }),
    onSuccess: () => {
      setSubmitted(true);
      form.reset();
      toast.success("Request submitted. Our team will contact you within 24-48 hours.");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to submit"),
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 md:px-6">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold text-brand">
            List Your Property
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Submit your property details. Our team will review and contact you before
            listing it on GSK Enterprises. There is no charge to list.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-whatsapp" />
            <h2 className="font-display text-2xl font-bold text-brand">
              Thank you — request received!
            </h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              Our team will contact you within 24-48 hours to verify details and
              schedule a site visit.
            </p>
            <Button
              className="mt-6 bg-brand text-brand-foreground"
              onClick={() => setSubmitted(false)}
            >
              Submit another
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
              className="grid gap-6 rounded-2xl border border-border bg-card p-6 md:p-8"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="seller_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
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
                      <FormLabel>Phone / WhatsApp *</FormLabel>
                      <FormControl>
                        <Input inputMode="tel" placeholder="+91 …" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="listing_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing Type *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LISTING_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
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
                      <FormLabel>Property Type *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PROPERTY_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location / Area *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Sri Ram Colony, Kattedan"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 sm:grid-cols-[1fr_1fr_1fr]">
                <FormField
                  control={form.control}
                  name="area_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area / Size</FormLabel>
                      <FormControl>
                        <Input inputMode="decimal" placeholder="e.g. 1650" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="area_unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AREA_UNITS.map((u) => (
                            <SelectItem key={u.value} value={u.value}>
                              {u.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expected_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Price (₹)</FormLabel>
                      <FormControl>
                        <Input inputMode="numeric" placeholder="e.g. 7500000" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="facing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facing (optional)</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select facing direction" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FACING_DIRS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Anything else buyers should know…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                disabled={mutation.isPending}
                className="bg-brand text-brand-foreground hover:bg-brand/90"
              >
                {mutation.isPending ? "Submitting…" : "Submit Property Details"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                By submitting, you agree that GSK Enterprises may contact you regarding
                your listing. Your details are shared only with verified buyers.
              </p>
            </form>
          </Form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
