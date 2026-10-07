import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rate limiting", () => {
  it("blocks after the configured threshold", () => {
    const key = `test-${crypto.randomUUID()}`;
    expect(rateLimit(key, 2, 60_000).success).toBe(true);
    expect(rateLimit(key, 2, 60_000).success).toBe(true);
    expect(rateLimit(key, 2, 60_000).success).toBe(false);
  });
});
