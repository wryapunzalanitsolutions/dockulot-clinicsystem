import { getSupabaseAdmin } from "@/src/lib/supabase/server";

type AnalyticsMetadata = Record<string, unknown>;

export type AnalyticsEventInput = {
  eventName: string;
  path?: string | null;
  contentPostId?: string | null;
  serviceId?: string | null;
  metadata?: AnalyticsMetadata;
};

const CONTENT_VIEW_EVENTS = new Set(["content_view", "video_open"]);

function sanitizeText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length ? normalized : null;
}

export async function trackAnalyticsEvent(input: AnalyticsEventInput) {
  const supabase = getSupabaseAdmin();

  const payload = {
    event_name: input.eventName.trim(),
    path: sanitizeText(input.path),
    content_post_id: sanitizeText(input.contentPostId),
    service_id: sanitizeText(input.serviceId),
    metadata: input.metadata ?? {},
  };

  const { error } = await supabase.from("website_analytics").insert(payload);
  if (error) throw error;

  if (payload.content_post_id && CONTENT_VIEW_EVENTS.has(payload.event_name)) {
    const { data, error: readError } = await supabase
      .from("content_posts")
      .select("view_count")
      .eq("id", payload.content_post_id)
      .maybeSingle<{ view_count: number }>();
    if (readError) throw readError;

    const { error: updateError } = await supabase
      .from("content_posts")
      .update({ view_count: Number(data?.view_count ?? 0) + 1 })
      .eq("id", payload.content_post_id);
    if (updateError) throw updateError;
  }

  if (payload.content_post_id && payload.event_name === "appointment_click") {
    const { data, error: readError } = await supabase
      .from("content_posts")
      .select("appointment_click_count")
      .eq("id", payload.content_post_id)
      .maybeSingle<{ appointment_click_count: number }>();
    if (readError) throw readError;

    const { error: updateError } = await supabase
      .from("content_posts")
      .update({ appointment_click_count: Number(data?.appointment_click_count ?? 0) + 1 })
      .eq("id", payload.content_post_id);
    if (updateError) throw updateError;
  }
}
