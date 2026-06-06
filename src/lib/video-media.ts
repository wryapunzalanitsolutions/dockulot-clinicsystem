import type { PublicContentPost } from "@/src/lib/services/content-posts";

function safeUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function getYouTubeVideoId(value: string | null | undefined) {
  const url = safeUrl(value);
  if (!url) return null;

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (
    !host.includes("youtube.com") &&
    !host.endsWith("youtube-nocookie.com") &&
    host !== "youtu.be" &&
    !host.endsWith(".youtube.com")
  ) {
    return null;
  }

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id || null;
  }

  const embedMatch = url.pathname.match(/^\/embed\/([^/]+)/);
  if (embedMatch) return embedMatch[1] || null;

  const shortsMatch = url.pathname.match(/^\/shorts\/([^/]+)/);
  if (shortsMatch) return shortsMatch[1] || null;

  const id = url.searchParams.get("v");
  return id || null;
}

export function getYouTubeEmbedUrl(value: string | null | undefined) {
  const id = getYouTubeVideoId(value);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}

export function getYouTubeThumbnailUrl(value: string | null | undefined) {
  const id = getYouTubeVideoId(value);
  if (!id) return null;
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function getPublicVideoThumbnail(post: Pick<PublicContentPost, "thumbnail_url" | "embed_url">) {
  return post.thumbnail_url || getYouTubeThumbnailUrl(post.embed_url);
}

export function getPublicVideoPlaybackUrl(post: Pick<PublicContentPost, "embed_url">) {
  return getYouTubeEmbedUrl(post.embed_url) || post.embed_url;
}
