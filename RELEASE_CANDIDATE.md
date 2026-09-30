# Release Candidate Checklist

Phase 8 is a release-candidate cleanup pass.

## Fixed

- Private `book_versions` are no longer readable through normal customer RLS.
- Server-side storage access uses the Supabase service role only after ownership/admin authorization.
- EPUB and cover uploads are checked using file signatures, not only browser MIME types.
- Webhook idempotency uses Razorpay event IDs or a deterministic body hash.
- Public cover images are displayed from the public cover bucket.
- Admin refund action is available from Orders.
- Orphaned storage media can be scanned and safely re-checked before deletion.
- Added `/api/health`.
- Added `release-check` script.

## Run before deployment

```bash
npm ci
npm run release-check
npm run typecheck
npm run lint
npm test
npm run build
```

The first full dependency installation was not completed in the generation environment, so these commands must be run in your project/CI environment.

## Critical manual test

Purchase flow:

```text
Customer login
  ↓
Book details
  ↓
Razorpay Test Mode
  ↓
Server signature verification
  ↓
Webhook
  ↓
Paid order
  ↓
Library
  ↓
Reader
  ↓
Progress
  ↓
Secure EPUB download
```

Refund flow:

```text
Admin Orders
  ↓
Full refund
  ↓
Razorpay
  ↓
Refund record
  ↓
Order status
  ↓
Confirm access policy
```

Do not launch until both flows have been tested with Razorpay Test Mode.
