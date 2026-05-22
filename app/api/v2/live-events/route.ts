import { HttpError, httpError, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

function canManage(role: string) {
  return role === "super_admin" || role === "admin" || role === "doctor";
}

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("live_events")
      .select("*, content_posts(title, slug)")
      .order("starts_at", { ascending: true });
    if (error) throw error;
    return ok({ events: data ?? [] });
  } catch (e) {
    return httpError(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireActor(req);
    if (!canManage(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const body = await req.json();
    if (!body.title || !body.starts_at) throw new HttpError(400, "title and starts_at required");
    const { data, error } = await getSupabaseAdmin()
      .from("live_events")
      .insert({
        title: body.title,
        description: body.description ?? null,
        starts_at: body.starts_at,
        platform: body.platform ?? null,
        live_url: body.live_url ?? null,
        replay_post_id: body.replay_post_id || null,
        registration_enabled: body.registration_enabled ?? true,
        status: body.status ?? "Upcoming",
      })
      .select()
      .single();
    if (error) throw error;
    return ok({ event: data }, 201);
  } catch (e) {
    return httpError(e);
  }
}
