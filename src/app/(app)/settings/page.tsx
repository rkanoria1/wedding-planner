"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Archive, CalendarDays, Pencil, Plus, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/lib/data-context";
import type { UserRole, WeddingEvent } from "@/lib/types";
import { EVENT_THEMES, formatDate } from "@/lib/wedding";
import { EventDialog } from "@/components/events/event-dialog";
import { NotesSection } from "@/components/events/event-sections";
import { EventIcon } from "@/components/shared/event-icon";
import { MemberAvatar } from "@/components/shared/member-avatars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function SettingsPageInner() {
  const params = useSearchParams();
  const { db, me, isAdmin, settings, profiles, events, refresh, logActivity } = useWedding();

  const [tab, setTab] = useState(params.get("tab") ?? "general");
  useEffect(() => {
    const t = params.get("tab");
    if (t) setTab(t);
  }, [params]);

  /* general settings */
  const [general, setGeneral] = useState({
    couple_names: settings.couple_names,
    wedding_date: settings.wedding_date,
    planning_start: settings.planning_start,
  });
  useEffect(() => {
    setGeneral({
      couple_names: settings.couple_names,
      wedding_date: settings.wedding_date,
      planning_start: settings.planning_start,
    });
  }, [settings]);

  async function saveGeneral() {
    const { error } = await db.from("app_settings").update(general).eq("id", 1);
    if (error) return toast.error(error.message);
    refresh("app_settings");
    await logActivity("updated", "settings", "wedding settings");
    toast.success("Settings saved");
  }

  /* profile */
  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  useEffect(() => {
    if (me) setProfile({ full_name: me.full_name, phone: me.phone ?? "" });
  }, [me]);

  async function saveProfile() {
    if (!me) return;
    const { error } = await db
      .from("profiles")
      .update({ full_name: profile.full_name.trim(), phone: profile.phone.trim() || null })
      .eq("id", me.id);
    if (error) return toast.error(error.message);
    refresh("profiles");
    toast.success("Profile updated");
  }

  async function setRole(profileId: string, role: UserRole) {
    const { error } = await db.from("profiles").update({ role }).eq("id", profileId);
    if (error) return toast.error(error.message);
    refresh("profiles");
    toast.success("Role updated");
  }

  /* events */
  const [eventDialog, setEventDialog] = useState<{ open: boolean; event: WeddingEvent | null }>({
    open: false,
    event: null,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Wedding details, events, members and your profile.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>

        {/* general */}
        <TabsContent value="general" className="mt-4">
          <Card className="card-lux shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg font-normal">
                <CalendarDays className="size-5 text-gold" /> Wedding details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Couple names</Label>
                <Input
                  value={general.couple_names}
                  disabled={!isAdmin}
                  onChange={(e) => setGeneral({ ...general, couple_names: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Wedding date</Label>
                <Input
                  type="date" value={general.wedding_date} disabled={!isAdmin}
                  onChange={(e) => setGeneral({ ...general, wedding_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Planning started</Label>
                <Input
                  type="date" value={general.planning_start} disabled={!isAdmin}
                  onChange={(e) => setGeneral({ ...general, planning_start: e.target.value })}
                />
              </div>
              {isAdmin && (
                <div className="flex items-end">
                  <Button onClick={saveGeneral}>Save settings</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* events */}
        <TabsContent value="events" className="mt-4 space-y-4">
          {isAdmin && (
            <Button onClick={() => setEventDialog({ open: true, event: null })}>
              <Plus className="size-4" /> New celebration
            </Button>
          )}
          <div className="card-lux divide-y">
            {events.map((e) => (
              <div key={e.id} className={cn("flex items-center gap-3 px-4 py-3", e.archived && "opacity-60")}>
                <div className={`${EVENT_THEMES[e.theme]?.gradient ?? "bg-event-emerald"} flex size-10 items-center justify-center rounded-xl text-white`}>
                  <EventIcon name={e.icon} className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {e.name}
                    {e.archived && (
                      <Badge variant="outline" className="gap-1">
                        <Archive className="size-3" /> Archived
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(e.event_date, "EEE, d MMM yyyy")}{e.venue ? ` · ${e.venue}` : ""}
                  </p>
                </div>
                {isAdmin && (
                  <Button
                    size="icon" variant="ghost" aria-label={`Edit ${e.name}`}
                    onClick={() => setEventDialog({ open: true, event: e })}
                  >
                    <Pencil className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* members */}
        <TabsContent value="members" className="mt-4">
          <div className="card-lux divide-y">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <MemberAvatar profile={p} size="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {p.full_name} {p.id === me?.id && <span className="text-muted-foreground">(you)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{p.phone ?? "No phone"}</p>
                </div>
                {isAdmin && p.id !== me?.id ? (
                  <Select value={p.role} onValueChange={(v) => setRole(p.id, v as UserRole)}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="capitalize">{p.role}</Badge>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* notes */}
        <TabsContent value="notes" className="mt-4">
          <NotesSection />
        </TabsContent>

        {/* profile */}
        <TabsContent value="profile" className="mt-4">
          <Card className="card-lux shadow-none">
            <CardHeader>
              <CardTitle className="font-display text-lg font-normal">My profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone (WhatsApp)</Label>
                <Input
                  value={profile.phone} placeholder="+91…"
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div>
                <Button onClick={saveProfile}>Save profile</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EventDialog
        open={eventDialog.open}
        onOpenChange={(open) => setEventDialog({ ...eventDialog, open })}
        event={eventDialog.event}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><SettingsIcon className="size-6 animate-pulse text-muted-foreground" /></div>}>
      <SettingsPageInner />
    </Suspense>
  );
}
