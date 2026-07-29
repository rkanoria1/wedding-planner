export type UserRole = "admin" | "family" | "volunteer";
export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "waiting"
  | "blocked"
  | "completed"
  | "cancelled";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type RsvpStatus = "pending" | "confirmed" | "declined" | "maybe";
export type GuestSide = "bride" | "groom" | "both";
export type GuestGroup = "family" | "friends" | "vip";
export type PaymentKind = "expense" | "advance" | "vendor_payment";

export interface Household {
  id: string;
  app_title: string;
  greeting_name: string;
  couple_names: string;
  sort_order: number;
}
export type BookingStatus =
  | "not_booked"
  | "enquired"
  | "negotiating"
  | "booked"
  | "confirmed"
  | "cancelled";
export type EventTheme =
  | "henna"
  | "marigold"
  | "emerald"
  | "champagne"
  | "rose"
  | "sapphire"
  | "sunset"
  | "lavender";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  household: string | null;
  created_at: string;
}

export interface AppSettings {
  id: number;
  couple_names: string;
  wedding_date: string;
  planning_start: string;
  currency: string;
}

export interface WeddingEvent {
  id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  theme: EventTheme;
  icon: string;
  venue: string | null;
  archived: boolean;
  sort_order: number;
  created_at: string;
}

export interface EventMember {
  event_id: string;
  profile_id: string;
}

export interface Task {
  id: string;
  event_id: string | null;
  name: string;
  description: string | null;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  completion: number;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface TaskAssignee {
  task_id: string;
  profile_id: string;
}

export interface ChecklistItem {
  id: string;
  task_id: string;
  label: string;
  done: boolean;
  sort_order: number;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  event_id: string | null;
  name: string;
  category: string;
  quantity: number;
  budget: number;
  actual_price: number | null;
  store: string | null;
  purchased: boolean;
  assigned_to: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  event_id: string | null;
  category: string;
  allocated: number;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  total_amount: number;
  advance_paid: number;
  booked: boolean;
  rating: number | null;
  notes: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  event_id: string | null;
  vendor_id: string | null;
  category: string;
  description: string;
  amount: number;
  kind: PaymentKind;
  paid: boolean;
  paid_on: string | null;
  created_at: string;
}

export interface Guest {
  id: string;
  name: string;
  side: GuestSide;
  grp: GuestGroup;
  rsvp: RsvpStatus;
  invitation_sent: boolean;
  food_pref: string | null;
  phone: string | null;
  head_count: number;
  invited_events: string[];
  notes: string | null;
  created_at: string;
}

export type PerformanceStatus = "planned" | "rehearsing" | "ready";

export interface Performance {
  id: string;
  event_id: string | null;
  title: string;
  song: string | null;
  performers: string | null;
  rehearsal_date: string | null;
  duration_min: number | null;
  status: PerformanceStatus;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  profile_id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface ActivityEntry {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  detail: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  event_id: string | null;
  author_id: string | null;
  body: string;
  pinned: boolean;
  created_at: string;
}

export interface EventFile {
  id: string;
  event_id: string | null;
  name: string;
  path: string;
  size: number;
  uploaded_by: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  category: string;
  vendor_name: string | null;
  event_id: string | null;
  status: BookingStatus;
  booking_date: string | null;
  contract_signed: boolean;
  advance_paid: number;
  balance_due: number;
  final_payment_due: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  trial_scheduled: string | null;
  fitting_date: string | null;
  notes: string | null;
  contract_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
