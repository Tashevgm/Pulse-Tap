create extension if not exists pgcrypto;

do $$ begin
  create type public.card_database as enum ('google', 'instagram', 'facebook', 'b2b');
exception
  when duplicate_object then null;
end $$;

alter type public.card_database add value if not exists 'b2b';

do $$ begin
  create type public.card_type as enum ('google-review', 'google-review-stand', 'instagram', 'facebook', 'b2b-customer');
exception
  when duplicate_object then null;
end $$;

alter type public.card_type add value if not exists 'b2b-customer';

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text unique not null,
  full_name text not null,
  company_name text not null,
  provider text not null default 'email',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cards (
  id text primary key,
  activation_code text unique not null,
  claim_token text unique not null,
  redirect_url text not null default '',
  activated boolean not null default false,
  card_type public.card_type not null,
  card_database public.card_database not null,
  label text not null,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  taps integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz
);

create table if not exists public.b2b_customer_cards (
  id text primary key,
  activation_code text unique not null,
  claim_token text unique not null,
  tap_link text generated always as ('https://www.pulse-tap.com/t/' || claim_token) stored,
  redirect_url text not null default '',
  activated boolean not null default false,
  card_type public.card_type not null,
  card_database public.card_database not null,
  label text not null,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  taps integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz
);

alter table public.b2b_customer_cards
  add column if not exists tap_link text generated always as ('https://www.pulse-tap.com/t/' || claim_token) stored;

create table if not exists public.tap_events (
  id bigint generated always as identity primary key,
  card_id text not null references public.cards(id) on delete cascade,
  redirect_url text not null,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now()
);

create table if not exists public.b2b_tap_events (
  id bigint generated always as identity primary key,
  card_id text not null references public.b2b_customer_cards(id) on delete cascade,
  redirect_url text not null,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now()
);

create table if not exists public.checkout_orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  product_id text not null,
  product_name text not null,
  customer_email text not null,
  profile_id uuid references public.profiles(id) on delete set null,
  amount integer not null,
  currency text not null default 'gbp',
  status text not null default 'pending',
  abandoned_email_sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cards_owner_profile_id_idx on public.cards(owner_profile_id);
create index if not exists cards_card_database_idx on public.cards(card_database);
create index if not exists cards_activated_idx on public.cards(activated);
create index if not exists b2b_customer_cards_owner_profile_id_idx on public.b2b_customer_cards(owner_profile_id);
create index if not exists b2b_customer_cards_activated_idx on public.b2b_customer_cards(activated);
create index if not exists tap_events_card_id_created_at_idx on public.tap_events(card_id, created_at desc);
create index if not exists b2b_tap_events_card_id_created_at_idx on public.b2b_tap_events(card_id, created_at desc);
create index if not exists checkout_orders_customer_email_idx on public.checkout_orders(customer_email);
create index if not exists checkout_orders_status_created_at_idx on public.checkout_orders(status, created_at);

alter table public.profiles enable row level security;
alter table public.cards enable row level security;
alter table public.b2b_customer_cards enable row level security;
alter table public.tap_events enable row level security;
alter table public.b2b_tap_events enable row level security;
alter table public.checkout_orders enable row level security;

drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own"
  on public.profiles for select
  using (auth.uid() = auth_user_id);

drop policy if exists "cards_read_own" on public.cards;
create policy "cards_read_own"
  on public.cards for select
  using (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

drop policy if exists "cards_update_own" on public.cards;
create policy "cards_update_own"
  on public.cards for update
  using (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

drop policy if exists "b2b_customer_cards_read_own" on public.b2b_customer_cards;
create policy "b2b_customer_cards_read_own"
  on public.b2b_customer_cards for select
  using (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

drop policy if exists "b2b_customer_cards_update_own" on public.b2b_customer_cards;
create policy "b2b_customer_cards_update_own"
  on public.b2b_customer_cards for update
  using (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (owner_profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_card_activation_state()
returns trigger
language plpgsql
as $$
begin
  new.activated = length(trim(coalesce(new.redirect_url, ''))) > 0;

  if new.activated and new.activated_at is null then
    new.activated_at = now();
  end if;

  if not new.activated then
    new.activated_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists cards_sync_activation_state on public.cards;
create trigger cards_sync_activation_state
  before insert or update of redirect_url on public.cards
  for each row execute function public.sync_card_activation_state();

drop trigger if exists cards_touch_updated_at on public.cards;
create trigger cards_touch_updated_at
  before update on public.cards
  for each row execute function public.touch_updated_at();

drop trigger if exists b2b_customer_cards_sync_activation_state on public.b2b_customer_cards;
create trigger b2b_customer_cards_sync_activation_state
  before insert or update of redirect_url on public.b2b_customer_cards
  for each row execute function public.sync_card_activation_state();

drop trigger if exists b2b_customer_cards_touch_updated_at on public.b2b_customer_cards;
create trigger b2b_customer_cards_touch_updated_at
  before update on public.b2b_customer_cards
  for each row execute function public.touch_updated_at();

drop trigger if exists checkout_orders_touch_updated_at on public.checkout_orders;
create trigger checkout_orders_touch_updated_at
  before update on public.checkout_orders
  for each row execute function public.touch_updated_at();

insert into public.b2b_customer_cards (
  id,
  activation_code,
  claim_token,
  redirect_url,
  activated,
  card_type,
  card_database,
  label,
  owner_profile_id,
  taps,
  created_at,
  updated_at,
  activated_at
)
select
  id,
  activation_code,
  claim_token,
  redirect_url,
  activated,
  card_type,
  card_database,
  label,
  owner_profile_id,
  taps,
  created_at,
  updated_at,
  activated_at
from public.cards
where card_database::text = 'b2b'
on conflict (id) do nothing;

delete from public.cards
where card_database::text = 'b2b';
