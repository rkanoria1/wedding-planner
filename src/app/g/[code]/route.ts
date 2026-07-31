import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { GUEST_EMAIL } from "@/lib/guest";

/**
 * Scan-to-enter: the wedding QR code points here (/g/<guest-code>).
 * We sign the visitor into the shared guest account server-side and drop
 * them straight on /welcome — no typing, no login screen.
 *
 * Anyone holding the link gets guest access by design; the guest account
 * only ever sees celebration content (timeline, lookbook, blessings,
 * moments) and RLS keeps all planning data out of reach.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const dest = (path: string) => NextResponse.redirect(new URL(path, request.url));

  let response = dest("/welcome");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = dest("/welcome");
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // a planner already signed in shouldn't be downgraded to a guest session
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && user.app_metadata?.role !== "guest") {
    return dest("/");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: GUEST_EMAIL,
    password: decodeURIComponent(code),
  });

  // bad/rotated QR → fall back to the normal login screen
  if (error) return dest("/login?invite=invalid");

  return response;
}
