import { API_URL } from "./utils";
import { logInfo, logError } from "./logger";

function getToken(): string | null {
  return localStorage.getItem("token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; msg?: string } & Record<string, unknown>> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const method = (options.method || "GET").toUpperCase();
  const url = path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (res.ok) {
    logInfo("api_request", `${method} ${path}`, { method, path, status: res.status });
  } else {
    logError("api_request", json.msg || "Request failed", { method, path, status: res.status });
  }

  if (!res.ok) {
    return { success: false, msg: json.msg || "Request failed", ...json };
  }

  return json;
}
