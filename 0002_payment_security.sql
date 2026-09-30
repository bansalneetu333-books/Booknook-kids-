-- Payment status is controlled by trusted server code.
-- Customers only receive SELECT access to their own orders.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create policy "admins can manage books"
on public.books for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins can manage categories"
on public.categories for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins can manage versions"
on public.book_versions for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins can read orders"
on public.orders for select
using (public.is_admin() or auth.uid() = user_id);

create policy "admins can read order items"
on public.order_items for select
using (
  public.is_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and o.user_id = auth.uid()
  )
);

create policy "admins can read profiles"
on public.profiles for select
using (public.is_admin() or auth.uid() = id);

-- Payment events and refunds are server/admin data.
-- No customer INSERT/UPDATE/DELETE policies are created.
