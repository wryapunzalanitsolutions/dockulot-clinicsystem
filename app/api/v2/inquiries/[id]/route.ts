import { HttpError, httpError, isClinicStaff, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

export async function PATCH(req: Request, ctx: RouteContext<"/api/v2/inquiries/[id]">) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const { id } = await ctx.params;
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    if ("status" in body) patch.status = body.status;
    if ("reply" in body) {
      patch.reply = body.reply;
      patch.replied_by = actor.id;
      patch.replied_at = new Date().toISOString();
      if (!body.status) patch.status = "Replied";
    }
    if ("converted_appointment_id" in body) patch.converted_appointment_id = body.converted_appointment_id || null;
    const { data, error } = await getSupabaseAdmin()
      .from("inquiries")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return ok({ inquiry: data });
  } catch (e) {
    return httpError(e);
  }
}
