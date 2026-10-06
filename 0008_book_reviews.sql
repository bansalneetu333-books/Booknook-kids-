create table if not exists public.book_reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review text not null default '',
  approved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(book_id, user_id)
);
create index if not exists book_reviews_book_idx on public.book_reviews(book_id);
alter table public.book_reviews enable row level security;
create policy "public can read approved reviews" on public.book_reviews for select using (approved = true or auth.uid() = user_id);
create policy "users can create own reviews" on public.book_reviews for insert with check (auth.uid() = user_id);
create policy "users can update own reviews" on public.book_reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
