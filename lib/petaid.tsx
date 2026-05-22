"use client";

/**
 * PetAid client controller.
 *
 * Mirrors the reference core/70-app-controller.js, but instead of running the
 * OOP domain in the browser over localStorage, it calls the FastAPI backend
 * (which owns the domain logic + Supabase persistence) and normalises the
 * responses into the exact `snapshot` shape the ported views expect.
 *
 * API role `veterinary_expert` is normalised to the reference's `vet_expert`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const ACCESS = "petaid:access";
const REFRESH = "petaid:refresh";

/* ----------------------------------------------------------- token store */
const tok = {
  get access() {
    return typeof window === "undefined" ? null : localStorage.getItem(ACCESS);
  },
  get refresh() {
    return typeof window === "undefined" ? null : localStorage.getItem(REFRESH);
  },
  set(a: string, r: string) {
    localStorage.setItem(ACCESS, a);
    localStorage.setItem(REFRESH, r);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};

export class ApiError extends Error {
  status: number;
  code: string;
  field?: string;
  retryAfter?: number;
  constructor(status: number, body: { code?: string; detail?: string; field?: string; retry_after_seconds?: number }) {
    super(body.detail || "Request failed");
    this.status = status;
    this.code = body.code || "error";
    this.field = body.field;
    this.retryAfter = body.retry_after_seconds;
  }
}

async function rawReq<T>(path: string, init: RequestInit, token: string | null): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (!res.ok) {
    let body = { code: "error", detail: res.statusText };
    try {
      const d = await res.json();
      if (d?.detail) body = d;
    } catch {
      /* keep fallback */
    }
    throw new ApiError(res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function refreshTokens(): Promise<string | null> {
  if (!tok.refresh) return null;
  try {
    const t = await rawReq<TokenPair>(
      "/api/v1/auth/refresh",
      { method: "POST", body: JSON.stringify({ refresh_token: tok.refresh }) },
      null,
    );
    tok.set(t.access_token, t.refresh_token);
    return t.access_token;
  } catch {
    tok.clear();
    return null;
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await rawReq<T>(path, init, tok.access);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      const t = await refreshTokens();
      if (t) return rawReq<T>(path, init, t);
    }
    throw e;
  }
}

/* ----------------------------------------------------------- API shapes */
type TokenPair = { access_token: string; refresh_token: string; token_type: string; role: string };
type ApiPetType = { id: string; name: string; description: string; icon_emoji: string; icon_bg: string };
type ApiPet = { id: string; name: string; breed: string | null; age_years: number | null; health_notes: string; pet_type: ApiPetType };
type ApiResource = { id: string; title: string; content_type: string; status: string; media_path: string | null; pet_type: ApiPetType };
type ApiGuidance = { id: string; title: string; emergency_type: string; summary: string; steps: string[]; pet_type: ApiPetType; resources: ApiResource[] };
type ApiQuizQ = { prompt: string; options: string[]; answer_index: number };
type ApiQuiz = { id: string; title: string; passing_score: number; resource_id: string; questions: ApiQuizQ[] };
type ApiInquiry = { id: string; subject: string; question: string; response: string | null; status: string; submitted_at: string; responded_at: string | null; closed_at: string | null };
type ApiChatMsg = { id: string; sender_id: string; body: string; sent_at: string };
type ApiChat = { id: string; subject: string; status: string; started_at: string; ended_at: string | null; messages: ApiChatMsg[] };
type ApiDonation = { id: string; amount_cents: number; currency: string; status: string; transaction_ref: string | null; processed_at: string | null };
type ApiFeedback = { id: string; target_type: string; target_id: string; flagged: boolean; rating: number; comment: string; created_at: string };
type ApiUser = { id: string; full_name: string; initials: string; role: string; display_name: string; pets_count: number; quizzes_count: number; chats_count: number };
type ApiDashboard = { user: ApiUser; role: string; panels: any };

/* ----------------------------------------------------------- normalised */
export type Role = "pet_owner" | "vet_expert";
export type Account = {
  id: string; name: string; initials: string; role: Role; email?: string;
  speciality?: string; clinic?: string;
};
export type PetType = { id: string; name: string; emoji: string; bg: string };
export type Pet = { id: string; name: string; breed: string; age: number; emoji: string; bg: string; typeId: string; typeName: string; notes: string };
export type Guidance = { id: string; title: string; emergencyType: string; steps: string[]; summary: string; petTypeIds: string[]; petTypeNames: string[]; resourceCount: number };
export type Resource = { id: string; title: string; contentType: string; status: string; petTypeIds: string[]; petTypeName: string };
export type QuizQuestion = { prompt: string; choices: string[] };
export type Quiz = { id: string; title: string; passingScore: number; questions: QuizQuestion[] };
export type QuizAttempt = { quizId: string; score: number; passed: boolean; takenAt: number };
export type Inquiry = { id: string; subject: string; question: string; response: string | null; status: string; createdAt: number; respondedAt: number | null };
export type ChatMessage = { id: string; senderId: string; text: string; at: number };
export type Chat = { id: string; subject: string; status: string; startedAt: number; messages: ChatMessage[] };
export type Donation = { id: string; amount: number; currency: string; status: string; reference: string | null; at: number | null };
export type Feedback = { id: string; targetType: string; targetId: string; rating: number; comment: string; flagged: boolean; createdAt: number };

export type PetOwnerPanels = {
  pets: Pet[];
  featuredPet: Pet | null;
  guidance: Guidance[];
  resources: Resource[];
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  inquiries: Inquiry[];
  chats: Chat[];
  donations: Donation[];
  petTypes: PetType[];
  stats: { preparedness: number; avgScore: number; guidanceSessions: number; moduleCount: number };
};
export type VetPanels = {
  inquiriesByStatus: { pending: Inquiry[]; responded: Inquiry[]; closed: Inquiry[] };
  activeChats: Chat[];
  resources: Resource[];
  guidance: Guidance[];
  flaggedFeedback: Feedback[];
  donations: Donation[];
};
export type Dashboard = {
  header: { role: string; greeting: string; tagline: string };
  panels: PetOwnerPanels | VetPanels;
  actions: string[];
};
export type Snapshot = { account: Account | null; role: Role | null; dashboard: Dashboard | null };

/* ----------------------------------------------------------- mappers */
const ms = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);
const normRole = (r: string): Role => (r === "veterinary_expert" || r === "vet_expert" ? "vet_expert" : "pet_owner");

const mapPet = (p: ApiPet): Pet => ({
  id: p.id, name: p.name, breed: p.breed || "", age: p.age_years || 0,
  emoji: p.pet_type?.icon_emoji || "🐾", bg: p.pet_type?.icon_bg || "#F4F4F4",
  typeId: p.pet_type?.id, typeName: p.pet_type?.name || "", notes: p.health_notes || "",
});
const mapGuidance = (g: ApiGuidance): Guidance => ({
  id: g.id, title: g.title, emergencyType: g.emergency_type, steps: g.steps, summary: g.summary,
  petTypeIds: g.pet_type ? [g.pet_type.id] : [], petTypeNames: g.pet_type ? [g.pet_type.name] : [],
  resourceCount: g.resources?.length || 0,
});
const mapResource = (r: ApiResource): Resource => ({
  id: r.id, title: r.title, contentType: r.content_type, status: r.status,
  petTypeIds: r.pet_type ? [r.pet_type.id] : [], petTypeName: r.pet_type?.name || "",
});
const mapQuiz = (q: ApiQuiz): Quiz => ({
  id: q.id, title: q.title, passingScore: q.passing_score,
  questions: q.questions.map((qq) => ({ prompt: qq.prompt, choices: qq.options })),
});
const mapInquiry = (i: ApiInquiry): Inquiry => ({
  id: i.id, subject: i.subject, question: i.question, response: i.response, status: i.status,
  createdAt: ms(i.submitted_at), respondedAt: i.responded_at ? ms(i.responded_at) : null,
});
const mapChat = (c: ApiChat): Chat => ({
  id: c.id, subject: c.subject, status: c.status, startedAt: ms(c.started_at),
  messages: (c.messages || []).map((m) => ({ id: m.id, senderId: m.sender_id, text: m.body, at: ms(m.sent_at) })),
});
const mapDonation = (d: ApiDonation): Donation => ({
  id: d.id, amount: d.amount_cents / 100, currency: d.currency, status: d.status,
  reference: d.transaction_ref, at: d.processed_at ? ms(d.processed_at) : null,
});
const mapFeedback = (f: ApiFeedback): Feedback => ({
  id: f.id, targetType: f.target_type, targetId: f.target_id, rating: f.rating,
  comment: f.comment, flagged: f.flagged, createdAt: ms(f.created_at),
});

/* ----------------------------------------------------------- controller */
async function loadPetOwnerSnapshot(user: ApiUser, stats: any): Promise<Snapshot> {
  const [petsR, guideR, resR, quizR, inqR, chatR, donR, ptR] = await Promise.all([
    req<ApiPet[]>("/api/v1/pets"),
    req<ApiGuidance[]>("/api/v1/first-aid"),
    req<ApiResource[]>("/api/v1/resources"),
    req<ApiQuiz[]>("/api/v1/quizzes"),
    req<ApiInquiry[]>("/api/v1/inquiries"),
    req<ApiChat[]>("/api/v1/chats"),
    req<ApiDonation[]>("/api/v1/donations"),
    req<ApiPetType[]>("/api/v1/pet-types"),
  ]);
  const pets = petsR.map(mapPet);
  const guidance = guideR.map(mapGuidance);
  const resources = resR.map(mapResource);
  const quizzes = quizR.map(mapQuiz);
  const petTypes = ptR.map((t) => ({ id: t.id, name: t.name, emoji: t.icon_emoji, bg: t.icon_bg }));
  const panels: PetOwnerPanels = {
    pets,
    featuredPet: pets[0] || null,
    guidance,
    resources,
    quizzes,
    attempts: [],
    inquiries: inqR.map(mapInquiry),
    chats: chatR.map(mapChat),
    donations: donR.map(mapDonation),
    petTypes,
    stats: {
      preparedness: stats?.preparedness_pct ?? 0,
      avgScore: stats?.quiz_avg_score ?? 0,
      guidanceSessions: stats?.guidance_sessions_this_month ?? 0,
      moduleCount: resources.length + guidance.length,
    },
  };
  return {
    account: { id: user.id, name: user.full_name, initials: user.initials, role: "pet_owner" },
    role: "pet_owner",
    dashboard: {
      header: {
        role: "Pet Owner",
        greeting: `Good day, ${user.display_name}.`,
        tagline: "Your pets are ready. Tap Emergency if you need help right now.",
      },
      panels,
      actions: ["add_pet", "open_emergency", "take_quiz", "submit_inquiry", "start_chat", "donate", "submit_feedback"],
    },
  };
}

async function loadVetSnapshot(user: ApiUser): Promise<Snapshot> {
  const [inqR, chatR, resR, guideR, fbR, donR] = await Promise.all([
    req<ApiInquiry[]>("/api/v1/inquiries"),
    req<ApiChat[]>("/api/v1/chats"),
    req<ApiResource[]>("/api/v1/resources"),
    req<ApiGuidance[]>("/api/v1/first-aid"),
    req<ApiFeedback[]>("/api/v1/feedback"),
    req<ApiDonation[]>("/api/v1/donations").catch(() => [] as ApiDonation[]),
  ]);
  const inquiries = inqR.map(mapInquiry);
  const chats = chatR.map(mapChat);
  const panels: VetPanels = {
    inquiriesByStatus: {
      pending: inquiries.filter((i) => i.status === "pending"),
      responded: inquiries.filter((i) => i.status === "responded"),
      closed: inquiries.filter((i) => i.status === "closed"),
    },
    activeChats: chats.filter((c) => c.status !== "closed"),
    resources: resR.map(mapResource),
    guidance: guideR.map(mapGuidance),
    flaggedFeedback: fbR.map(mapFeedback).filter((f) => f.flagged),
    donations: donR.map(mapDonation).filter((d) => d.status === "succeeded"),
  };
  return {
    account: { id: user.id, name: user.full_name, initials: user.initials, role: "vet_expert" },
    role: "vet_expert",
    dashboard: {
      header: {
        role: "Veterinary Expert",
        greeting: `Welcome, Dr. ${user.full_name.split(" ").slice(-1)[0]}.`,
        tagline: "Pending inquiries, active chats, and content awaiting review.",
      },
      panels,
      actions: ["respond_inquiry", "join_chat", "publish_resource", "author_guidance", "review_feedback", "verify_donation"],
    },
  };
}

export async function loadSnapshot(): Promise<Snapshot> {
  if (!tok.access) return { account: null, role: null, dashboard: null };
  const dash = await req<ApiDashboard>("/api/v1/dashboard");
  return normRole(dash.role) === "vet_expert"
    ? loadVetSnapshot(dash.user)
    : loadPetOwnerSnapshot(dash.user, dash.panels?.stats);
}

/* auth + actions */
export const petaid = {
  async register(payload: { name: string; email: string; password: string; role: Role }) {
    const apiRole = payload.role === "vet_expert" ? "veterinary_expert" : "pet_owner";
    return rawReq<{ email: string; verification_code: string | null; message: string }>(
      "/api/v1/auth/register",
      { method: "POST", body: JSON.stringify({ full_name: payload.name, email: payload.email, password: payload.password, role: apiRole }) },
      null,
    );
  },
  async verifyEmail(email: string, code: string) {
    const t = await rawReq<TokenPair>(
      "/api/v1/auth/verify-email",
      { method: "POST", body: JSON.stringify({ email, code }) },
      null,
    );
    tok.set(t.access_token, t.refresh_token);
    return t;
  },
  async login(email: string, password: string, mfaToken?: string) {
    const t = await rawReq<TokenPair>(
      "/api/v1/auth/login",
      { method: "POST", body: JSON.stringify({ email, password, mfa_token: mfaToken || null }) },
      null,
    );
    tok.set(t.access_token, t.refresh_token);
    return t;
  },
  logout() {
    tok.clear();
  },
  hasSession: () => !!tok.access,

  /* public (guest) content — no auth */
  async guestData(): Promise<{ guidance: Guidance[]; petTypes: PetType[] }> {
    const [g, pt] = await Promise.all([
      rawReq<ApiGuidance[]>("/api/v1/first-aid", {}, null),
      rawReq<ApiPetType[]>("/api/v1/pet-types", {}, null),
    ]);
    return {
      guidance: g.map(mapGuidance),
      petTypes: pt.map((t) => ({ id: t.id, name: t.name, emoji: t.icon_emoji, bg: t.icon_bg })),
    };
  },

  /* domain actions */
  addPet: (b: { name: string; pet_type_id: string; breed?: string; age_years?: number | null; health_notes?: string }) =>
    req("/api/v1/pets", { method: "POST", body: JSON.stringify(b) }),
  submitInquiry: (subject: string, question: string) =>
    req("/api/v1/inquiries", { method: "POST", body: JSON.stringify({ subject, question }) }),
  respondInquiry: (id: string, response: string) =>
    req(`/api/v1/inquiries/${id}/respond`, { method: "POST", body: JSON.stringify({ response }) }),
  startChat: (subject: string) => req<ApiChat>("/api/v1/chats", { method: "POST", body: JSON.stringify({ subject }) }),
  joinChat: (id: string) => req(`/api/v1/chats/${id}/join`, { method: "POST" }),
  postChatMessage: (id: string, body: string) =>
    req(`/api/v1/chats/${id}/messages`, { method: "POST", body: JSON.stringify({ body }) }),
  closeChat: (id: string) => req(`/api/v1/chats/${id}/close`, { method: "POST" }),
  donate: (amountCents: number, currency = "USD", recurring = false) =>
    req<ApiDonation>("/api/v1/donations", { method: "POST", body: JSON.stringify({ amount_cents: amountCents, currency, recurring }) }),
  fetchQuiz: (id: string) => req<ApiQuiz & { questions: ApiQuizQ[] }>(`/api/v1/quizzes/${id}`),
  submitQuiz: (id: string, answers: number[]) =>
    req<{ id: string; quiz_id: string; score_pct: number; passed: boolean }>(`/api/v1/quizzes/${id}/attempts`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  submitFeedback: (b: { target_type: string; target_id: string; rating: number; comment?: string; flagged?: boolean }) =>
    req("/api/v1/feedback", { method: "POST", body: JSON.stringify({ comment: "", flagged: false, ...b }) }),
  publishResource: (id: string) => req(`/api/v1/resources/${id}/publish`, { method: "POST" }),
  petTypes: () => req<ApiPetType[]>("/api/v1/pet-types"),
  createResource: (b: { title: string; content_type: string; pet_type_id: string; media_path: string; size_bytes: number }) =>
    req<ApiResource>("/api/v1/resources", { method: "POST", body: JSON.stringify(b) }),
};

/* ----------------------------------------------------------- React glue */
type Ctx = {
  snapshot: Snapshot | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setSnapshot: (s: Snapshot) => void;
};
const PetAidContext = createContext<Ctx | null>(null);

export function PetAidProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const booted = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const snap = await loadSnapshot();
      setSnap(snap);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        petaid.logout();
        setSnap({ account: null, role: null, dashboard: null });
      } else {
        throw e;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    refresh();
  }, [refresh]);

  return (
    <PetAidContext.Provider value={{ snapshot, loading, refresh, setSnapshot: setSnap }}>
      {children}
    </PetAidContext.Provider>
  );
}

export function usePetAid() {
  const ctx = useContext(PetAidContext);
  if (!ctx) throw new Error("usePetAid must be used within PetAidProvider");
  return ctx;
}
