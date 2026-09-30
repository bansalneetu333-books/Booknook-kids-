# Security Checklist

- [ ] Supabase service role is server-only.
- [ ] Razorpay secret is server-only.
- [ ] Private EPUB bucket is not public.
- [ ] Signed URLs have short expiry.
- [ ] Library access requires a verified paid order.
- [ ] Admin APIs require admin role.
- [ ] Payment signatures are verified server-side.
- [ ] Webhook signatures are verified server-side.
- [ ] Payment events are idempotent.
- [ ] Refunds require admin authorization.
- [ ] Upload size and magic-byte checks are enabled.
- [ ] Customer input is schema validated.
- [ ] Security headers are enabled.
- [ ] API rate limiting is configured at the hosting/WAF layer.
- [ ] No raw IP logging is used by product analytics.
- [ ] No private EPUB is cached by a service worker.
- [ ] Production legal pages are reviewed.
- [ ] Backups and restoration have been tested.
