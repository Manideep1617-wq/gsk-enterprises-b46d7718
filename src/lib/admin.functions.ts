import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const adminMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getAdminAccess } = await import("@/lib/admin-permissions.server");
    const access = await getAdminAccess(context.userId);
    return {
      userId: context.userId,
      email: typeof context.claims.email === "string" ? context.claims.email : null,
      ...access,
    };
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdminUser } = await import("@/lib/admin-permissions.server");
    await assertAdminUser(context.userId);
    const [listings, pending, inquiries] = await Promise.all([
      context.supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
      context.supabase.from("seller_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      context.supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]);
    return {
      activeListings: listings.count ?? 0,
      pendingRequests: pending.count ?? 0,
      newInquiries: inquiries.count ?? 0,
    };
  });

const listingFields =
  "id,title,description,listing_type,property_type,price,area_value,area_unit,facing,address_text,latitude,longitude,cover_image,images,amenities,status,created_at";

export const adminListListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdminUser } = await import("@/lib/admin-permissions.server");
    await assertAdminUser(context.userId);
    const { data, error } = await context.supabase
      .from("listings")
      .select(listingFields)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminGetListing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdminUser } = await import("@/lib/admin-permissions.server");
    await assertAdminUser(context.userId);
    const { data: row, error } = await context.supabase
      .from("listings")
      .select(listingFields)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

const listingPayload = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional().nullable(),
  listing_type: z.enum(["sale", "rent"]),
  property_type: z.enum(["house", "flat", "plot", "commercial", "agricultural"]),
  price: z.number().nonnegative(),
  area_value: z.number().nonnegative(),
  area_unit: z.enum(["sqft", "sqyd", "acre", "cent", "gunta"]),
  facing: z
    .enum([
      "north","south","east","west","north_east","north_west","south_east","south_west",
    ])
    .nullable()
    .optional(),
  address_text: z.string().trim().min(1).max(400),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  cover_image: z.string().min(1).nullable().optional(),
  images: z.array(z.string().url()).optional(),
  image_uploads: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        type: z.string().min(1).max(100),
        base64: z.string().min(1),
        previewUrl: z.string().min(1),
      }),
    )
    .optional(),
  amenities: z.array(z.string()).optional(),
  status: z.enum(["active", "sold", "rented", "inactive"]).optional(),
});

