-- Admin operations use the role stored in profiles and server-side authorization.
-- The service-role client is used for privileged storage operations.

create policy "admins can manage reading progress"
on public.reading_progress for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins can manage wishlists"
on public.wishlists for select
using (public.is_admin() or auth.uid() = user_id);

create policy "admins can read payment events"
on public.payment_events for select
using (public.is_admin());

create policy "admins can manage refunds"
on public.refunds for all
using (public.is_admin())
with check (public.is_admin());
