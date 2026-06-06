import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { dbRoleToUiRole } from "@/src/lib/auth/role-mappings";
import { canAccessPath } from "@/src/lib/roles";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/users",
  "/appointments",
  "/payments",
  "/patients",
  "/consultations",
  "/schedules",
  "/reports",
  "/help",
  "/pricing",
  "/inventory",
  "/inquiries",
  "/faq-content",
  "/prescriptions",
  "/contents",
  "/creator-content",
  "/settings",
  "/security",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user?.email_confirmed_at) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle<{ role: string; is_active: boolean }>();

  if (!profile?.is_active) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("message", "This account is inactive. Contact the clinic administrator.");
    return NextResponse.redirect(loginUrl);
  }

  const uiRole = dbRoleToUiRole(profile.role) ?? "PATIENT";
  if (!canAccessPath(uiRole, pathname)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/users/:path*",
    "/appointments/:path*",
    "/payments/:path*",
    "/patients/:path*",
    "/consultations/:path*",
    "/schedules/:path*",
    "/reports/:path*",
    "/help/:path*",
    "/pricing/:path*",
    "/inventory/:path*",
    "/inquiries/:path*",
    "/faq-content/:path*",
    "/prescriptions/:path*",
    "/contents/:path*",
    "/creator-content/:path*",
    "/settings/:path*",
    "/security/:path*",
  ],
};
