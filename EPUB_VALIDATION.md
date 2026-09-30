# EPUB Validation

Phase 7 rejects obvious non-EPUB files and oversized uploads.

For production-quality EPUB acceptance, use a quarantine pipeline:

1. Upload into a non-public quarantine location.
2. Validate ZIP structure.
3. Require an uncompressed `mimetype` entry whose content is exactly:
   `application/epub+zip`
4. Require `META-INF/container.xml`.
5. Resolve the package document.
6. Validate the OPF/package structure.
7. Check that referenced resources exist.
8. Reject path traversal entries such as `../`.
9. Optionally run EPUBCheck in an isolated worker/container.
10. Only after validation, copy the file to `ebooks-private`.
11. Mark the book version active.

Never execute or render uploaded EPUB contents outside the reader sandbox.
