# Razorpay Setup

## Test Mode first

Use Razorpay Test Mode until the complete purchase flow works.

Environment:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
```

The browser may receive the key ID.

The browser must never receive:

- key secret
- webhook secret

## Webhook

Production endpoint:

```text
https://your-domain.com/api/payments/webhook
```

Use the exact webhook secret configured in Razorpay.

The server verifies the webhook signature before processing.

## Idempotency

The webhook handler records provider event IDs.

Repeated delivery of the same event must not create duplicate payment state.

## Verification

The checkout flow verifies the Razorpay payment signature server-side before marking an order paid.

Never mark an order paid because the browser reports success.

## Refund

Admin refund endpoint:

```text
POST /api/admin/refunds
```

The route requires an authenticated admin and calls Razorpay server-side.

Test:

- successful refund
- invalid order
- already refunded order
- amount greater than order amount
- Razorpay API failure
- repeated admin request

## Live mode

Switch to live credentials only after:

- Test Mode checkout works
- webhook works
- library access works
- download works
- refund works
- admin authorization works
- backups are enabled
