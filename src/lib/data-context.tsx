"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type {
  ActivityEntry,
  AppSettings,
  Blessing,
  Booking,
  ChecklistItem,
  EventFile,
  EventMember,
  Guest,
  Household,
  Lookbook,
  LookbookPhoto,
  Note,
  Notification,
  Performance,
  Photo,
  Profile,
  ShoppingItem,
  Task,
  TaskAssignee,
  TaskComment,
  TimelineItem,
  Vendor,
  WeddingEvent,
} from "@/lib/types";

interface WeddingData {
  db: SupabaseClient;
  user: User | null;
  me: Profile | null;
  isAdmin: boolean;
  isGuest: boolean;
  isSuperadmin: boolean;
  viewHousehold: "rahul" | "somya" | "all";
  /** Household to stamp on newly created rows (null = let the DB decide). */
  writeHousehold: string | null;
  setViewHousehold: (h: "rahul" | "somya" | "all") => void;
  loading: boolean;
  settings: AppSettings;
  branding: { appTitle: string; greetingName: string; coupleNames: string; household: string | null };
  profiles: Profile[];
  events: WeddingEvent[];
  eventMembers: EventMember[];
  tasks: Task[];
  taskAssignees: TaskAssignee[];
  checklistItems: ChecklistItem[];
  comments: TaskComment[];
  shoppingItems: ShoppingItem[];
  vendors: Vendor[];
  guests: Guest[];
  bookings: Booking[];
  performances: Performance[];
  photos: Photo[];
  notifications: Notification[];
  activity: ActivityEntry[];
  notes: Note[];
  files: EventFile[];
  timelineItems: TimelineItem[];
  lookbooks: Lookbook[];
  lookbookPhotos: LookbookPhoto[];
  blessings: Blessing[];
  refresh: (table: TableName) => Promise<void>;
  logActivity: (action: string, entity: string, detail: string, entityId?: string) => Promise<void>;
  notify: (profileId: string, title: string, body?: string, link?: string) => Promise<void>;
}

const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  couple_names: "Rahul & Somya",
  wedding_date: "2027-01-29",
  planning_start: "2026-07-01",
  currency: "₹",
};

type TableName =
  | "profiles"
  | "app_settings"
  | "events"
  | "event_members"
  | "tasks"
  | "task_assignees"
  | "task_checklist_items"
  | "task_comments"
  | "shopping_items"
  | "vendors"
  | "guests"
  | "bookings"
  | "performances"
  | "photos"
  | "notifications"
  | "activity_log"
  | "notes"
  | "event_files"
  | "timeline_items"
  | "lookbooks"
  | "lookbook_photos"
  | "blessings";

const TABLE_ORDER: Partial<Record<TableName, { column: string; ascending: boolean }>> = {
  events: { column: "sort_order", ascending: true },
  tasks: { column: "sort_order", ascending: true },
  task_checklist_items: { column: "sort_order", ascending: true },
  task_comments: { column: "created_at", ascending: true },
  shopping_items: { column: "created_at", ascending: true },
  guests: { column: "name", ascending: true },
  vendors: { column: "name", ascending: true },
  bookings: { column: "sort_order", ascending: true },
  performances: { column: "sort_order", ascending: true },
  photos: { column: "created_at", ascending: false },
  notifications: { column: "created_at", ascending: false },
  activity_log: { column: "created_at", ascending: false },
  notes: { column: "created_at", ascending: false },
  event_files: { column: "created_at", ascending: false },
  timeline_items: { column: "sort_order", ascending: true },
  lookbooks: { column: "created_at", ascending: true },
  lookbook_photos: { column: "sort_order", ascending: true },
  blessings: { column: "created_at", ascending: false },
};

const DataContext = createContext<WeddingData | null>(null);

