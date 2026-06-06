import { HttpError, httpError, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";
import { assertTrustedOrigin, enforceRateLimit } from "@/src/lib/security";
import { logActivity } from "@/src/lib/services/activity-log";

export async function GET(req: Request) {
  try {
    assertTrustedOrigin(req);
    enforceRateLimit(req, "activity-logs", 60, 60_000);
    const actor = await requireActor(req);
    if (actor.profile.role !== "super_admin" && actor.profile.role !== "admin" && actor.profile.role !== "doctor") {
      throw new HttpError(403, "Forbidden");
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("activity_logs")
      .select("id, actor_id, action, entity_table, entity_id, metadata, created_at, profiles(full_name, email, role)")
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) throw error;

    await logActivity({ actor, action: "activity_logs.view", entity_table: "activity_logs" });
    const response = ok({ logs: data ?? [] });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (e) {
    return httpError(e);
  }
}
