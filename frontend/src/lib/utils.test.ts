import { describe, it, expect } from "vitest";
import { cn, formatTimeAgo } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("handles conditional classes", () => {
    const showHidden = false;
    expect(cn("base", showHidden && "hidden", "visible")).toBe("base visible");
  });
});

describe("formatTimeAgo", () => {
  it("returns seconds ago for recent time", () => {
    const ts = Date.now() - 5 * 1000;
    expect(formatTimeAgo(ts)).toBe("5 seconds ago");
  });

  it("returns 1 second ago for singular", () => {
    const ts = Date.now() - 1000;
    expect(formatTimeAgo(ts)).toBe("1 second ago");
  });

  it("returns minutes ago", () => {
    const ts = Date.now() - 2 * 60 * 1000;
    expect(formatTimeAgo(ts)).toBe("2 minutes ago");
  });

  it("returns hours ago", () => {
    const ts = Date.now() - 3 * 60 * 60 * 1000;
    expect(formatTimeAgo(ts)).toBe("3 hours ago");
  });
});
