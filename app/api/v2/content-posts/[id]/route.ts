import { HttpError, httpError, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";
import {
  deriveExcerptFromBlocks,
  parseBlocks,
  serializeBlocks,
} from "@/src/lib/content-post-blocks";

function canManage(role: string) {
  return role === "super_admin" || role === "admin" || role === "doctor";
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/v2/content-posts/[id]">) {
  try {
    const actor = await requireActor(req);
    if (!canManage(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const { id } = await ctx.params;
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    for (const key of ["title", "slug", "content_type", "category", "excerpt", "embed_url", "thumbnail_url", "status"] as const) {
      if (key in body) patch[key] = body[key] || null;
    }
    if ("body" in body) patch.body = body.body || null;
    if (Array.isArray(body.blocks)) {
      patch.body = serializeBlocks(body.blocks) ?? body.body ?? null;
      const parsedBlocks = parseBlocks(typeof patch.body === "string" ? patch.body : null);
      if (!patch.excerpt && parsedBlocks?.length) patch.excerpt = deriveExcerptFromBlocks(parsedBlocks);
    }
    if ("is_featured" in body) patch.is_featured = Boolean(body.is_featured);
    if (body.status === "Published") patch.published_at = new Date().toISOString();
    const { data, error } = await getSupabaseAdmin().from("content_posts").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return ok({ post: data });
  } catch (e) {
    return httpError(e);
  }
}

export async function GET(req: Request, ctx: RouteContext<"/api/v2/content-posts/[id]">) {
  try {
    const actor = await requireActor(req);
    if (!canManage(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const { id } = await ctx.params;
    const { data, error } = await getSupabaseAdmin().from("content_posts").select("*").eq("id", id).single();
    if (error) throw error;
    return ok({ post: data });
  } catch (e) {
    return httpError(e);
  }
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/v2/content-posts/[id]">) {
  try {
    const actor = await requireActor(req);
    if (!canManage(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const { id } = await ctx.params;
    const { error } = await getSupabaseAdmin().from("content_posts").delete().eq("id", id);
    if (error) throw error;
    return ok({ ok: true });
  } catch (e) {
    return httpError(e);
  }
}
