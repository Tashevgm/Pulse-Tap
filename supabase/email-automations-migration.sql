alter table public.profiles
  add column if not exists email_verification_reminder_sent_at timestamptz;

alter table public.checkout_orders
  add column if not exists owner_order_notification_sent_at timestamptz;

alter table public.checkout_orders
  add column if not exists order_confirmation_email_sent_at timestamptz;

alter table public.cards
  add column if not exists amazon_review_request_email_sent_at timestamptz;

alter table public.b2b_customer_cards
  add column if not exists amazon_review_request_email_sent_at timestamptz;

create index if not exists cards_review_request_candidates_idx on public.cards(activated_at, taps)
  where amazon_review_request_email_sent_at is null and owner_profile_id is not null;

create index if not exists b2b_customer_cards_review_request_candidates_idx
  on public.b2b_customer_cards(activated_at, taps)
  where amazon_review_request_email_sent_at is null and owner_profile_id is not null;
