DROP POLICY IF EXISTS "Public can view listing images" ON storage.objects;
CREATE POLICY "Public can view listing images"
ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "Admins can upload listing images" ON storage.objects;
CREATE POLICY "Admins can upload listing images"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'listing-images' AND private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update listing images" ON storage.objects;
CREATE POLICY "Admins can update listing images"
ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'listing-images' AND private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete listing images" ON storage.objects;
CREATE POLICY "Admins can delete listing images"
ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'listing-images' AND private.has_role(auth.uid(), 'admin'::public.app_role));