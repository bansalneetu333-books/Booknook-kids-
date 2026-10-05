-- Booknook Kids: free reading + multi-category books
alter table public.books
  add column if not exists is_free boolean not null default false;

create table if not exists public.book_categories (
  book_id uuid not null references public.books(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (book_id, category_id)
);

create index if not exists book_categories_category_idx
  on public.book_categories(category_id);

alter table public.book_categories enable row level security;

drop policy if exists "public can read book categories" on public.book_categories;
create policy "public can read book categories"
on public.book_categories for select
using (true);

insert into public.categories (name, slug, description, icon)
values
('Adventure', 'adventure', 'Exciting journeys and discoveries.', '🗺️'),
('Science', 'science', 'Science mysteries and fascinating ideas.', '🔬'),
('Money', 'money', 'Saving, spending and smart money ideas.', '💰'),
('Friendship', 'friendship', 'Stories about communication and friendship.', '🤝'),
('History', 'history', 'Stories from history and inspiring people.', '🏛️'),
('Superheroes', 'superheroes', 'Heroes, powers and brave adventures.', '🦸'),
('Fantasy', 'fantasy', 'Magical worlds and imaginative adventures.', '✨'),
('Comics', 'comics', 'Illustrated stories and comic adventures.', '📚'),
('Learning', 'learning', 'Fun stories that encourage learning.', '🎓'),
('Life Skills', 'life-skills', 'Stories that build useful life skills.', '🌟')
on conflict (slug) do nothing;

-- Backfill the new relation from the existing single genre field.
insert into public.book_categories(book_id, category_id)
select b.id, c.id
from public.books b
join public.categories c
  on lower(trim(b.genre)) = lower(trim(c.name))
on conflict do nothing;

insert into public.book_categories(book_id, category_id)
select b.id, c.id
from public.books b
join public.categories c
  on c.slug = 'science'
where lower(coalesce(b.genre,'')) like '%science%'
on conflict do nothing;

insert into public.book_categories(book_id, category_id)
select b.id, c.id
from public.books b
join public.categories c
  on c.slug = 'adventure'
where lower(coalesce(b.genre,'')) like '%adventure%'
on conflict do nothing;

insert into public.book_categories(book_id, category_id)
select b.id, c.id
from public.books b
join public.categories c
  on c.slug = 'money'
where lower(coalesce(b.genre,'')) like '%money%'
on conflict do nothing;

insert into public.book_categories(book_id, category_id)
select b.id, c.id
from public.books b
join public.categories c
  on c.slug = 'friendship'
where lower(coalesce(b.genre,'')) like '%friendship%'
on conflict do nothing;

insert into public.book_categories(book_id, category_id)
select b.id, c.id
from public.books b
join public.categories c
  on c.slug = 'history'
where lower(coalesce(b.genre,'')) like '%history%'
on conflict do nothing;

insert into public.book_categories(book_id, category_id)
select b.id, c.id
from public.books b
join public.categories c
  on c.slug = 'superheroes'
where lower(coalesce(b.genre,'')) like '%superhero%'
on conflict do nothing;

insert into public.book_categories(book_id, category_id)
select b.id, c.id
from public.books b
join public.categories c
  on c.slug = 'fantasy'
where lower(coalesce(b.genre,'')) like '%fantasy%'
on conflict do nothing;

insert into public.book_categories(book_id, category_id)
select b.id, c.id
from public.books b
join public.categories c
  on c.slug = 'comics'
where lower(coalesce(b.genre,'')) like '%comic%'
on conflict do nothing;

insert into public.book_categories(book_id, category_id)
select b.id, c.id
from public.books b
join public.categories c
  on c.slug = 'learning'
where lower(coalesce(b.genre,'')) like '%learning%'
on conflict do nothing;

insert into public.book_categories(book_id, category_id)
select b.id, c.id
from public.books b
join public.categories c
  on c.slug = 'life-skills'
where lower(coalesce(b.genre,'')) like '%life skill%'
on conflict do nothing;

create index if not exists books_free_published_idx
  on public.books(is_free, published);
