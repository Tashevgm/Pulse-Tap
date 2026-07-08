alter table public.cards
  add column if not exists amazon_review_request_email_sent_at timestamptz;
