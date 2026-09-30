-- Run this in Supabase SQL editor or incorporate it into your deployment process.
-- Bucket creation can also be managed through Supabase Storage configuration.
-- EPUB bucket must remain PRIVATE.

insert into storage.buckets (id, name, public)
values ('ebooks-private', 'ebooks-private', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do update set public = true;

-- Storage policies should be kept restrictive. Server-side signed URL generation
-- is used for customer EPUB access.
create policy "admins can manage private ebooks"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'ebooks-private'
  and public.is_admin()
)
with check (
  bucket_id = 'ebooks-private'
  and public.is_admin()
);

create policy "admins can manage book covers"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'book-covers'
  and public.is_admin()
)
with check (
  bucket_id = 'book-covers'
  and public.is_admin()
);
