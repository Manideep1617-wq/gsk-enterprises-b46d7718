
-- Fix security definer function exposure: revoke public/anon/authenticated EXECUTE
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

REVOKE ALL ON FUNCTION public.grant_owner_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Set search_path on remaining function
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- Storage policies for property-images bucket
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'property-images');

CREATE POLICY "Admins can upload property images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update property images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'property-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete property images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'property-images' AND public.has_role(auth.uid(), 'admin'));
