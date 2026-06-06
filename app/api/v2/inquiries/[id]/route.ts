import { HttpError, httpError, isClinicStaff, ok, requireActor } from "@/src/lib/http";
import { sendInquiryReplyEmail } from "@/src/lib/services/emailjs";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

export async function PATCH(req: Request, ctx: RouteContext<"/api/v2/inquiries/[id]">) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const { id } = await ctx.params;
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    const allowedStatuses = new Set(["Pending", "Replied", "Closed"]);

    if ("status" in body) {
      if (typeof body.status !== "string" || !allowedStatuses.has(body.status)) {
        throw new HttpError(400, "Invalid inquiry status");
      }
      patch.status = body.status;
    }
    if ("reply" in body) {
      patch.reply = typeof body.reply === "string" && body.reply.trim() ? body.reply.trim() : null;
      patch.replied_by = actor.id;
      patch.replied_at = patch.reply ? new Date().toISOString() : null;
      if (!body.status && patch.reply) patch.status = "Replied";
      if (patch.reply && patch.status !== "Closed") patch.status = "Replied";
    }
    if ("converted_appointment_id" in body) patch.converted_appointment_id = body.converted_appointment_id || null;
    const { data, error } = await getSupabaseAdmin()
      .from("inquiries")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    if (typeof data?.reply === "string" && data.reply.trim() && typeof data?.email === "string" && data.email.trim()) {
      try {
        await sendInquiryReplyEmail({
          name: data.name ?? "Patient",
          email: data.email,
          inquiryType: data.inquiry_type ?? "General inquiry",
          originalMessage: data.message ?? "",
          reply: data.reply,
          repliedAt: data.replied_at ?? undefined,
        });
      } catch (emailError) {
        console.error("[inquiries] failed to send reply email", emailError);
      }
    }

    return ok({ inquiry: data });
  } catch (e) {
    return httpError(e);
  }
}
