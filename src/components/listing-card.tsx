import { Link } from "@tanstack/react-router";
import { Compass, MapPin, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AREA_UNITS,
  FACING_DIRS,
  PROPERTY_TYPES,
  formatINR,
  labelForEnum,
} from "@/lib/site";

export type ListingCardData = {
  id: string;
  title: string;
  price: number;
  listing_type: "sale" | "rent";
  property_type: string;
  area_value: number;
  area_unit: string;
  facing: string | null;
  address_text: string;
  cover_image: string | null;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const isRent = listing.listing_type === "rent";
  return (
    <Link
      to="/listing/$id"
      params={{ id: listing.id }}
      className="group overflow-hidden rounded-2xl border border-border/70 bg-card transition-all hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {listing.cover_image ? (
          <img
            src={listing.cover_image}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand/10 to-gold/10 text-xs uppercase tracking-widest text-muted-foreground">
            No image
          </div>
        )}
        <Badge
          className={`absolute left-3 top-3 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isRent
              ? "bg-gold text-gold-foreground"
              : "bg-brand text-brand-foreground"
          }`}
        >
          {isRent ? "For Rent" : "For Sale"}
        </Badge>
      </div>
      <div className="p-5">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-bold leading-tight text-brand">
            {formatINR(listing.price)}
            {isRent && <span className="text-sm font-medium text-muted-foreground">/mo</span>}
          </h3>
          {listing.facing && (
            <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
              {labelForEnum(FACING_DIRS, listing.facing)} facing
            </span>
          )}
        </div>
        <p className="mb-1 line-clamp-1 text-sm font-medium text-foreground">
          {listing.title}
        </p>
        <p className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">{listing.address_text}</span>
        </p>
        <div className="flex items-center gap-4 border-t border-border/70 pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5" />
            {listing.area_value} {labelForEnum(AREA_UNITS, listing.area_unit)}
          </span>
          <span className="flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5" />
            {labelForEnum(PROPERTY_TYPES, listing.property_type)}
          </span>
        </div>
      </div>
    </Link>
  );
}
