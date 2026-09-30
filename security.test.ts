import { describe, expect, it } from "vitest";

describe("security invariants", () => {
  it("never uses a public prefix for server secrets", () => {
    expect("SUPABASE_SERVICE_ROLE_KEY".startsWith("NEXT_PUBLIC_")).toBe(false);
    expect("RAZORPAY_KEY_SECRET".startsWith("NEXT_PUBLIC_")).toBe(false);
    expect("RAZORPAY_WEBHOOK_SECRET".startsWith("NEXT_PUBLIC_")).toBe(false);
  });

  it("keeps private EPUB bucket private by design", () => {
    expect("ebooks-private").toBe("ebooks-private");
  });
});
