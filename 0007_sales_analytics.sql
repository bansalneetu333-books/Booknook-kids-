-- BookNook Kids sales + analytics foundation.
-- Keeps the existing Supabase orders schema as the source of truth while
-- temporarily supporting the legacy application field names used by checkout/admin.
--
-- Sales remain in public.orders + public.order_items.
-- Website/reader activity remains in public.analytics_events.
-- Successful paid orders automatically create a purchase_completed analytics event.

alter table public.orders
  add column if not exists status text;

alter table public.orders
  add column if not exists amount integer;

update public.orders
set
  status = payment_status::text,
  amount = total_amount
where status is null
   or amount is null;

alter table public.orders
  alter column status set default 'pending';

alter table public.orders
  alter column amount set default 0;

create or replace function public.sync_order_legacy_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.total_amount is null and new.amount is not null then
      new.total_amount := new.amount;
    elsif new.amount is null and new.total_amount is not null then
      new.amount := new.total_amount;
    end if;

    if new.payment_status is null and new.status is not null then
      new.payment_status := new.status::public.payment_status;
    elsif new.status is null and new.payment_status is not null then
      new.status := new.payment_status::text;
    end if;
  else
    if new.amount is distinct from old.amount
       and new.total_amount is not distinct from old.total_amount then
      new.total_amount := new.amount;
    elsif new.total_amount is distinct from old.total_amount
       and new.amount is not distinct from old.amount then
      new.amount := new.total_amount;
    end if;

    if new.status is distinct from old.status
       and new.payment_status is not distinct from old.payment_status then
      new.payment_status := new.status::public.payment_status;
    elsif new.payment_status is distinct from old.payment_status
       and new.status is not distinct from old.status then
      new.status := new.payment_status::text;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_sync_legacy_fields on public.orders;

create trigger orders_sync_legacy_fields
before insert or update on public.orders
for each row
execute function public.sync_order_legacy_fields();

create index if not exists orders_status_created_idx
on public.orders(status, created_at);

create index if not exists orders_payment_status_created_idx
on public.orders(payment_status, created_at);

create index if not exists order_items_order_book_idx
on public.order_items(order_id, book_id);

create index if not exists analytics_events_type_created_idx
on public.analytics_events(event_type, created_at);

create unique index if not exists analytics_purchase_order_idx
on public.analytics_events ((metadata ->> 'order_id'))
where event_type = 'purchase_completed'
  and metadata ? 'order_id';

create or replace function public.record_paid_order_analytics()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_status = 'paid'
     and (tg_op = 'INSERT' or old.payment_status is distinct from 'paid') then
    insert into public.analytics_events (
      event_type,
      user_id,
      metadata
    )
    values (
      'purchase_completed',
      new.user_id,
      jsonb_build_object(
        'order_id', new.id,
        'amount', new.total_amount,
        'currency', new.currency,
        'razorpay_order_id', new.razorpay_order_id,
        'razorpay_payment_id', new.razorpay_payment_id
      )
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_paid_analytics on public.orders;

create trigger orders_paid_analytics
after insert or update of payment_status, status on public.orders
for each row
execute function public.record_paid_order_analytics();

-- Server/admin reporting helpers.
create or replace view public.admin_daily_sales as
select
  date_trunc('day', o.created_at)::date as sale_date,
  count(*) filter (where o.payment_status = 'paid') as paid_orders,
  coalesce(sum(o.total_amount) filter (where o.payment_status = 'paid'), 0) as gross_revenue,
  coalesce(sum(o.refunded_amount) filter (where o.payment_status in ('paid','refunded')), 0) as refunded_amount
from public.orders o
group by 1
order by 1 desc;

create or replace view public.admin_book_sales as
select
  oi.book_id,
  b.title,
  count(*) filter (where o.payment_status = 'paid') as units_sold,
  coalesce(sum(oi.price) filter (where o.payment_status = 'paid'), 0) as gross_revenue
from public.order_items oi
join public.orders o on o.id = oi.order_id
join public.books b on b.id = oi.book_id
group by oi.book_id, b.title
order by gross_revenue desc;

create or replace view public.admin_monthly_sales as
select
  to_char(date_trunc('month', o.created_at), 'YYYY-MM') as month,
  count(*) filter (where o.payment_status = 'paid') as paid_orders,
  coalesce(sum(o.total_amount) filter (where o.payment_status = 'paid'), 0) as gross_revenue,
  coalesce(sum(o.refunded_amount) filter (where o.payment_status in ('paid','refunded')), 0) as refunded_amount
from public.orders o
group by 1
order by 1 desc;

-- Views are admin reporting surfaces; do not expose them to anonymous/authenticated
-- customers through direct SELECT policies. The service-role admin API reads them.
revoke all on public.admin_daily_sales from anon, authenticated;
revoke all on public.admin_book_sales from anon, authenticated;
revoke all on public.admin_monthly_sales from anon, authenticated;
