import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

export type PublicLiveEvent = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  platform: string | null;
  live_url: string | null;
  replay_post_id: string | null;
  registration_enabled: boolean;
  status: "Upcoming" | "Live" | "Completed" | "Cancelled" | string;
  content_posts?: {
    title: string;
    slug: string;
  } | null;
  created_at: string;
  updated_at: string;
};

export async function getPublicLiveEvents(
  limit = 6,
  statuses: string[] = ["Upcoming", "Live", "Completed"],
): Promise<PublicLiveEvent[]> {
  noStore();

  let query = getSupabaseAdmin()
    .from("live_events")
    .select("*, content_posts(title, slug)")
    .order("starts_at", { ascending: true });

  if (statuses.length) {
    query = query.in("status", statuses);
  }

  const { data, error } = await query.limit(limit);
  if (error) throw error;

  return (data ?? []) as PublicLiveEvent[];
}
