import type { DashboardResponse, TokenPair } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const ACCESS_KEY = "petaid:access";
const REFRESH_KEY = "petaid:refresh";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(tokens: TokenPair): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_KEY, tokens.access_token);
  window.localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function rawRequest<T>(
  path: string,
  init: RequestInit,
  token: string | null,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") detail = data.detail;
    } catch {
      // ignore parse failure
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function refresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const tokens = await rawRequest<TokenPair>(
      "/api/v1/auth/refresh",
      { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) },
      null,
    );
    setTokens(tokens);
    return tokens.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token = getAccessToken();
  try {
    return await rawRequest<T>(path, init, token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      token = await refresh();
      if (token) return rawRequest<T>(path, init, token);
    }
    throw err;
  }
}

export async function login(email: string, password: string): Promise<TokenPair> {
  const tokens = await rawRequest<TokenPair>(
    "/api/v1/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    null,
  );
  setTokens(tokens);
  return tokens;
}

export async function register(
  email: string,
  password: string,
  fullName: string,
): Promise<TokenPair> {
  const tokens = await rawRequest<TokenPair>(
    "/api/v1/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName }),
    },
    null,
  );
  setTokens(tokens);
  return tokens;
}

export function logout(): void {
  clearTokens();
}

export function fetchDashboard(): Promise<DashboardResponse> {
  return apiRequest<DashboardResponse>("/api/v1/dashboard");
}
