insert into public.cards (id, activation_code, claim_token, card_type, card_database, label)
values
  ('PTG001', 'GOOGLE-001', 'google-claim-001-ptg', 'google-review', 'google', 'Google review card 001'),
  ('PTG002', 'GOOGLE-002', 'google-claim-002-ptg', 'google-review', 'google', 'Google review card 002'),
  ('PTG003', 'GOOGLE-003', 'google-claim-003-ptg', 'google-review', 'google', 'Google review card 003'),
  ('PTG004', 'GOOGLE-004', 'google-claim-004-ptg', 'google-review', 'google', 'Google review card 004'),
  ('PTG005', 'GOOGLE-005', 'google-claim-005-ptg', 'google-review', 'google', 'Google review card 005'),
  ('PTG006', 'GOOGLE-006', 'google-claim-006-ptg', 'google-review', 'google', 'Google review card 006'),
  ('PTG007', 'GOOGLE-007', 'google-claim-007-ptg', 'google-review', 'google', 'Google review card 007'),
  ('PTG008', 'GOOGLE-008', 'google-claim-008-ptg', 'google-review', 'google', 'Google review card 008'),
  ('PTG009', 'GOOGLE-009', 'google-claim-009-ptg', 'google-review', 'google', 'Google review card 009'),
  ('PTG010', 'GOOGLE-010', 'google-claim-010-ptg', 'google-review', 'google', 'Google review card 010'),
  ('PTI001', 'INSTAGRAM-001', 'instagram-claim-001-pti', 'instagram', 'instagram', 'Instagram card 001'),
  ('PTI002', 'INSTAGRAM-002', 'instagram-claim-002-pti', 'instagram', 'instagram', 'Instagram card 002'),
  ('PTI003', 'INSTAGRAM-003', 'instagram-claim-003-pti', 'instagram', 'instagram', 'Instagram card 003'),
  ('PTI004', 'INSTAGRAM-004', 'instagram-claim-004-pti', 'instagram', 'instagram', 'Instagram card 004'),
  ('PTI005', 'INSTAGRAM-005', 'instagram-claim-005-pti', 'instagram', 'instagram', 'Instagram card 005'),
  ('PTI006', 'INSTAGRAM-006', 'instagram-claim-006-pti', 'instagram', 'instagram', 'Instagram card 006'),
  ('PTI007', 'INSTAGRAM-007', 'instagram-claim-007-pti', 'instagram', 'instagram', 'Instagram card 007'),
  ('PTI008', 'INSTAGRAM-008', 'instagram-claim-008-pti', 'instagram', 'instagram', 'Instagram card 008'),
  ('PTI009', 'INSTAGRAM-009', 'instagram-claim-009-pti', 'instagram', 'instagram', 'Instagram card 009'),
  ('PTI010', 'INSTAGRAM-010', 'instagram-claim-010-pti', 'instagram', 'instagram', 'Instagram card 010'),
  ('PTF001', 'FACEBOOK-001', 'facebook-claim-001-ptf', 'facebook', 'facebook', 'Facebook card 001'),
  ('PTF002', 'FACEBOOK-002', 'facebook-claim-002-ptf', 'facebook', 'facebook', 'Facebook card 002'),
  ('PTF003', 'FACEBOOK-003', 'facebook-claim-003-ptf', 'facebook', 'facebook', 'Facebook card 003'),
  ('PTF004', 'FACEBOOK-004', 'facebook-claim-004-ptf', 'facebook', 'facebook', 'Facebook card 004'),
  ('PTF005', 'FACEBOOK-005', 'facebook-claim-005-ptf', 'facebook', 'facebook', 'Facebook card 005'),
  ('PTF006', 'FACEBOOK-006', 'facebook-claim-006-ptf', 'facebook', 'facebook', 'Facebook card 006'),
  ('PTF007', 'FACEBOOK-007', 'facebook-claim-007-ptf', 'facebook', 'facebook', 'Facebook card 007'),
  ('PTF008', 'FACEBOOK-008', 'facebook-claim-008-ptf', 'facebook', 'facebook', 'Facebook card 008'),
  ('PTF009', 'FACEBOOK-009', 'facebook-claim-009-ptf', 'facebook', 'facebook', 'Facebook card 009'),
  ('PTF010', 'FACEBOOK-010', 'facebook-claim-010-ptf', 'facebook', 'facebook', 'Facebook card 010')
on conflict (id) do nothing;

insert into public.b2b_customer_cards (id, activation_code, claim_token, card_type, card_database, label)
select
  'PTB' || lpad(card_number::text, 3, '0'),
  'B2B-' || lpad(card_number::text, 3, '0'),
  'b2b-claim-' || lpad(card_number::text, 3, '0') || '-ptb',
  'b2b-customer'::public.card_type,
  'b2b'::public.card_database,
  'B2B customer card ' || lpad(card_number::text, 3, '0')
from generate_series(1, 500) as card_number
on conflict (id) do nothing;
