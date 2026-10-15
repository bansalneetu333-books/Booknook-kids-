# Universal EPUB Reader

Reusable component: `components/universal-epub-reader.tsx`

This component is intentionally separate from the current production reader route. It can be tested against the existing EPUB collection before the website switches to it.

## What it supports

- Fixed-layout illustrated EPUBs and reflowable EPUBs.
- Portrait, landscape, and different page proportions without forcing one ratio.
- Automatic resize on screen changes and device rotation.
- Single-page reading on narrow screens and automatic spreads on wider screens.
- Previous/next controls, table of contents, fullscreen, text-size controls for reflowable books, loading and error states.
- Optional reading-position callback for saving progress.

## Example integration

```tsx
import UniversalEpubReader from "@/components/universal-epub-reader";

<UniversalEpubReader
  src={sameOriginProtectedEpubUrl}
  title={book.title}
  initialCfi={savedLocation}
  onLocationChange={({ cfi, percentage }) => {
    // Save the location using the authenticated reading-progress API.
  }}
  backHref="/library"
/>
```

## Security and compatibility

For paid books, `src` must point to a same-origin server route that authenticates the customer and verifies ownership before streaming the EPUB. Do not expose private storage URLs or Supabase service-role keys in client code.

This reader is for EPUB files. It does not convert PDF, MOBI, AZW, or other formats to EPUB, and it cannot bypass DRM/encryption. Invalid EPUB packaging or missing resources can still cause a book to fail. Test representative reflowable and fixed-layout books on iOS Safari, Android Chrome, and desktop browsers before replacing the production reader.
