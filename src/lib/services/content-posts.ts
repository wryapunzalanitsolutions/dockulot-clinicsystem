import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";
import {
  deriveExcerptFromBlocks,
  parseBlocks,
  type BlogBlock,
} from "@/src/lib/content-post-blocks";
import { samplePosts } from "@/src/data/samplePosts";

export type PublicContentPost = {
  id: string;
  title: string;
  slug: string;
  content_type: "Blog" | "HealthTip" | "Video" | "Announcement" | "LiveReplay" | string;
  category: string;
  excerpt: string | null;
  body: string | null;
  blocks?: BlogBlock[] | null;
  embed_url: string | null;
  thumbnail_url: string | null;
  is_featured: boolean;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type PublishedPostOptions = {
  limit?: number;
  contentTypes?: string[];
};

function deriveExcerpt(post: Pick<PublicContentPost, "excerpt" | "body">) {
  const excerpt = post.excerpt?.trim();
  if (excerpt) return excerpt;
  const blocks = parseBlocks(post.body);
  if (blocks?.length) return deriveExcerptFromBlocks(blocks);
  const body = post.body?.trim();
  if (!body) return "";
  return body.length > 160 ? `${body.slice(0, 157).trimEnd()}...` : body;
}

function normalizePost(post: PublicContentPost): PublicContentPost {
  return {
    ...post,
    excerpt: deriveExcerpt(post),
    blocks: parseBlocks(post.body),
  };
}

export async function getPublishedContentPosts(limit = 6): Promise<PublicContentPost[]> {
  return getPublishedPosts({ limit, contentTypes: ["Blog", "HealthTip"] });
}

export async function getPublishedMediaPosts(limit = 6): Promise<PublicContentPost[]> {
  return getPublishedPosts({ limit, contentTypes: ["Video", "Announcement", "LiveReplay"] });
}

export async function getPublishedPostsByTypes(contentTypes: string[], limit = 6): Promise<PublicContentPost[]> {
  return getPublishedPosts({ limit, contentTypes });
}

async function getPublishedPosts({ limit = 6, contentTypes }: PublishedPostOptions): Promise<PublicContentPost[]> {
  noStore();

  let query = getSupabaseAdmin()
    .from("content_posts")
    .select("*")
    .eq("status", "Published");

  if (contentTypes?.length) {
    query = query.in("content_type", contentTypes);
  }

  const { data, error } = await query
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const normalized = (data ?? []).map((post) => normalizePost(post as PublicContentPost));
  if (normalized.length) return normalized;

  if (!contentTypes || contentTypes.every((type) => type === "Blog" || type === "HealthTip")) {
    return samplePosts.slice(0, limit);
  }

  return [];
}

export async function getPublishedContentPostBySlug(slug: string): Promise<PublicContentPost | null> {
  noStore();

  const { data, error } = await getSupabaseAdmin()
    .from("content_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "Published")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    return samplePosts.find((post) => post.slug === slug) ?? null;
  }

  return normalizePost(data as PublicContentPost);
}

export function getContentPostReadingTime(post: Pick<PublicContentPost, "excerpt" | "body">) {
  const text = `${post.excerpt ?? ""} ${post.body ?? ""}`.trim();
  if (!text) return 1;

  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

