create extension if not exists "pgcrypto";

create type public.user_role as enum ('customer', 'admin');
create type public.payment_status as enum (
  'pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  created_at timestamptz not null default now()
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  author text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  genre text not null default '',
  age_category text not null default '',
  cover_path text,
  epub_path text,
  published boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.book_versions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  version_number text not null,
  epub_path text not null,
  file_size bigint,
  uploaded_at timestamptz not null default now(),
  active boolean not null default false,
  unique(book_id, version_number)
);

create unique index one_active_book_version
on public.book_versions(book_id)
where active = true;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  total_amount integer not null check (total_amount >= 0),
  currency text not null default 'INR',
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  razorpay_signature text,
  payment_status public.payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  book_id uuid not null references public.books(id) on delete restrict,
  price integer not null check (price >= 0),
  created_at timestamptz not null default now()
);

create table public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  location text,
  progress_percentage numeric(5,2) not null default 0
    check (progress_percentage >= 0 and progress_percentage <= 100),
  last_read_at timestamptz not null default now(),
  unique(user_id, book_id)
);

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, book_id)
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'razorpay',
  provider_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  razorpay_refund_id text unique,
  amount integer not null check (amount > 0),
  status text not null,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);

create index books_published_idx on public.books(published);
create index books_featured_idx on public.books(featured);
create index books_genre_idx on public.books(genre);
create index orders_user_id_idx on public.orders(user_id);
create index orders_status_idx on public.orders(payment_status);
create index order_items_book_id_idx on public.order_items(book_id);
create index reading_progress_user_id_idx on public.reading_progress(user_id);
create index book_versions_book_id_idx on public.book_versions(book_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      email = excluded.email;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger books_updated_at
before update on public.books
for each row execute procedure public.set_updated_at();

create trigger orders_updated_at
before update on public.orders
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.books enable row level security;
alter table public.book_versions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reading_progress enable row level security;
alter table public.wishlists enable row level security;
alter table public.payment_events enable row level security;
alter table public.refunds enable row level security;

create policy "public can read published books"
on public.books for select
using (published = true or auth.uid() = id);

create policy "public can read categories"
on public.categories for select
using (true);

create policy "users can read own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "users can read own orders"
on public.orders for select
using (auth.uid() = user_id);

create policy "users can read own order items"
on public.order_items for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

create policy "users can read own progress"
on public.reading_progress for select
using (auth.uid() = user_id);

create policy "users can insert own progress"
on public.reading_progress for insert
with check (auth.uid() = user_id);

create policy "users can update own progress"
on public.reading_progress for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can manage own wishlist"
on public.wishlists for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "authenticated users can read active book versions"
on public.book_versions for select
using (
  exists (
    select 1 from public.books b
    where b.id = book_versions.book_id
      and b.published = true
  )
);
