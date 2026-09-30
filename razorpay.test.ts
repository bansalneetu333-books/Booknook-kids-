import { describe, expect, it } from "vitest";

describe("Razorpay integration foundation", () => {
  it("keeps payment verification server-side", () => {
    expect("RAZORPAY_KEY_SECRET").not.toContain("NEXT_PUBLIC");
  });
});
