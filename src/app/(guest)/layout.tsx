import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WeddingDataProvider } from "@/lib/data-context";
import { GuestShell } from "@/components/guest/guest-shell";

export default async function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "guest") redirect("/");

  return (
    <WeddingDataProvider>
      <GuestShell>{children}</GuestShell>
    </WeddingDataProvider>
  );
}
