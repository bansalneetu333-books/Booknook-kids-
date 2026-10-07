const MAX_COVER_SIZE = 8 * 1024 * 1024; // 8 MB
const MAX_BOOK_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_BOOK_TYPES = [
  "application/pdf",
  "application/epub+zip",
];

const ALLOWED_BOOK_EXTENSIONS = [".pdf", ".epub"];

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function validateCoverFile(file: File) {
  if (!file) {
    throw new Error("Please select a cover image.");
  }

  if (file.size > MAX_COVER_SIZE) {
    throw new Error("Cover image must be 8 MB or smaller.");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Cover must be a JPG, PNG, or WebP image.");
  }

  return true;
}

export function validateBookFile(file: File) {
  if (!file) {
    throw new Error("Please select an EPUB or PDF file.");
  }

  if (file.size > MAX_BOOK_SIZE) {
    throw new Error("Book file must be 50 MB or smaller.");
  }

  const fileName = file.name.toLowerCase();
  const validExtension = ALLOWED_BOOK_EXTENSIONS.some((extension) =>
    fileName.endsWith(extension)
  );

  if (!validExtension) {
    throw new Error("Book file must be an EPUB or PDF.");
  }

  if (
    file.type &&
    !ALLOWED_BOOK_TYPES.includes(file.type) &&
    file.type !== "application/octet-stream"
  ) {
    throw new Error("Only EPUB and PDF files are supported.");
  }

  return true;
}

export function validateBookFileSize(size: number) {
  if (size <= 0) {
    throw new Error("Book file is empty.");
  }

  if (size > MAX_BOOK_SIZE) {
    throw new Error("Book file must be 50 MB or smaller.");
  }

  return true;
}

export function validateCoverFileSize(size: number) {
  if (size <= 0) {
    throw new Error("Cover image is empty.");
  }

  if (size > MAX_COVER_SIZE) {
    throw new Error("Cover image must be 8 MB or smaller.");
  }

  return true;
}

export function validateCoverBytes(bytes: Uint8Array) {
  if (bytes.length < 4) {
    throw new Error("Cover image data is too small.");
  }

  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;

  const isJpeg =
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;

  const isWebp =
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;

  if (!isPng && !isJpeg && !isWebp) {
    throw new Error("Invalid cover image data.");
  }

  return true;
}

export function validateEpubBytes(bytes: Uint8Array) {
  if (
    bytes.length < 4 ||
    bytes[0] !== 0x50 ||
    bytes[1] !== 0x4b ||
    bytes[2] !== 0x03 ||
    bytes[3] !== 0x04
  ) {
    throw new Error("Invalid EPUB data.");
  }

  return true;
}

export function getBookFileType(fileName: string) {
  const name = fileName.toLowerCase();

  if (name.endsWith(".epub")) {
    return "epub";
  }

  if (name.endsWith(".pdf")) {
    return "pdf";
  }

  return null;
}
