-- Promote the configured Booknook Kids administrator after their auth account exists.
-- This is idempotent and leaves all other profiles unchanged.
update public.profiles as profile
set role = 'admin'
from auth.users as auth_user
where profile.id = auth_user.id
  and lower(trim(auth_user.email)) = 'bansalneetu333@gmail.com'
  and profile.role <> 'admin';
