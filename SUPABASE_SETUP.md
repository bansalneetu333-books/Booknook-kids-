# Existing Supabase Setup

No new Supabase setup is required for this release.

The application uses the existing Booknook Kids schema, authentication settings, private `ebooks-private` bucket, public `book-covers` bucket, profiles, books, book_versions, orders, order_items, reading_progress, wishlists, refunds and analytics tables.

The existing email/password authentication and recovery OTP settings are preserved. The login page includes an explicit resend-code button with a 60-second cooldown.
