import { NextResponse } from "next/server";
import { createClient, type EmailOtpType } from "@supabase/supabase-js";
import { enqueueNotification } from "@/src/lib/services/notification";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const verified = requestUrl.searchParams.get("verified");
  const next = requestUrl.searchParams.get("next") ?? "/login";
  const redirectUrl = new URL(next, requestUrl.origin);
  const recoveryRedirectUrl = new URL("/auth/reset", requestUrl.origin);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    redirectUrl.searchParams.set(
      "message",
      "Supabase auth configuration is missing.",
    );
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  let error: Error | null = null;
  let verifiedUserId: string | null = null;

  if (type === "recovery" && code) {
    recoveryRedirectUrl.searchParams.set("code", code);
    return NextResponse.redirect(recoveryRedirectUrl);
  }

  if (type === "recovery" && tokenHash) {
    recoveryRedirectUrl.searchParams.set("token_hash", tokenHash);
    recoveryRedirectUrl.searchParams.set("type", type);
    return NextResponse.redirect(recoveryRedirectUrl);
  }

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
    verifiedUserId = result.data.user?.id ?? null;
  } else if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    error = result.error;
    verifiedUserId = result.data.user?.id ?? null;
  } else if (verified === "1") {
    redirectUrl.searchParams.set("message", "Email verified. You can now sign in.");
    return NextResponse.redirect(redirectUrl);
  } else {
    redirectUrl.searchParams.set(
      "message",
      "This verification link is invalid, expired, or already used. If you can already sign in, your email is likely verified.",
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (error) {
    redirectUrl.searchParams.set(
      "message",
      "This verification link is invalid, expired, or already used. If you can already sign in, your email is likely verified.",
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (verifiedUserId) {
    try {
      await enqueueNotification({
        user_id: verifiedUserId,
        template: "welcome",
        channels: ["email", "sms"],
        payload: {},
      });
    } catch (notificationError) {
      console.error("[auth-confirm] failed to queue welcome notification", notificationError);
    }
  }

  redirectUrl.searchParams.set("message", "Email verified. You can now sign in.");
  return NextResponse.redirect(redirectUrl);
}
