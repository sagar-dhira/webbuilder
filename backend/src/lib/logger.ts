import fs from "fs";
import path from "path";
import { prisma } from "./prisma.js";

const LOG_LEVELS = ["error", "warn", "info", "debug"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export interface LogEntry {
  level: LogLevel;
  action: string;
  message: string;
  userId?: string | null;
  meta?: Record<string, unknown>;
  source?: "backend" | "frontend";
}

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function formatLine(entry: LogEntry): string {
  const ts = new Date().toISOString();
  const metaStr = entry.meta ? ` ${JSON.stringify(entry.meta)}` : "";
  return `${ts} [${entry.level.toUpperCase()}] ${entry.action}: ${entry.message}${metaStr}\n`;
}

function writeToFile(entry: LogEntry) {
  try {
    ensureLogDir();
    fs.appendFileSync(LOG_FILE, formatLine(entry));
  } catch (err) {
    console.error("Logger: failed to write to file", err);
  }
}

async function writeToDb(entry: LogEntry) {
  try {
    await prisma.activityLog.create({
      data: {
        level: entry.level,
        action: entry.action,
        message: entry.message,
        userId: entry.userId ?? null,
        meta: entry.meta ? JSON.stringify(entry.meta) : null,
        source: entry.source ?? "backend",
      },
    });
  } catch (err) {
    console.error("Logger: failed to write to DB", err);
  }
}

/**
 * Log to both log file and database. File write is sync; DB write is fire-and-forget.
 */
export function log(entry: LogEntry) {
  writeToFile(entry);
  writeToDb(entry).catch(() => {});
}

export function logInfo(action: string, message: string, meta?: Record<string, unknown>, userId?: string | null) {
  log({ level: "info", action, message, userId, meta, source: "backend" });
}

export function logWarn(action: string, message: string, meta?: Record<string, unknown>, userId?: string | null) {
  log({ level: "warn", action, message, userId, meta, source: "backend" });
}

export function logError(action: string, message: string, meta?: Record<string, unknown>, userId?: string | null) {
  log({ level: "error", action, message, userId, meta, source: "backend" });
}

export function logRequest(entry: Omit<LogEntry, "action"> & { action?: string }) {
  log({
    level: "info",
    action: entry.action ?? "request",
    message: entry.message,
    userId: entry.userId,
    meta: entry.meta,
    source: "backend",
  });
}
