# End-to-end test plan

Use Playwright or another browser E2E runner in CI before production.

Required scenario:

1. Create customer account.
2. Login.
3. Browse published book.
4. Start checkout.
5. Use Razorpay Test Mode.
6. Verify server-side payment.
7. Confirm the order becomes `paid`.
8. Confirm the book appears in `/library`.
9. Open `/reader/[bookId]`.
10. Navigate pages.
11. Confirm reading progress is saved.
12. Return to reader and confirm the location is restored.
13. Download EPUB.
14. Confirm an unpurchased book cannot open.
15. Confirm a customer cannot access `/admin`.
16. Confirm an admin can manage books.

Do not use real payment credentials or production customer data in automated tests.
