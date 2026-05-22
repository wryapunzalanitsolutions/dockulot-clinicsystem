import { HttpError, httpError, isClinicStaff, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    let q = getSupabaseAdmin().from("inquiries").select("*").order("created_at", { ascending: false });
    if (status && status !== "all") q = q.eq("status", status);
    const { data, error } = await q.limit(200);
    if (error) throw error;
    return ok({ inquiries: data ?? [] });
  } catch (e) {
    return httpError(e);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.message) throw new HttpError(400, "name and message required");
    const { data, error } = await getSupabaseAdmin()
      .from("inquiries")
      .insert({
        name: body.name,
        email: body.email ?? null,
        phone: body.phone ?? null,
        inquiry_type: body.inquiry_type ?? "General",
        message: body.message,
      })
      .select()
      .single();
    if (error) throw error;
    return ok({ inquiry: data }, 201);
  } catch (e) {
    return httpError(e);
  }
}
