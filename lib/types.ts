// Mirrors the Pydantic schemas in petaid-backend (app/schemas/*).
// Keep in sync when the API contract changes.

export type Role = "pet_owner" | "veterinary_expert";

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: Role;
};

// ---------------------------------------------------------------- Dashboard
export type UserSummary = {
  id: string;
  full_name: string;
  initials: string;
  role: Role;
  display_name: string;
};

export type ActivityPoint = {
  label: string;
  quiz_score: number;
  guidance_sessions: number;
};

export type PetCard = {
  id: string;
  name: string;
  breed: string | null;
  age_years: number | null;
  pet_type: string;
  icon_emoji: string;
  icon_bg: string;
};

export type ResourceCard = {
  id: string;
  title: string;
  kind: string;
  status: string;
  pet_type?: string;
};

export type ChatCard = {
  id: string;
  counterpart_name: string;
  counterpart_initials: string;
  counterpart_bg: string;
  counterpart_fg: string;
  last_message_at: string;
  last_preview: string;
  unread: boolean;
};

export type ReadinessItem = {
  category: string;
  color: string;
  score_pct: number;
};

export type ReminderCard = {
  id: string;
  title: string;
  body: string;
  kind: string;
  due_at: string;
  icon_color: string;
};

export type PetOwnerPanels = {
  pets: PetCard[];
  stats: {
    quiz_avg_score: number;
    guidance_sessions_this_month: number;
    preparedness_pct: number;
  };
  activity: {
    points: ActivityPoint[];
    avg_score_trend_pct: number;
    peak_label: string;
  };
  resources: ResourceCard[];
  chats: ChatCard[];
  readiness: ReadinessItem[];
  reminders: ReminderCard[];
};

export type VetInquiryRow = {
  id: string;
  subject: string;
  question: string;
  submitted_at: string;
  from: string;
};

export type VetChatRow = {
  id: string;
  subject: string;
  status: string;
  started_at: string;
  owner: string;
};

export type VetResourceRow = {
  id: string;
  title: string;
  kind: string;
  pet_type: string;
};

export type VetFeedbackRow = {
  id: string;
  target_type: string;
  target_id: string;
  rating: number | null;
  comment: string;
  from: string;
};

export type VetDonationRow = {
  id: string;
  amount: number;
  currency: string;
  transaction_ref: string | null;
  processed_at: string | null;
  donor: string;
};

export type VetPanels = {
  pending_inquiries: VetInquiryRow[];
  active_chats: VetChatRow[];
  draft_resources: VetResourceRow[];
  flagged_feedback: VetFeedbackRow[];
  donations: VetDonationRow[];
  stats: {
    pending_inquiries: number;
    active_chats: number;
    drafts_awaiting_approval: number;
  };
};

export type DashboardResponse =
  | { user: UserSummary; role: "pet_owner"; panels: PetOwnerPanels }
  | { user: UserSummary; role: "veterinary_expert"; panels: VetPanels };

// ---------------------------------------------------------------- Entities
export type PetType = {
  id: string;
  name: string;
  description: string;
  icon_emoji: string;
  icon_bg: string;
};

export type Pet = {
  id: string;
  name: string;
  breed: string | null;
  age_years: number | null;
  health_notes: string;
  pet_type: PetType;
};

export type Resource = {
  id: string;
  title: string;
  content_type: string;
  status: "draft" | "published";
  media_path: string | null;
  pet_type: PetType;
};

export type FirstAidGuidance = {
  id: string;
  title: string;
  emergency_type: string;
  summary: string;
  steps: string[];
  pet_type: PetType;
  resources: Resource[];
};

export type QuizQuestion = {
  prompt: string;
  options: string[];
  answer_index: number; // server returns -1 to clients before grading
};

export type Quiz = {
  id: string;
  title: string;
  passing_score: number;
  resource_id: string;
  questions: QuizQuestion[];
};

export type QuizAttempt = {
  id: string;
  quiz_id: string;
  score_pct: number;
  passed: boolean;
  completed_at: string;
};

export type Inquiry = {
  id: string;
  subject: string;
  question: string;
  response: string | null;
  status: "pending" | "responded" | "closed";
  submitted_at: string;
  responded_at: string | null;
  closed_at: string | null;
};

export type ChatMessage = {
  id: string;
  sender_id: string;
  body: string;
  sent_at: string;
};

export type Chat = {
  id: string;
  subject: string;
  status: "initiated" | "active" | "closed";
  started_at: string;
  ended_at: string | null;
  messages: ChatMessage[];
};

export type Donation = {
  id: string;
  amount_cents: number;
  currency: string;
  status: "pending" | "succeeded" | "failed";
  transaction_ref: string | null;
  processed_at: string | null;
};

export type Feedback = {
  id: string;
  target_type: "resource" | "guidance";
  target_id: string;
  flagged: boolean;
  rating: number;
  comment: string;
  created_at: string;
};

// ---------------------------------------------------------------- Component aliases
// Older components (ActivityChart, StatCards, ResourcesCard, RightPanel) were
// written against the previous flat dashboard shape. These aliases keep them
// compiling against the new role-aware payload.
export type LearningActivity = PetOwnerPanels["activity"];
export type StatCards = PetOwnerPanels["stats"];
export type ResourceItem = ResourceCard;
export type ChatThread = ChatCard;
export type Reminder = ReminderCard;

// ---------------------------------------------------------------- Error shape
export type ApiErrorBody = {
  code: string;
  detail: string;
  field?: string;
  retry_after_seconds?: number;
};
