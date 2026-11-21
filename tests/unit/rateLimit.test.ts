import { beforeEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  clearRateLimitStore,
  getClientIp,
} from "@/lib/security/rateLimit";

describe("In-memory sliding-window rate limiter", () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it("extracts client IP from x-forwarded-for or x-real-ip headers", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" });
    expect(getClientIp(headers)).toBe("203.0.113.5");

    const realHeaders = new Headers({ "x-real-ip": "198.51.100.7" });
    expect(getClientIp(realHeaders)).toBe("198.51.100.7");

    expect(getClientIp(new Headers())).toBe("127.0.0.1");
  });

  it("enforces maxRequests within windowMs and recovers after window expires", () => {
    const cfg = { windowMs: 60_000, maxRequests: 2 };
    const t0 = 1_000_000;

    const first = checkRateLimit("ip:test", cfg, t0);
    const second = checkRateLimit("ip:test", cfg, t0 + 100);
    const blocked = checkRateLimit("ip:test", cfg, t0 + 200);

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(59);

    const recovered = checkRateLimit("ip:test", cfg, t0 + 61_000);
    expect(recovered.allowed).toBe(true);
  });
});
