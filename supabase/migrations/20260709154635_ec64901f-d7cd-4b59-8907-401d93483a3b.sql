
-- Enums
CREATE TYPE public.listing_kind AS ENUM ('sale', 'rent');
CREATE TYPE public.property_kind AS ENUM ('house', 'flat', 'plot', 'commercial', 'agricultural');
CREATE TYPE public.area_unit AS ENUM ('sqft', 'sqyd', 'acre', 'cent', 'gunta');
CREATE TYPE public.facing_dir AS ENUM ('north', 'south', 'east', 'west', 'north_east', 'north_west', 'south_east', 'south_west');
CREATE TYPE public.listing_status AS ENUM ('active', 'sold', 'rented', 'inactive');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected', 'contacted');
CREATE TYPE public.inquiry_status AS ENUM ('new', 'contacted', 'closed');
CREATE TYPE public.app_role AS ENUM ('admin');

-- Roles (separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Auto-grant admin to gshanker9700@gmail.com on verified email
CREATE OR REPLACE FUNCTION public.grant_owner_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND lower(NEW.email) = 'gshanker9700@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_grant_owner
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_owner_admin();
CREATE TRIGGER on_auth_user_confirmed_grant_owner
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.grant_owner_admin();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Listings
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  listing_type public.listing_kind NOT NULL,
  property_type public.property_kind NOT NULL,
  price NUMERIC(14,2) NOT NULL,
  area_value NUMERIC(12,2) NOT NULL,
  area_unit public.area_unit NOT NULL DEFAULT 'sqft',
  facing public.facing_dir,
  address_text TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  cover_image TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  amenities TEXT[] NOT NULL DEFAULT '{}',
  status public.listing_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active listings" ON public.listings
  FOR SELECT TO anon, authenticated USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert listings" ON public.listings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update listings" ON public.listings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete listings" ON public.listings
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER listings_set_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX listings_status_idx ON public.listings (status);
CREATE INDEX listings_type_idx ON public.listings (listing_type, property_type);
CREATE INDEX listings_created_idx ON public.listings (created_at DESC);

-- Seller requests
CREATE TABLE public.seller_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  listing_type public.listing_kind NOT NULL,
  property_type public.property_kind NOT NULL,
  location TEXT NOT NULL,
  area_value NUMERIC(12,2),
  area_unit public.area_unit DEFAULT 'sqft',
  expected_price NUMERIC(14,2),
  facing public.facing_dir,
  description TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.seller_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.seller_requests TO authenticated;
GRANT ALL ON public.seller_requests TO service_role;
ALTER TABLE public.seller_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a seller request" ON public.seller_requests
  FOR INSERT TO anon, authenticated WITH CHECK (
    length(seller_name) BETWEEN 1 AND 100
    AND length(phone) BETWEEN 6 AND 20
    AND length(location) BETWEEN 1 AND 200
  );
CREATE POLICY "Admins can view seller requests" ON public.seller_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update seller requests" ON public.seller_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete seller requests" ON public.seller_requests
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Inquiries
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT,
  status public.inquiry_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.inquiries TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit an inquiry" ON public.inquiries
  FOR INSERT TO anon, authenticated WITH CHECK (
    length(buyer_name) BETWEEN 1 AND 100
    AND length(phone) BETWEEN 6 AND 20
    AND (message IS NULL OR length(message) <= 1000)
  );
CREATE POLICY "Admins can view inquiries" ON public.inquiries
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update inquiries" ON public.inquiries
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete inquiries" ON public.inquiries
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX inquiries_listing_idx ON public.inquiries (listing_id, created_at DESC);
