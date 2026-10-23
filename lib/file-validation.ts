// Ensure EPUB files are valid ZIP containers before trying to render them.
const ZIP_SIGNATURES = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
  [0x50, 0x4b, 0x07, 0x08],
];

export function validateEpubBytes(bytes: Uint8Array) {
  if (!bytes || bytes.length < 4) {
    throw new Error("Invalid EPUB data.");
  }

  const isZip = ZIP_SIGNATURES.some((signature) =>
    signature.every((value, index) => bytes[index] === value)
  );

  if (!isZip) {
    throw new Error("The uploaded file is not a valid ZIP/EPUB container.");
  }

  return true;
}
