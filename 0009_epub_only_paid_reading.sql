-- BookNook Kids: align Supabase with EPUB-only, purchase-gated reading.
-- Non-destructive: preserve books, covers, orders, reading progress, and category mappings.

-- Retire the old free-reading flag for all existing records.
update public.books
set is_free = false
where is_free is distinct from false;

alter table public.books
  alter column is_free set default false;

-- Block accidental reintroduction of free-reading records.
alter table public.books
  drop constraint if exists books_free_reading_retired_check;

alter table public.books
  add constraint books_free_reading_retired_check
  check (is_free = false);

-- New books remain unpublished until the admin explicitly publishes them.
alter table public.books
  alter column published set default false;

-- Keep age_category as a legacy column to avoid destructive data/schema changes.
-- The application no longer exposes age-group browsing.
-- Keep ebooks-private private; app-level purchase checks protect reader access.
