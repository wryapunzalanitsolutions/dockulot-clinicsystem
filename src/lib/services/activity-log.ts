import type { Actor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

type ActivityLogInput = {
  actor?: Actor | null;
  action: string;
  entity_table?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logActivity({
  actor,
  action,
  entity_table = null,
  entity_id = null,
  metadata = {},
}: ActivityLogInput) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("activity_logs").insert({
    actor_id: actor?.id ?? null,
    action,
    entity_table,
    entity_id,
    metadata,
  });

  if (error) {
    console.error("[activity_log]", error);
  }
}
