import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "./auth.js";

describe("auth validation", () => {
  describe("registerSchema", () => {
    it("accepts valid email and password", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = registerSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects short password", () => {
      const result = registerSchema.safeParse({
        email: "a@b.com",
        password: "12345",
      });
      expect(result.success).toBe(false);
    });

    it("accepts optional name", () => {
      const result = registerSchema.safeParse({
        email: "a@b.com",
        password: "password123",
        name: "Test User",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("loginSchema", () => {
    it("accepts valid email and password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "anything",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = loginSchema.safeParse({
        email: "bad",
        password: "anything",
      });
      expect(result.success).toBe(false);
    });
  });
});
