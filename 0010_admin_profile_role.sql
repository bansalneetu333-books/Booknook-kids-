-- Promote the configured Booknook Kids administrator after their auth account exists.
-- The live schema stores admin status as profiles.is_admin (boolean), not a role column.
-- This is idempotent and leaves all other profiles unchanged.
update public.profiles as profile
set is_admin = true
from auth.users as auth_user
where profile.id = auth_user.id
  and lower(trim(auth_user.email)) = 'bansalneetu333@gmail.com'
  and profile.is_admin is distinct from true;
