import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function serverPublicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  );
}

const listingFields =
  "id,title,description,listing_type,property_type,price,area_value,area_unit,facing,address_text,latitude,longitude,cover_image,images,amenities,status,created_at";

export const getFeaturedListings = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("listings")
    .select(listingFields)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) throw new Error(error.message);
  return data ?? [];
});

const browseSchema = z.object({
  listing_type: z.enum(["sale", "rent"]).optional(),
  property_type: z
    .enum(["house", "flat", "plot", "commercial", "agricultural"])
    .optional(),
  facing: z
    .enum([
      "north",
      "south",
      "east",
      "west",
      "north_east",
      "north_west",
      "south_east",
      "south_west",
    ])
    .optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  q: z.string().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "size_asc", "size_desc"]).optional(),
});

export const browseListings = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => browseSchema.parse(d))
  .handler(async ({ data }) => {
    const supabase = serverPublicClient();
    let q = supabase.from("listings").select(listingFields).eq("status", "active");
    if (data.listing_type) q = q.eq("listing_type", data.listing_type);
    if (data.property_type) q = q.eq("property_type", data.property_type);
    if (data.facing) q = q.eq("facing", data.facing);
    if (data.min_price != null) q = q.gte("price", data.min_price);
    if (data.max_price != null) q = q.lte("price", data.max_price);
    if (data.q && data.q.trim()) q = q.ilike("address_text", `%${data.q.trim()}%`);
    switch (data.sort) {
      case "price_asc":
        q = q.order("price", { ascending: true });
        break;
      case "price_desc":
        q = q.order("price", { ascending: false });
        break;
      case "size_asc":
        q = q.order("area_value", { ascending: true });
        break;
      case "size_desc":
        q = q.order("area_value", { ascending: false });
        break;
      default:
        q = q.order("created_at", { ascending: false });
    }
    const { data: rows, error } = await q.limit(60);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getListing = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = serverPublicClient();
    const { data: row, error } = await supabase
      .from("listings")
      .select(listingFields)
      .eq("id", data.id)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const getSimilarListings = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        property_type: z.string(),
        listing_type: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = serverPublicClient();
    const { data: rows, error } = await supabase
      .from("listings")
      .select(listingFields)
      .eq("status", "active")
      .eq("property_type", data.property_type as never)
      .eq("listing_type", data.listing_type as never)
      .neq("id", data.id)
      .limit(3);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---- Public writes (submitted by anon visitors) ----

const inquirySchema = z.object({
  listing_id: z.string().uuid(),
  buyer_name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
  message: z.string().trim().max(1000).optional(),
});

export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inquirySchema.parse(d))
  .handler(async ({ data }) => {
    const supabase = serverPublicClient();
    const { error } = await supabase.from("inquiries").insert({
      listing_id: data.listing_id,
      buyer_name: data.buyer_name,
      phone: data.phone,
      message: data.message ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const sellerRequestSchema = z.object({
  seller_name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
  listing_type: z.enum(["sale", "rent"]),
  property_type: z.enum(["house", "flat", "plot", "commercial", "agricultural"]),
  location: z.string().trim().min(1).max(200),
  area_value: z.number().nullable().optional(),
  area_unit: z.enum(["sqft", "sqyd", "acre", "cent", "gunta"]).optional(),
  expected_price: z.number().nullable().optional(),
  facing: z
    .enum([
      "north",
      "south",
      "east",
      "west",
      "north_east",
      "north_west",
      "south_east",
      "south_west",
    ])
    .nullable()
    .optional(),
  description: z.string().trim().max(2000).optional(),
});

export const submitSellerRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => sellerRequestSchema.parse(d))
  .handler(async ({ data }) => {
    const supabase = serverPublicClient();
    const { error } = await supabase.from("seller_requests").insert({
      seller_name: data.seller_name,
      phone: data.phone,
      listing_type: data.listing_type,
      property_type: data.property_type,
      location: data.location,
      area_value: data.area_value ?? null,
      area_unit: data.area_unit ?? "sqft",
      expected_price: data.expected_price ?? null,
      facing: data.facing ?? null,
      description: data.description ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
