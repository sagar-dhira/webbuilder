import { describe, it, expect, vi, beforeEach } from "vitest";

const fetchMock = vi.fn().mockResolvedValue({ ok: true });

vi.stubGlobal("fetch", fetchMock);

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logInfo sends to backend with correct shape", async () => {
    const { logInfo } = await import("./logger");
    logInfo("test_action", "Test message", { key: "value" });
    expect(fetchMock).toHaveBeenCalled();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/logs");
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body);
    expect(body.level).toBe("info");
    expect(body.action).toBe("test_action");
    expect(body.message).toBe("Test message");
    expect(body.meta).toEqual({ key: "value" });
    expect(body.source).toBe("frontend");
  });

  it("logError sends error level", async () => {
    const { logError } = await import("./logger");
    logError("error_action", "Failed");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.level).toBe("error");
  });
});
