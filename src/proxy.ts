import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isGuestPath } from "@/lib/guest";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/admin");
  const isLogoutRoute = path === "/logout" || path.startsWith("/logout/");

  // Always allow logout to run (guests would otherwise be bounced to /welcome)
  if (isLogoutRoute) {
    return response;
  }

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Role comes from the JWT's app_metadata (kept in sync with public.profiles
  // by a DB trigger). app_metadata is service-role-only, so it stays
  // trustworthy — and reading it here avoids a profiles query on EVERY
  // navigation, which was roughly half the per-click latency.
  // Falls back to the DB if the claim isn't present yet (older sessions).
  async function resolveRole(): Promise<string | undefined> {
    const claim = user?.app_metadata?.role;
    if (typeof claim === "string") return claim;
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .maybeSingle();
    return data?.role;
  }

  if (user && isAuthRoute) {
    const role = await resolveRole();
    const url = request.nextUrl.clone();
    url.pathname = role === "guest" ? "/welcome" : "/";
    return NextResponse.redirect(url);
  }

  if (user && !isAuthRoute) {
    const isGuest = (await resolveRole()) === "guest";
    const onGuest = isGuestPath(path);

    if (isGuest && !onGuest) {
      const url = request.nextUrl.clone();
      url.pathname = "/welcome";
      return NextResponse.redirect(url);
    }
    if (!isGuest && onGuest) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
