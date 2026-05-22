import { HttpError, httpError, isClinicStaff, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

export async function PATCH(req: Request, ctx: RouteContext<"/api/v2/faqs/[id]">) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const { id } = await ctx.params;
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    for (const key of ["category", "question", "answer"] as const) if (key in body) patch[key] = body[key];
    if ("sort_order" in body) patch.sort_order = Number(body.sort_order ?? 0);
    if ("is_published" in body) patch.is_published = Boolean(body.is_published);
    const { data, error } = await getSupabaseAdmin().from("faqs").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return ok({ faq: data });
  } catch (e) {
    return httpError(e);
  }
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/v2/faqs/[id]">) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const { id } = await ctx.params;
    const { error } = await getSupabaseAdmin().from("faqs").delete().eq("id", id);
    if (error) throw error;
    return ok({ ok: true });
  } catch (e) {
    return httpError(e);
  }
}
