import { HttpError, httpError, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

export async function PATCH(req: Request, ctx: RouteContext<"/api/v2/follow-up-inquiries/[id]">) {
  try {
    const actor = await requireActor(req);
    if (actor.profile.role === "patient") {
      throw new HttpError(403, "Forbidden");
    }

    const { id } = await ctx.params;
    const body = await req.json();
    const patch: Record<string, unknown> = {};

    if ("status" in body) patch.status = body.status;
    if ("reply" in body) {
      patch.reply = body.reply || null;
      patch.replied_by = actor.id;
      patch.replied_at = body.reply ? new Date().toISOString() : null;
      if (!body.status && body.reply) patch.status = "Replied";
    }

    const { data, error } = await getSupabaseAdmin()
      .from("follow_up_inquiries")
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
