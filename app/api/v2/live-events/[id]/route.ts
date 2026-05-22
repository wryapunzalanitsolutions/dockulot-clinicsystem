import { HttpError, httpError, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

function canManage(role: string) {
  return role === "super_admin" || role === "admin" || role === "doctor";
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/v2/live-events/[id]">) {
  try {
    const actor = await requireActor(req);
    if (!canManage(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const { id } = await ctx.params;
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    for (const key of ["title", "description", "starts_at", "platform", "live_url", "status"] as const) {
      if (key in body) patch[key] = body[key] || null;
    }
    if ("replay_post_id" in body) patch.replay_post_id = body.replay_post_id || null;
    if ("registration_enabled" in body) patch.registration_enabled = Boolean(body.registration_enabled);
    const { data, error } = await getSupabaseAdmin().from("live_events").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return ok({ event: data });
  } catch (e) {
    return httpError(e);
  }
}
