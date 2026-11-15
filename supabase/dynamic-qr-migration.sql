create table if not exists public.dynamic_qr_codes (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  slug text unique not null,
  name text not null,
  destination_url text not null,
  scans bigint not null default 0,
  last_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dynamic_qr_codes_slug_format check (slug ~ '^[a-z0-9_-]{6,32}$'),
  constraint dynamic_qr_codes_name_length check (char_length(trim(name)) between 1 and 80),
  constraint dynamic_qr_codes_destination_length check (char_length(destination_url) between 8 and 2048),
  constraint dynamic_qr_codes_destination_protocol check (destination_url ~* '^https?://'),
  constraint dynamic_qr_codes_scans_nonnegative check (scans >= 0)
);

create index if not exists dynamic_qr_codes_owner_created_idx
  on public.dynamic_qr_codes(owner_profile_id, created_at desc);

alter table public.dynamic_qr_codes enable row level security;

drop policy if exists "dynamic_qr_codes_read_own" on public.dynamic_qr_codes;
create policy "dynamic_qr_codes_read_own"
  on public.dynamic_qr_codes for select
  to authenticated
  using (
    owner_profile_id in (
      select id from public.profiles
      where auth_user_id = (select auth.uid())
    )
  );

drop policy if exists "dynamic_qr_codes_insert_own" on public.dynamic_qr_codes;
create policy "dynamic_qr_codes_insert_own"
  on public.dynamic_qr_codes for insert
  to authenticated
  with check (
    owner_profile_id in (
      select id from public.profiles
      where auth_user_id = (select auth.uid())
    )
  );

drop policy if exists "dynamic_qr_codes_update_own" on public.dynamic_qr_codes;
create policy "dynamic_qr_codes_update_own"
  on public.dynamic_qr_codes for update
  to authenticated
  using (
    owner_profile_id in (
      select id from public.profiles
      where auth_user_id = (select auth.uid())
    )
  )
  with check (
    owner_profile_id in (
      select id from public.profiles
      where auth_user_id = (select auth.uid())
    )
  );

drop policy if exists "dynamic_qr_codes_delete_own" on public.dynamic_qr_codes;
create policy "dynamic_qr_codes_delete_own"
  on public.dynamic_qr_codes for delete
  to authenticated
  using (
    owner_profile_id in (
      select id from public.profiles
      where auth_user_id = (select auth.uid())
    )
  );

drop trigger if exists dynamic_qr_codes_touch_updated_at on public.dynamic_qr_codes;
create trigger dynamic_qr_codes_touch_updated_at
  before update on public.dynamic_qr_codes
  for each row execute function public.touch_updated_at();

create or replace function public.resolve_dynamic_qr(p_slug text)
returns table(destination_url text)
language sql
security definer
set search_path = ''
as $$
  update public.dynamic_qr_codes
  set
    scans = scans + 1,
    last_scanned_at = now()
  where slug = lower(trim(p_slug))
  returning dynamic_qr_codes.destination_url;
$$;

revoke all on function public.resolve_dynamic_qr(text) from public;
grant execute on function public.resolve_dynamic_qr(text) to anon, authenticated, service_role;
