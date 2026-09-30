# Production Runbook

## 1. Environment

Set all variables from `.env.example`.

Never prefix these with `NEXT_PUBLIC_`:

- SUPABASE_SERVICE_ROLE_KEY
- RAZORPAY_KEY_SECRET
- RAZORPAY_WEBHOOK_SECRET

## 2. Supabase

Run migrations in order:

1. 0001_initial.sql
2. 0002_payment_security.sql
3. 0003_admin.sql
4. 0004_content_analytics.sql
5. 0005_hardening.sql

Run the storage setup SQL.

Create:

- `ebooks-private` — private
- `book-covers` — public

Create the first admin only after confirming the account email.

## 3. Razorpay

Use Test Mode first.

Verify:

- order creation
- checkout
- signature verification
- webhook signature verification
- duplicate webhook delivery
- paid order creation
- library access
- partial refund
- full refund
- failed refund

Do not manually mark an order paid in production.

## 4. EPUB uploads

The application checks basic file signatures and size limits.

For high-volume production, add a dedicated media scanning/quarantine service and validate the EPUB ZIP structure, `mimetype`, `META-INF/container.xml`, and referenced package file before activation.

Never make the private EPUB bucket public.

## 5. Authorization

Verify manually:

- anonymous user cannot open library/reader/download
- customer cannot access admin routes
- customer cannot call admin APIs
- customer cannot access another customer's order
- customer cannot access an unpurchased book
- refunded access follows the configured business policy

## 6. Deployment

Recommended order:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

Deploy only after all commands pass.

Then check:

```text
GET /api/health
```

Expected status:

```json
{ "status": "ok" }
```

## 7. Backups

Enable database backups and test restoration.

Keep a separate backup/recovery procedure for:

- Supabase database
- book EPUB source files
- cover assets
- environment secret inventory
- business/legal documents

## 8. Monitoring

Monitor:

- `/api/health`
- payment failures
- webhook failures
- refund failures
- storage upload failures
- 4xx/5xx rates
- reader errors
- signed URL failures

Never log payment secrets, access tokens, signed URLs, or raw customer credentials.

## 9. Legal

Replace all draft legal pages with reviewed production policies before accepting customers.