export const adminCreateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => listingPayload.parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdminUser } = await import("@/lib/admin-permissions.server");
    await assertAdminUser(context.userId);
    const { image_uploads = [], ...listingData } = data;
    const uploadedImages: Array<{ previewUrl: string; signedUrl: string }> = [];
    if (image_uploads.length > 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      for (const image of image_uploads) {
        const safeName = image.name.replace(/[^\w.\-]+/g, "_");
        const path = `${context.userId}/${crypto.randomUUID()}-${safeName}`;
        const bytes = Uint8Array.from(atob(image.base64), (char) => char.charCodeAt(0));
        const { error: uploadError } = await supabaseAdmin.storage
          .from("listing-images")
          .upload(path, bytes, {
            contentType: image.type,
            cacheControl: "31536000",
            upsert: false,
          });
        if (uploadError) throw new Error(`Failed to upload ${image.name}, please try again`);

        const { data: signed, error: signError } = await supabaseAdmin.storage
          .from("listing-images")
          .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signError || !signed?.signedUrl) {
          throw new Error(signError?.message ?? "Could not create image URL");
        }
        uploadedImages.push({ previewUrl: image.previewUrl, signedUrl: signed.signedUrl });
      }
    }

    const imageUrls = [...(listingData.images ?? []), ...uploadedImages.map((image) => image.signedUrl)];
    const coverImage = uploadedImages.find((image) => image.previewUrl === listingData.cover_image)?.signedUrl
      ?? listingData.cover_image
      ?? imageUrls[0]
      ?? null;

    const { data: row, error } = await context.supabase
      .from("listings")
      .insert({
        ...listingData,
        cover_image: coverImage,
        images: imageUrls,
        amenities: listingData.amenities ?? [],
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminUpdateListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), patch: listingPayload.partial() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdminUser } = await import("@/lib/admin-permissions.server");
    await assertAdminUser(context.userId);
    const { image_uploads = [], ...patch } = data.patch;
    const uploadedImages: Array<{ previewUrl: string; signedUrl: string }> = [];
    if (image_uploads.length > 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      for (const image of image_uploads) {
        const safeName = image.name.replace(/[^\w.\-]+/g, "_");
        const path = `${context.userId}/${crypto.randomUUID()}-${safeName}`;
        const bytes = Uint8Array.from(atob(image.base64), (char) => char.charCodeAt(0));
        const { error: uploadError } = await supabaseAdmin.storage
          .from("listing-images")
          .upload(path, bytes, {
            contentType: image.type,
            cacheControl: "31536000",
            upsert: false,
          });
        if (uploadError) throw new Error(`Failed to upload ${image.name}, please try again`);

        const { data: signed, error: signError } = await supabaseAdmin.storage
          .from("listing-images")
          .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signError || !signed?.signedUrl) {
          throw new Error(signError?.message ?? "Could not create image URL");
        }
        uploadedImages.push({ previewUrl: image.previewUrl, signedUrl: signed.signedUrl });
      }
    }

    const nextPatch = { ...patch };
    if (uploadedImages.length > 0 || "images" in patch || "cover_image" in patch) {
      const nextImages = [...(patch.images ?? []), ...uploadedImages.map((image) => image.signedUrl)];
      const nextCover = uploadedImages.find((image) => image.previewUrl === patch.cover_image)?.signedUrl
        ?? patch.cover_image
        ?? nextImages[0]
        ?? null;
      nextPatch.images = nextImages;
      nextPatch.cover_image = nextCover;
    }

    const { error } = await context.supabase
      .from("listings")
      .update(nextPatch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdminUser } = await import("@/lib/admin-permissions.server");
    await assertAdminUser(context.userId);
    const { data: listing, error: readError } = await context.supabase
      .from("listings")
      .select("images,cover_image")
      .eq("id", data.id)
      .maybeSingle();
    if (readError) throw new Error(readError.message);

    const { error } = await context.supabase.from("listings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);

    const imageUrls = Array.from(new Set([...(listing?.images ?? []), listing?.cover_image].filter(Boolean))) as string[];
    const paths = imageUrls
      .map((url) => {
        try {
          const pathname = new URL(url).pathname;
          const signedMarker = "/storage/v1/object/sign/listing-images/";
          const publicMarker = "/storage/v1/object/public/listing-images/";
          if (pathname.includes(signedMarker)) {
            return decodeURIComponent(pathname.split(signedMarker)[1]);
          }
          if (pathname.includes(publicMarker)) {
            return decodeURIComponent(pathname.split(publicMarker)[1]);
          }
        } catch {
          return null;
        }
        return null;
      })
      .filter(Boolean) as string[];

    if (paths.length > 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.storage.from("listing-images").remove(paths);
    }
    return { ok: true };
  });

// ---- Seller requests ----
export const adminListRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdminUser } = await import("@/lib/admin-permissions.server");
    await assertAdminUser(context.userId);
    const { data, error } = await context.supabase
      .from("seller_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdateRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "approved", "rejected", "contacted"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdminUser } = await import("@/lib/admin-permissions.server");
    await assertAdminUser(context.userId);
    const { error } = await context.supabase
      .from("seller_requests")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Inquiries ----
export const adminListInquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdminUser } = await import("@/lib/admin-permissions.server");
    await assertAdminUser(context.userId);
    const { data, error } = await context.supabase
      .from("inquiries")
      .select("*, listings(title)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdateInquiryStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "contacted", "closed"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdminUser } = await import("@/lib/admin-permissions.server");
    await assertAdminUser(context.userId);
    const { error } = await context.supabase
      .from("inquiries")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
