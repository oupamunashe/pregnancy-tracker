-- Run AFTER 0001_init.sql, and BEFORE creating/inviting the two users.
-- Replace the placeholders with the two real email addresses (lower-case), then Run.
-- Only these emails can create an account, sign in, or read/write any data.

insert into private.allowed_emails (email) values
  (lower('YOUR-EMAIL@example.com')),
  (lower('WIFE-EMAIL@example.com'))
on conflict do nothing;

-- To remove someone's access later:
--   delete from private.allowed_emails where email = lower('someone@example.com');
