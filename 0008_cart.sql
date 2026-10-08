-- BookNook Kids persistent shopping cart
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, book_id)
);

create index if not exists cart_items_user_id_idx on public.cart_items(user_id);
create index if not exists cart_items_book_id_idx on public.cart_items(book_id);

alter table public.cart_items enable row level security;

drop policy if exists "users can manage own cart" on public.cart_items;
create policy "users can manage own cart"
on public.cart_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop trigger if exists cart_items_updated_at on public.cart_items;
create trigger cart_items_updated_at
before update on public.cart_items
for each row execute procedure public.set_updated_at();
