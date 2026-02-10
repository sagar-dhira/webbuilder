import { API_URL } from "./utils";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  level: LogLevel;
  action: string;
  message: string;
  meta?: Record<string, unknown>;
}

const LOGS_ENDPOINT = `${API_URL.replace(/\/$/, "")}/logs`;

function getToken(): string | null {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

function sendToBackend(entry: LogEntry) {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  fetch(LOGS_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      level: entry.level,
      action: entry.action,
      message: entry.message,
      meta: entry.meta,
      source: "frontend",
    }),
  }).catch(() => {});
}

/**
 * Log a user action: console in dev, and send to backend (saved to log file + DB).
 */
export function log(entry: LogEntry) {
  if (import.meta.env.DEV) {
    console.log(`[${entry.level}] ${entry.action}: ${entry.message}`, entry.meta ?? "");
  }
  sendToBackend(entry);
}

export function logInfo(action: string, message: string, meta?: Record<string, unknown>) {
  log({ level: "info", action, message, meta });
}

export function logWarn(action: string, message: string, meta?: Record<string, unknown>) {
  log({ level: "warn", action, message, meta });
}

export function logError(action: string, message: string, meta?: Record<string, unknown>) {
  log({ level: "error", action, message, meta });
}
