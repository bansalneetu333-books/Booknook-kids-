import { describe, expect, it } from "vitest";
import { validateCoverBytes, validateEpubBytes } from "@/lib/file-validation";

describe("file validation", () => {
  it("accepts PNG signatures", () => {
    expect(() =>
      validateCoverBytes(
        new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])
      )
    ).not.toThrow();
  });

  it("rejects executable-looking cover data", () => {
    expect(() =>
      validateCoverBytes(new TextEncoder().encode("not-an-image"))
    ).toThrow();
  });

  it("accepts a ZIP/EPUB signature", () => {
    expect(() =>
      validateEpubBytes(new Uint8Array([0x50,0x4b,0x03,0x04]))
    ).not.toThrow();
  });

  it("rejects non-ZIP uploads", () => {
    expect(() =>
      validateEpubBytes(new TextEncoder().encode("not-an-epub"))
    ).toThrow();
  });
});
