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

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);
    const publishedOnly = url.searchParams.get("published") === "true";
    let q = supabase.from("content_posts").select("*").order("created_at", { ascending: false });
    if (publishedOnly) q = q.eq("status", "Published");
    const { data, error } = await q.limit(200);
    if (error) throw error;
    return ok({ posts: data ?? [] });
  } catch (e) {
    return httpError(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireActor(req);
    if (!canManage(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const body = await req.json();
    if (!body.title || !body.slug || !body.content_type || !body.category) {
      throw new HttpError(400, "title, slug, content_type, category required");
    }
    let bodyText = body.body ?? null;
    if (Array.isArray(body.blocks)) {
      bodyText = serializeBlocks(body.blocks) ?? body.body ?? null;
      const parsedBlocks = parseBlocks(bodyText);
      if (!body.excerpt && parsedBlocks?.length) body.excerpt = deriveExcerptFromBlocks(parsedBlocks);
    }
    const { data, error } = await getSupabaseAdmin()
      .from("content_posts")
      .insert({
        author_id: actor.id,
        title: body.title,
        slug: body.slug,
        content_type: body.content_type,
        category: body.category,
        excerpt: body.excerpt ?? null,
        body: bodyText ?? null,
        embed_url: body.embed_url ?? null,
        thumbnail_url: body.thumbnail_url ?? null,
        is_featured: body.is_featured ?? false,
        status: body.status ?? "Draft",
        published_at: body.status === "Published" ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (error) throw error;
    return ok({ post: data }, 201);
  } catch (e) {
    return httpError(e);
  }
}
