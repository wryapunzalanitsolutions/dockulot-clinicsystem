import { NextResponse } from "next/server";
import { HttpError } from "@/src/lib/http";
import { assertTrustedOrigin, enforceRateLimit } from "@/src/lib/security";
import { sendContactEmail } from "@/src/lib/services/emailjs";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

const VALID_INQUIRY_TYPES = new Set([
  "Ask about appointment",
  "Ask about services",
  "Ask about consultation",
  "Ask about vlog/content collaboration",
  "Ask general questions",
]);

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  try {
    assertTrustedOrigin(req);
    enforceRateLimit(req, "contact", 5, 60_000);

    const body = await req.json();
    const { name, email, phone, inquiry_type, message } = body || {};

    if (!name || !email || !message) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      !isValidEmail(email)
    ) {
      return NextResponse.json({ message: "Please provide a valid name, email, and message." }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();
    const cleanInquiryType = typeof inquiry_type === "string" && VALID_INQUIRY_TYPES.has(inquiry_type.trim())
      ? inquiry_type.trim()
      : "Ask general questions";

    const supabase = getSupabaseAdmin();
    const { error: inquiryError } = await supabase.from("inquiries").insert({
      name: cleanName,
      email: cleanEmail,
      phone: typeof phone === "string" ? phone.trim() || null : null,
      inquiry_type: cleanInquiryType,
      message: cleanMessage,
    });
    if (inquiryError) throw inquiryError;

    try {
      await sendContactEmail({
        name: cleanName,
        email: cleanEmail,
        inquiryType: cleanInquiryType,
        message: cleanMessage,
      });
    } catch (emailError) {
      console.warn("[contact] inquiry saved but email delivery failed", emailError);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
