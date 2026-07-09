// Brand + contact constants (safe to import anywhere; no secrets)
export const SITE = {
  brand: "GSK Enterprises",
  tagline: "Real Estate Developers",
  regionShort: "Kattedan & Sri Ram Colony",
  regionLong: "Kattedan, Sri Ram Colony, Hyderabad",
  email: "gshanker9700@gmail.com",
  phones: [
    { display: "+91 87121 77076", tel: "+918712177076", wa: "918712177076" },
    { display: "+91 97008 37455", tel: "+919700837455", wa: "919700837455" },
  ],
  hours: "Mon – Sat, 9:30 AM – 8:00 PM",
  services: [
    "Open Plots",
    "Houses & Villas",
    "Agricultural Land",
    "Commercial Property",
    "Home Loans",
    "Business Loans",
  ],
} as const;

export const ADMIN_EMAIL = "gshanker9700@gmail.com";

export function waLink(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export const LISTING_TYPES = [
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
] as const;

export const PROPERTY_TYPES = [
  { value: "house", label: "House / Villa" },
  { value: "flat", label: "Flat / Apartment" },
  { value: "plot", label: "Plot / Land" },
  { value: "commercial", label: "Commercial" },
  { value: "agricultural", label: "Agricultural" },
] as const;

export const AREA_UNITS = [
  { value: "sqft", label: "Sq Ft" },
  { value: "sqyd", label: "Sq Yds" },
  { value: "acre", label: "Acre" },
  { value: "cent", label: "Cent" },
  { value: "gunta", label: "Gunta" },
] as const;

export const FACING_DIRS = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
  { value: "north_east", label: "North-East" },
  { value: "north_west", label: "North-West" },
  { value: "south_east", label: "South-East" },
  { value: "south_west", label: "South-West" },
] as const;

export const LISTING_STATUSES = [
  { value: "active", label: "Active" },
  { value: "sold", label: "Sold" },
  { value: "rented", label: "Rented" },
  { value: "inactive", label: "Inactive" },
] as const;

export function formatINR(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!isFinite(n)) return "—";
  if (n >= 1_00_00_000) return `₹ ${(n / 1_00_00_000).toFixed(2).replace(/\.00$/, "")} Cr`;
  if (n >= 1_00_000) return `₹ ${(n / 1_00_000).toFixed(2).replace(/\.00$/, "")} Lakhs`;
  return `₹ ${n.toLocaleString("en-IN")}`;
}

export function labelForEnum<T extends { value: string; label: string }>(
  arr: readonly T[],
  v: string | null | undefined,
): string {
  if (!v) return "—";
  return arr.find((x) => x.value === v)?.label ?? v;
}
