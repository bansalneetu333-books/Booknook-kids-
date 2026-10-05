-- Booknook Kids: free reading + multi-category books
-- Run this migration in Supabase SQL Editor before deploying the UI changes.

alter table public.books
  add column if not exists is_free boolean not null default false;

create table if not exists public.book_categories (
  book_id uuid not null references public.books(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (book_id, category_id)
);

create index if not exists book_categories_category_id_idx
  on public.book_categories(category_id);

create index if not exists books_is_free_idx
  on public.books(is_free);

alter table public.book_categories enable row level security;

grant select on public.book_categories to anon, authenticated;
grant select, insert, update, delete on public.book_categories to service_role;

drop policy if exists "public can read book categories" on public.book_categories;
create policy "public can read book categories"
on public.book_categories
for select
to anon, authenticated
using (true);

-- Ensure the Booknook Kids standard categories exist.
insert into public.categories (name, slug, icon)
values
  ('Adventure', 'adventure', '🗺️'),
  ('Science', 'science', '🔬'),
  ('Money', 'money', '💰'),
  ('Friendship', 'friendship', '🤝'),
  ('History', 'history', '🏛️'),
  ('Superheroes', 'superheroes', '🦸'),
  ('Fantasy', 'fantasy', '✨'),
  ('Comics', 'comics', '📚'),
  ('Learning', 'learning', '🎓'),
  ('Life Skills', 'life-skills', '🌟')
on conflict (slug) do nothing;

-- Backfill the common legacy genre values into the new multi-category table.
insert into public.book_categories (book_id, category_id)
select b.id, c.id
from public.books b
join public.categories c
  on lower(c.name) = lower(b.genre)
where b.genre is not null
  and trim(b.genre) <> ''
on conflict (book_id, category_id) do nothing;

insert into public.book_categories (book_id, category_id)
select b.id, c.id
from public.books b
join public.categories c
  on lower(c.name) = lower(trim(part))
cross join lateral regexp_split_to_table(coalesce(b.genre, ''), '\\s*/\\s*') as part
where trim(part) <> ''
on conflict (book_id, category_id) do nothing;

-- Known legacy combined category.
insert into public.book_categories (book_id, category_id)
select b.id, c.id
from public.books b
join public.categories c on c.slug = 'money'
where lower(trim(b.genre)) = 'money & life skills'
on conflict (book_id, category_id) do nothing;

insert into public.book_categories (book_id, category_id)
select b.id, c.id
from public.books b
join public.categories c on c.slug = 'life-skills'
where lower(trim(b.genre)) = 'money & life skills'
on conflict (book_id, category_id) do nothing;
