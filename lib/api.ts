// Typed fetch client. Tokens live in localStorage (acceptable for the
// Assignment 3 prototype scope; a production deployment should use
// httpOnly cookies).
import type {
  ApiErrorBody,
  Chat,
  ChatMessage,
  DashboardResponse,
  Donation,
  Feedback,
  FirstAidGuidance,
  Inquiry,
  Pet,
  PetType,
  Quiz,
  QuizAttempt,
  Resource,
  Role,
  TokenPair,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const ACCESS_KEY = "petaid:access";
const REFRESH_KEY = "petaid:refresh";
const ROLE_KEY = "petaid:role";

// -------------------------------------------------------------- Token store
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}
export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ROLE_KEY);
  return raw === "pet_owner" || raw === "veterinary_expert" ? raw : null;
}
function persist(tokens: TokenPair) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_KEY, tokens.access_token);
  window.localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  window.localStorage.setItem(ROLE_KEY, tokens.role);
}
export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(ROLE_KEY);
}

// -------------------------------------------------------------- Errors
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly field?: string;
  public readonly retryAfterSeconds?: number;

  constructor(status: number, body: ApiErrorBody) {
    super(body.detail);
    this.status = status;
    this.code = body.code;
    this.field = body.field;
    this.retryAfterSeconds = body.retry_after_seconds;
  }
}

// -------------------------------------------------------------- Core request
async function raw<T>(
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
    let body: ApiErrorBody = { code: "unknown", detail: res.statusText };
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") {
        body = { code: data.code ?? "error", detail: data.detail, field: data.field, retry_after_seconds: data.retry_after_seconds };
      }
    } catch {
      // body stays as a fallback shape
    }
    throw new ApiError(res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function refresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const tokens = await raw<TokenPair>(
      "/api/v1/auth/refresh",
      { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) },
      null,
    );
    persist(tokens);
    return tokens.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token = getAccessToken();
  try {
    return await raw<T>(path, init, token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      token = await refresh();
      if (token) return raw<T>(path, init, token);
    }
    throw err;
  }
}

// -------------------------------------------------------------- Auth
export async function login(email: string, password: string, mfaToken?: string): Promise<TokenPair> {
  const tokens = await raw<TokenPair>(
    "/api/v1/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password, mfa_token: mfaToken || null }),
    },
    null,
  );
  persist(tokens);
  return tokens;
}

export async function register(args: {
  email: string;
  password: string;
  fullName: string;
  role: Role;
}): Promise<TokenPair> {
  const tokens = await raw<TokenPair>(
    "/api/v1/auth/register",
    {
      method: "POST",
      body: JSON.stringify({
        email: args.email,
        password: args.password,
        full_name: args.fullName,
        role: args.role,
      }),
    },
    null,
  );
  persist(tokens);
  return tokens;
}

export function logout(): void {
  clearTokens();
}

// -------------------------------------------------------------- Resource helpers
export const api = {
  dashboard: (): Promise<DashboardResponse> => request("/api/v1/dashboard"),

  petTypes: (): Promise<PetType[]> => request("/api/v1/pet-types"),

  pets: (): Promise<Pet[]> => request("/api/v1/pets"),
  createPet: (body: Partial<Pet> & { pet_type_id: string; name: string }) =>
    request<Pet>("/api/v1/pets", { method: "POST", body: JSON.stringify(body) }),
  deletePet: (id: string) =>
    request<void>(`/api/v1/pets/${id}`, { method: "DELETE" }),

  resources: (petTypeId?: string): Promise<Resource[]> =>
    request(`/api/v1/resources${petTypeId ? `?pet_type_id=${petTypeId}` : ""}`),
  publishResource: (id: string) =>
    request<Resource>(`/api/v1/resources/${id}/publish`, { method: "POST" }),

  firstAid: (petTypeId?: string): Promise<FirstAidGuidance[]> =>
    request(`/api/v1/first-aid${petTypeId ? `?pet_type_id=${petTypeId}` : ""}`),
  firstAidById: (id: string): Promise<FirstAidGuidance> =>
    request(`/api/v1/first-aid/${id}`),

  quizzes: (): Promise<Quiz[]> => request("/api/v1/quizzes"),
  quizById: (id: string): Promise<Quiz> => request(`/api/v1/quizzes/${id}`),
  submitQuiz: (id: string, answers: number[]): Promise<QuizAttempt> =>
    request(`/api/v1/quizzes/${id}/attempts`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),

  inquiries: (): Promise<Inquiry[]> => request("/api/v1/inquiries"),
  createInquiry: (subject: string, question: string) =>
    request<Inquiry>("/api/v1/inquiries", {
      method: "POST",
      body: JSON.stringify({ subject, question }),
    }),
  respondInquiry: (id: string, response: string) =>
    request<Inquiry>(`/api/v1/inquiries/${id}/respond`, {
      method: "POST",
      body: JSON.stringify({ response }),
    }),

  chats: (): Promise<Chat[]> => request("/api/v1/chats"),
  chatById: (id: string): Promise<Chat> => request(`/api/v1/chats/${id}`),
  createChat: (subject: string) =>
    request<Chat>("/api/v1/chats", {
      method: "POST",
      body: JSON.stringify({ subject }),
    }),
  joinChat: (id: string) =>
    request<Chat>(`/api/v1/chats/${id}/join`, { method: "POST" }),
  closeChat: (id: string) =>
    request<Chat>(`/api/v1/chats/${id}/close`, { method: "POST" }),
  postChatMessage: (id: string, body: string) =>
    request<ChatMessage>(`/api/v1/chats/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  donate: (amountCents: number, currency: string, recurring = false) =>
    request<Donation>("/api/v1/donations", {
      method: "POST",
      body: JSON.stringify({ amount_cents: amountCents, currency, recurring }),
    }),
  donations: (): Promise<Donation[]> => request("/api/v1/donations"),

  submitFeedback: (body: {
    target_type: "resource" | "guidance";
    target_id: string;
    rating: number;
    comment?: string;
    flagged?: boolean;
  }) =>
    request<Feedback>("/api/v1/feedback", {
      method: "POST",
      body: JSON.stringify({ comment: "", flagged: false, ...body }),
    }),
};

export const fetchDashboard = api.dashboard;
