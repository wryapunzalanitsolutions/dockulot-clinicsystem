import { HttpError, httpError, isClinicStaff, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const { data, error } = await getSupabaseAdmin().from("suppliers").select("*").order("name");
    if (error) throw error;
    return ok({ suppliers: data ?? [] });
  } catch (e) {
    return httpError(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const body = await req.json();
    if (!body.name) throw new HttpError(400, "name required");
    const { data, error } = await getSupabaseAdmin()
      .from("suppliers")
      .insert({
        name: body.name,
        contact_person: body.contact_person ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        address: body.address ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return ok({ supplier: data }, 201);
  } catch (e) {
    return httpError(e);
  }
}
