# BookNook Kids Supabase Setup

The application uses the existing BookNook Kids Supabase project. Do not create a new project or delete existing tables/buckets.

## Existing resources to preserve

- Authentication and recovery OTP settings
- `profiles`, `books`, `categories`, `book_categories`, `book_versions`
- `orders`, `order_items`, `reading_progress`, `wishlists`, refunds and analytics tables
- Public `book-covers` storage bucket
- Private `ebooks-private` storage bucket

## Apply the EPUB-only database migration

A new migration file, `0009_epub_only_paid_reading.sql`, has been added to the GitHub repository. It safely marks all existing books as non-free and adds a database constraint to prevent the retired free-reading flag from being re-enabled. It preserves existing books, orders, covers, and reading progress.

1. Open the Supabase Dashboard for the existing BookNook Kids project.
2. Open **SQL Editor** and create a new query.
3. Copy the complete contents of `0009_epub_only_paid_reading.sql` from the repository and paste it into the SQL Editor.
4. Review that the query targets the existing project, then click **Run**.
5. Confirm the query succeeds before testing book uploads and reading access.

**Important:** Adding the migration file to GitHub does not run it in Supabase automatically. This SQL must be applied in the Supabase Dashboard unless the project has a configured migration deployment pipeline.

## Security requirements

- Keep `ebooks-private` private. Never change it to a public bucket.
- Keep `book-covers` public so cover images can render on the catalogue.
- Reader access must be checked server-side against the signed-in customer's completed purchase before EPUB content is served.
- Never expose the Supabase service-role key in browser/client code or commit secrets to GitHub.
- Keep the existing authentication and recovery OTP configuration unchanged for this UI cleanup.
