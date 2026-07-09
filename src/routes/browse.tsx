import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ListingCard } from "@/components/listing-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { browseListings } from "@/lib/listings.functions";
import { FACING_DIRS, PROPERTY_TYPES, LISTING_TYPES } from "@/lib/site";

const searchSchema = z.object({
  listing_type: z.enum(["sale", "rent"]).optional(),
  property_type: z
    .enum(["house", "flat", "plot", "commercial", "agricultural"])
    .optional(),
  facing: z
    .enum([
      "north","south","east","west","north_east","north_west","south_east","south_west",
    ])
    .optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  q: z.string().optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "size_asc", "size_desc"])
    .optional(),
});

const browseQO = (params: z.infer<typeof searchSchema>) =>
  queryOptions({
    queryKey: ["listings", "browse", params],
    queryFn: () => browseListings({ data: params }),
  });

export const Route = createFileRoute("/browse")({
  validateSearch: (s) => searchSchema.parse(s),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(browseQO(deps)),
  head: () => ({
    meta: [
      { title: "Browse Properties — GSK Enterprises" },
      {
        name: "description",
        content:
          "Browse verified plots, houses, and commercial properties for sale or rent in Kattedan and Sri Ram Colony, Hyderabad.",
      },
      { property: "og:title", content: "Browse Properties — GSK Enterprises" },
      {
        property: "og:description",
        content:
          "Verified plots and houses in Kattedan and Sri Ram Colony. Filter by price, area, and facing.",
      },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: listings } = useSuspenseQuery(browseQO(search));
  const [q, setQ] = useState(search.q ?? "");

  const setSearch = (patch: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) as never });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <section className="border-b border-border/60 bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <h1 className="font-display text-3xl font-bold text-brand">Browse Properties</h1>
          <p className="mt-1 text-muted-foreground">
            {listings.length} {listings.length === 1 ? "property" : "properties"} found in
            Kattedan &amp; Sri Ram Colony.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch({ q: q.trim() || undefined });
            }}
            className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-3 md:flex-row md:items-center"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by locality or area…"
                className="border-none pl-9 shadow-none focus-visible:ring-0"
              />
            </div>
            <Select
              value={search.listing_type ?? "all"}
              onValueChange={(v) =>
                setSearch({
                  listing_type: v === "all" ? undefined : (v as "sale" | "rent"),
                })
              }
            >
              <SelectTrigger className="md:w-40">
                <SelectValue placeholder="Sale or Rent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sale &amp; Rent</SelectItem>
                {LISTING_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={search.property_type ?? "all"}
              onValueChange={(v) =>
                setSearch({ property_type: v === "all" ? undefined : (v as never) })
              }
            >
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All property types</SelectItem>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Sheet>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" className="md:w-auto">
                  <SlidersHorizontal className="mr-2 h-4 w-4" /> More filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Refine your search</SheetTitle>
                  <SheetDescription>Narrow listings by price and facing.</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-5">
                  <div>
                    <Label>Min Price (₹)</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={search.min_price ?? ""}
                      onChange={(e) =>
                        setSearch({
                          min_price: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Max Price (₹)</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={search.max_price ?? ""}
                      onChange={(e) =>
                        setSearch({
                          max_price: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Facing</Label>
                    <Select
                      value={search.facing ?? "any"}
                      onValueChange={(v) =>
                        setSearch({ facing: v === "any" ? undefined : (v as never) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any facing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        {FACING_DIRS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() =>
                      navigate({ search: {} as never })
                    }
                  >
                    Clear all filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <Button type="submit" className="bg-brand text-brand-foreground md:w-auto">
              Search
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-end gap-2 text-sm text-muted-foreground">
            <Label htmlFor="sort" className="text-xs uppercase tracking-widest">
              Sort by
            </Label>
            <Select
              value={search.sort ?? "newest"}
              onValueChange={(v) => setSearch({ sort: v as never })}
            >
              <SelectTrigger className="w-44" id="sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="size_asc">Size: Small to Large</SelectItem>
                <SelectItem value="size_desc">Size: Large to Small</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-12">
        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center">
            <p className="font-display text-xl font-semibold text-brand">
              No properties match those filters
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Try widening your price range or clearing filters. New listings are added
              regularly.
            </p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => navigate({ search: {} as never })}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
