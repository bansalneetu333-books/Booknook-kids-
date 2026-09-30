create table if not exists public.site_content (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references public.profiles(id) on delete set null,
  book_id uuid references public.books(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_type_idx
on public.analytics_events(event_type);

create index if not exists analytics_events_book_idx
on public.analytics_events(book_id);

create index if not exists analytics_events_created_idx
on public.analytics_events(created_at);

alter table public.site_content enable row level security;
alter table public.analytics_events enable row level security;

create policy "public can read site content"
on public.site_content for select
using (true);

create policy "admins can manage site content"
on public.site_content for all
using (public.is_admin())
with check (public.is_admin());

create policy "authenticated users can insert own analytics"
on public.analytics_events for insert
with check (auth.uid() = user_id or user_id is null);

create policy "admins can read analytics"
on public.analytics_events for select
using (public.is_admin());

insert into public.site_content(key,value)
values
('hero_title','Discover Amazing Stories! 📚✨'),
('hero_text','Read, explore and enjoy wonderful e-books for young readers.'),
('announcement','')
on conflict (key) do nothing;
