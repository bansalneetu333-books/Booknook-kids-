-- Payment/refund reconciliation fields.
alter table public.orders
  add column if not exists refunded_amount integer not null default 0;

alter table public.refunds
  add column if not exists raw_response jsonb;

create index if not exists orders_razorpay_order_idx
on public.orders(razorpay_order_id);

create index if not exists orders_razorpay_payment_idx
on public.orders(razorpay_payment_id);

-- Keep EPUB metadata away from ordinary authenticated users.
drop policy if exists "authenticated users can read active versions of published books"
on public.book_versions;

-- The server uses the service-role client only after ownership/admin checks.
-- Customers should receive only signed reader/download URLs.
