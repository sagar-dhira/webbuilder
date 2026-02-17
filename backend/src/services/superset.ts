/**
 * Superset API service - fetches and caches JWT token, fetches charts.
 * Token is obtained via login (username/password) and cached until expiry.
 */

const SUPERSET_BASE_URL = process.env.SUPERSET_BASE_URL || "http://localhost:8088";
const SUPERSET_USERNAME = process.env.SUPERSET_USERNAME || "admin";
const SUPERSET_PASSWORD = process.env.SUPERSET_PASSWORD || "admin";

interface TokenCache {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

/** Assume token expires in 5 min; refresh 1 min before */
const TOKEN_BUFFER_MS = 60 * 1000; // 1 min before expiry

async function fetchSupersetLogin(): Promise<{ access_token: string; refresh_token?: string }> {
  const url = `${SUPERSET_BASE_URL.replace(/\/$/, "")}/api/v1/security/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: SUPERSET_USERNAME,
      password: SUPERSET_PASSWORD,
      provider: "db",
      refresh: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Superset login failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token: string; refresh_token?: string };
  if (!data.access_token) {
    throw new Error("Superset login response missing access_token");
  }

  return data;
}

async function tryRefreshToken(refreshToken: string): Promise<string | null> {
  const url = `${SUPERSET_BASE_URL.replace(/\/$/, "")}/api/v1/security/refresh`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { access_token: string };
  return data.access_token ?? null;
}

/**
 * Pre-warm Superset token (login to Superset). Call this when user logs in (e.g. Keycloak)
 * so the token is cached and ready when they request charts. Fire-and-forget safe.
 */
export function warmSupersetToken(): void {
  getSupersetToken().catch(() => {
    // Ignore - will retry when charts are requested
  });
}

/**
 * Get a valid Superset access token. Uses cache; refreshes or re-logins when expired.
 */
export async function getSupersetToken(): Promise<string> {
  const now = Date.now();

  if (tokenCache && tokenCache.expiresAt > now + TOKEN_BUFFER_MS) {
    return tokenCache.accessToken;
  }

  // Try refresh if we have refresh token
  if (tokenCache?.refreshToken) {
    const newAccess = await tryRefreshToken(tokenCache.refreshToken);
    if (newAccess) {
      tokenCache = {
        accessToken: newAccess,
        refreshToken: tokenCache.refreshToken,
        expiresAt: now + 5 * 60 * 1000, // assume 5 min
      };
      return newAccess;
    }
  }

  // Full login
  const loginData = await fetchSupersetLogin();
  tokenCache = {
    accessToken: loginData.access_token,
    refreshToken: loginData.refresh_token,
    expiresAt: now + 5 * 60 * 1000,
  };

  return tokenCache.accessToken;
}

/**
 * Fetch all charts from Superset. Requires valid token.
 */
export async function fetchSupersetCharts(): Promise<SupersetChart[]> {
  const token = await getSupersetToken();
  const url = `${SUPERSET_BASE_URL.replace(/\/$/, "")}/api/v1/chart/`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      tokenCache = null;
      return fetchSupersetCharts(); // retry once with fresh token
    }
    const text = await res.text();
    throw new Error(`Superset charts API failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { result?: SupersetChart[]; ids?: number[] };
  const result = data.result ?? [];
  return result;
}

export interface SupersetChart {
  id: number;
  slice_name: string;
  viz_type: string;
  description?: string;
  [key: string]: unknown;
}

export function getSupersetBaseUrl(): string {
  return SUPERSET_BASE_URL.replace(/\/$/, "");
}