export function WeddingDataProvider({ children }: { children: React.ReactNode }) {
  const dbRef = useRef<SupabaseClient | null>(null);
  if (!dbRef.current) dbRef.current = createClient();
  const db = dbRef.current;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Record<TableName, unknown[]>>({
    profiles: [],
    app_settings: [],
    events: [],
    event_members: [],
    tasks: [],
    task_assignees: [],
    task_checklist_items: [],
    task_comments: [],
    shopping_items: [],
    vendors: [],
    guests: [],
    bookings: [],
    performances: [],
    photos: [],
    notifications: [],
    activity_log: [],
    notes: [],
    event_files: [],
    timeline_items: [],
    lookbooks: [],
    lookbook_photos: [],
    blessings: [],
  });

  const refresh = useCallback(
    async (table: TableName) => {
      const order = TABLE_ORDER[table];
      let query = db.from(table).select("*");
      if (order) query = query.order(order.column, { ascending: order.ascending });
      if (table === "activity_log") query = query.limit(200);
      const { data, error } = await query;
      if (!error && data) {
        setRows((prev) => ({ ...prev, [table]: data }));
      }
    },
    [db]
  );

  // initial auth + load
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user: u },
      } = await db.auth.getUser();
      if (cancelled) return;
      setUser(u);
      if (!u) {
        setLoading(false);
        return;
      }
      await Promise.all((Object.keys(TABLE_ORDER) as TableName[])
        .concat(["profiles", "app_settings", "event_members", "task_assignees"])
        .filter((t, i, arr) => arr.indexOf(t) === i)
        .map((t) => refresh(t)));
      if (!cancelled) setLoading(false);
    }

    load();

    const { data: sub } = db.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [db, refresh]);

  // realtime: any change to any table refreshes that table
  useEffect(() => {
    if (!user) return;
    const tables: TableName[] = [
      "profiles", "app_settings", "events", "event_members", "tasks",
      "task_assignees", "task_checklist_items", "task_comments", "shopping_items",
      "vendors", "guests", "bookings", "performances", "photos", "notifications",
      "activity_log", "notes", "event_files",
      "timeline_items", "lookbooks", "lookbook_photos", "blessings",
    ];
    const channel = db.channel("wedding-realtime");
    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => refresh(table)
      );
    }
    channel.subscribe();
    return () => {
      db.removeChannel(channel);
    };
  }, [db, user, refresh]);

  const profiles = rows.profiles as Profile[];
  const me = useMemo(
    () => profiles.find((p) => p.id === user?.id) ?? null,
    [profiles, user]
  );

  // per-family branding (two workspaces share one wedding)
  const [households, setHouseholds] = useState<Household[]>([]);
  useEffect(() => {
    if (!user) { setHouseholds([]); return; }
    db.from("households").select("*").then(({ data }) => setHouseholds((data as Household[]) ?? []));
  }, [db, user]);

  // super-admin = admin profile with no household → oversight of both families
  const isSuperadmin = Boolean(me && me.role === "admin" && !me.household);

  // which family the super-admin is currently viewing ('all' = both)
  const [viewHousehold, setViewHouseholdState] = useState<"rahul" | "somya" | "all">("all");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("viewHousehold");
    if (saved === "rahul" || saved === "somya" || saved === "all") setViewHouseholdState(saved);
  }, []);
  const setViewHousehold = useCallback((h: "rahul" | "somya" | "all") => {
    setViewHouseholdState(h);
    if (typeof window !== "undefined") window.localStorage.setItem("viewHousehold", h);
  }, []);

  // for a super-admin viewing one family, narrow the household-scoped rows
  const activeView = isSuperadmin ? viewHousehold : "all";
  const filterHH = useCallback(
    <T,>(arr: T[]): T[] =>
      activeView === "all"
        ? arr
        : arr.filter((r) => {
            const hh = (r as { household?: string | null }).household;
            // keep unassigned rows visible — otherwise anything created while
            // no family was selected silently disappears from every view
            return hh === activeView || hh == null;
          }),
    [activeView]
  );

  /**
   * Household that newly created rows should belong to. Family accounts get
   * theirs from the DB trigger; a super-admin has none, so stamp whichever
   * family they're currently viewing.
   */
  const writeHousehold =
    isSuperadmin && viewHousehold !== "all" ? viewHousehold : me?.household ?? null;

  const branding = useMemo(() => {
    const effectiveId = isSuperadmin ? (viewHousehold === "all" ? null : viewHousehold) : me?.household;
    const h = households.find((x) => x.id === effectiveId);
    if (isSuperadmin && viewHousehold === "all") {
      return { appTitle: "Both Families", greetingName: "Admin", coupleNames: "Rahul & Somya", household: null };
    }
    return {
      appTitle: h?.app_title ?? "Rahul & Somya",
      greetingName: h?.greeting_name ?? me?.full_name?.split(" ")[0] ?? "",
      coupleNames: h?.couple_names ?? DEFAULT_SETTINGS.couple_names,
      household: effectiveId ?? null,
    };
  }, [households, me, isSuperadmin, viewHousehold]);

  const logActivity = useCallback(
    async (action: string, entity: string, detail: string, entityId?: string) => {
      if (!user) return;
      await db.from("activity_log").insert({
        actor_id: user.id,
        action,
        entity,
        entity_id: entityId ?? null,
        detail,
      });
      refresh("activity_log");
    },
    [db, user, refresh]
  );

  const notify = useCallback(
    async (profileId: string, title: string, body?: string, link?: string) => {
      await db.from("notifications").insert({
        profile_id: profileId,
        title,
        body: body ?? null,
        link: link ?? null,
      });
    },
    [db]
  );

  const value: WeddingData = {
    db,
    user,
    me,
    isAdmin: me?.role === "admin",
    isGuest: me?.role === "guest",
    isSuperadmin,
    viewHousehold,
    writeHousehold,
    setViewHousehold,
    loading,
    settings: (rows.app_settings[0] as AppSettings) ?? DEFAULT_SETTINGS,
    branding,
    profiles,
    events: rows.events as WeddingEvent[],
    eventMembers: rows.event_members as EventMember[],
    tasks: filterHH(rows.tasks as Task[]),
    taskAssignees: rows.task_assignees as TaskAssignee[],
    checklistItems: rows.task_checklist_items as ChecklistItem[],
    comments: rows.task_comments as TaskComment[],
    shoppingItems: filterHH(rows.shopping_items as ShoppingItem[]),
    vendors: filterHH(rows.vendors as Vendor[]),
    guests: filterHH(rows.guests as Guest[]),
    bookings: filterHH(rows.bookings as Booking[]),
    performances: filterHH(rows.performances as Performance[]),
    photos: (rows.photos as Photo[]).map((p) => ({
      ...p,
      source: p.source ?? "family",
      hidden: Boolean(p.hidden),
      author_label: p.author_label ?? null,
    })),
    notifications: rows.notifications as Notification[],
    activity: filterHH(rows.activity_log as ActivityEntry[]),
    notes: filterHH(rows.notes as Note[]),
    files: filterHH(rows.event_files as EventFile[]),
    timelineItems: rows.timeline_items as TimelineItem[],
    lookbooks: (rows.lookbooks as Lookbook[]).map((lb) => ({
      ...lb,
      colors: Array.isArray(lb.colors) ? lb.colors : [],
    })),
    lookbookPhotos: rows.lookbook_photos as LookbookPhoto[],
    blessings: rows.blessings as Blessing[],
    refresh,
    logActivity,
    notify,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useWedding() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useWedding must be used inside WeddingDataProvider");
  return ctx;
}
