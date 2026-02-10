import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./prisma.js", () => ({
  prisma: {
    activityLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

const appendFileSyncMock = vi.fn();
const existsSyncMock = vi.fn().mockReturnValue(true);
const mkdirSyncMock = vi.fn();

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      existsSync: existsSyncMock,
      mkdirSync: mkdirSyncMock,
      appendFileSync: appendFileSyncMock,
    },
  };
});

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    existsSyncMock.mockReturnValue(true);
  });

  it("writes to file when log() is called", async () => {
    const { log } = await import("./logger.js");
    log({
      level: "info",
      action: "test_action",
      message: "Test message",
      source: "backend",
    });
    expect(appendFileSyncMock).toHaveBeenCalled();
    const [filePath, content] = appendFileSyncMock.mock.calls[0];
    expect(filePath).toContain("logs");
    expect(content).toContain("test_action");
    expect(content).toContain("Test message");
  });

  it("logInfo creates info-level entry", async () => {
    const { logInfo } = await import("./logger.js");
    logInfo("test", "Hello", { key: "value" });
    expect(appendFileSyncMock).toHaveBeenCalled();
    const content = appendFileSyncMock.mock.calls[0][1];
    expect(content).toContain("[INFO]");
    expect(content).toContain("Hello");
  });

  it("logError creates error-level entry", async () => {
    const { logError } = await import("./logger.js");
    logError("error_action", "Something failed");
    expect(appendFileSyncMock).toHaveBeenCalled();
    const content = appendFileSyncMock.mock.calls[0][1];
    expect(content).toContain("[ERROR]");
  });
});
