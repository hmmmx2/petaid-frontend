export type UserSummary = {
  id: string;
  full_name: string;
  initials: string;
  role: string;
  pets_count: number;
  quizzes_count: number;
  chats_count: number;
};

export type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age_years: number | null;
  icon_emoji: string;
  icon_bg: string;
};

export type StatCards = {
  quiz_avg_score: number;
  guidance_sessions_this_month: number;
  preparedness_pct: number;
};

export type ActivityPoint = {
  label: string;
  quiz_score: number;
  guidance_sessions: number;
};

export type LearningActivity = {
  points: ActivityPoint[];
  avg_score_trend_pct: number;
  peak_label: string;
};

export type ResourceItem = {
  id: string;
  title: string;
  kind: "video" | "pdf" | "images" | string;
  status: "watched" | "in_progress" | "new" | string;
};

export type ChatThread = {
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

export type Reminder = {
  id: string;
  title: string;
  body: string;
  kind: string;
  due_at: string;
  icon_color: string;
};

export type DashboardResponse = {
  user: UserSummary;
  pets: Pet[];
  stats: StatCards;
  activity: LearningActivity;
  resources: ResourceItem[];
  chats: ChatThread[];
  readiness: ReadinessItem[];
  reminders: Reminder[];
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};
