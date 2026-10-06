alter table public.books add column if not exists new_pick boolean not null default false;
create index if not exists books_new_pick_idx on public.books(new_pick);
