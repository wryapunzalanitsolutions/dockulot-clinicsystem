export type BlogBlockType =
  | "paragraph"
  | "h2"
  | "h3"
  | "blockquote"
  | "ul"
  | "ol"
  | "image"
  | "embed"
  | "divider"
  | "cta"
  | "faq";

export type BlogBlock = {
  type: BlogBlockType;
  text?: string;
  url?: string;
  alt?: string;
  items?: string[];
  question?: string;
  answer?: string;
  buttonText?: string;
  buttonLink?: string;
};

const allowedTypes = new Set<BlogBlockType>([
  "paragraph",
  "h2",
  "h3",
  "blockquote",
  "ul",
  "ol",
  "image",
  "embed",
  "divider",
  "cta",
  "faq",
]);

export function parseBlocks(body: string | null | undefined): BlogBlock[] | null {
  if (!body) return null;

  try {
    const parsed = JSON.parse(body);
    if (!Array.isArray(parsed)) return null;
    return sanitizeBlocks(parsed);
  } catch {
    return null;
  }
}

export function sanitizeBlocks(blocks: unknown[]): BlogBlock[] {
  const sanitized: BlogBlock[] = [];

  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;

    const candidate = block as Record<string, unknown>;
    const type = candidate.type;
    if (typeof type !== "string" || !allowedTypes.has(type as BlogBlockType)) continue;

    if (type === "paragraph" || type === "h2" || type === "h3" || type === "blockquote") {
      const text = String(candidate.text ?? "").trim();
      if (text) sanitized.push({ type, text });
      continue;
    }

    if (type === "image") {
      const url = String(candidate.url ?? "").trim();
      if (url) {
        sanitized.push({
          type,
          url,
          alt: String(candidate.alt ?? "").trim(),
        });
      }
      continue;
    }

    if (type === "embed") {
      const url = String(candidate.url ?? "").trim();
      if (url) sanitized.push({ type, url });
      continue;
    }

    if (type === "ul" || type === "ol") {
      const items = Array.isArray(candidate.items)
        ? candidate.items.map((item) => String(item).trim()).filter(Boolean)
        : [];
      if (items.length) sanitized.push({ type, items });
      continue;
    }

    if (type === "cta") {
      const buttonText = String(candidate.buttonText ?? "").trim();
      const buttonLink = String(candidate.buttonLink ?? "").trim();
      if (buttonText && buttonLink) sanitized.push({ type, buttonText, buttonLink });
      continue;
    }

    if (type === "faq") {
      const question = String(candidate.question ?? "").trim();
      const answer = String(candidate.answer ?? "").trim();
      if (question && answer) sanitized.push({ type, question, answer });
      continue;
    }

    if (type === "divider") {
      sanitized.push({ type });
    }
  }

  return sanitized;
}

export function serializeBlocks(blocks: unknown[]): string | null {
  const sanitized = sanitizeBlocks(blocks);
  if (!sanitized.length) return null;
  return JSON.stringify(sanitized);
}

export function deriveExcerptFromBlocks(blocks: BlogBlock[]): string {
  const paragraph = blocks.find((block) => block.type === "paragraph" && block.text?.trim());
  return paragraph?.text?.trim().slice(0, 200) ?? "";
}
