import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { GUEST_EMAIL } from "@/lib/guest";

/**
 * Scan-to-enter: the wedding QR points here (/g/<token>).
 *
 * The token in the URL is NOT a credential — it's an opaque, revocable
 * handle. The server checks it, then signs the visitor in using the guest
 * password held in a server-only env var, so the real code never appears
 * in a URL, browser history, screenshot or log. Revoking a token kills a
 * printed QR without changing the guest code everyone else uses.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const token = decodeURIComponent(code);
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

  // is this an invite we issued, and is it still active?
  const { data: valid, error: rpcError } = await supabase.rpc("redeem_guest_invite", {
    t: token,
  });
  if (rpcError || valid !== true) return dest("/login?invite=invalid");

  const guestPassword = process.env.GUEST_PORTAL_PASSWORD;
  if (!guestPassword) {
    // misconfigured deploy — fail closed rather than guessing
    console.error("GUEST_PORTAL_PASSWORD is not set; QR sign-in disabled.");
    return dest("/login?invite=unavailable");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: GUEST_EMAIL,
    password: guestPassword,
  });
  if (error) return dest("/login?invite=invalid");

  return response;
}
