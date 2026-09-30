const MAX_EPUB_BYTES = 50 * 1024 * 1024;
const MAX_COVER_BYTES = 8 * 1024 * 1024;

function startsWithBytes(bytes: Uint8Array, expected: number[]) {
  return expected.every((value, index) => bytes[index] === value);
}

export function validateCoverBytes(bytes: Uint8Array) {
  if (bytes.byteLength > MAX_COVER_BYTES) {
    throw new Error("Cover image is larger than the 8 MB limit.");
  }

  const jpeg = startsWithBytes(bytes, [0xff, 0xd8, 0xff]);
  const png = startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const webp = startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

  if (!jpeg && !png && !webp) {
    throw new Error("Cover is not a supported JPEG, PNG or WebP image.");
  }
}

export function validateEpubBytes(bytes: Uint8Array) {
  if (bytes.byteLength > MAX_EPUB_BYTES) {
    throw new Error("EPUB is larger than the 50 MB limit.");
  }

  // EPUB is a ZIP container. ZIP files normally begin with PK\x03\x04,
  // PK\x05\x06 (empty archive), or PK\x07\x08 (spanned archive).
  const zipSignature =
    startsWithBytes(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWithBytes(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWithBytes(bytes, [0x50, 0x4b, 0x07, 0x08]);

  if (!zipSignature) {
    throw new Error("The uploaded file is not a valid ZIP/EPUB container.");
  }
}
