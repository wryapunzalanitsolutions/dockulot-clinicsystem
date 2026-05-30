import { HttpError, httpError, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const actor = await requireActor(req);
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);

    let query = supabase
      .from("follow_up_inquiries")
      .select("id, patient_id, appointment_id, message, reply, status, replied_by, replied_at, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (actor.profile.role === "patient") {
      query = query.eq("patient_id", actor.id);
    } else if (url.searchParams.get("patient_id")) {
      query = query.eq("patient_id", url.searchParams.get("patient_id"));
    }

    const status = url.searchParams.get("status");
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query.limit(200);
    if (error) throw error;
    return ok({ inquiries: data ?? [] });
  } catch (e) {
    return httpError(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireActor(req);
    const body = await req.json();

    if (!body.message || typeof body.message !== "string") {
      throw new HttpError(400, "A follow-up message is required.");
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("follow_up_inquiries")
      .insert({
        patient_id: actor.id,
        appointment_id: body.appointment_id || null,
        message: body.message.trim(),
        status: "Pending",
      })
      .select()
      .single();

    if (error) throw error;
    return ok({ inquiry: data }, 201);
  } catch (e) {
    return httpError(e);
  }
}
