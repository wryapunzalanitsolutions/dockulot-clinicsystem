import { HttpError, httpError, isClinicStaff, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

type PrescriptionItemInput = {
  medicine_name?: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
};

export async function PATCH(req: Request, ctx: RouteContext<"/api/v2/prescriptions/[id]">) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const { id } = await ctx.params;
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    for (const key of ["general_instructions", "follow_up_date", "pdf_url"] as const) {
      if (key in body) patch[key] = body[key] || null;
    }
    if ("released_to_patient" in body) patch.released_to_patient = Boolean(body.released_to_patient);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("prescriptions").update(patch).eq("id", id).select().single();
    if (error) throw error;
    if (Array.isArray(body.items)) {
      const { error: deleteError } = await supabase.from("prescription_items").delete().eq("prescription_id", id);
      if (deleteError) throw deleteError;
      const nextItems = (body.items as PrescriptionItemInput[]).filter((item) => item.medicine_name);
      if (nextItems.length) {
        const { error: insertError } = await supabase.from("prescription_items").insert(
          nextItems.map((item, index) => ({
            prescription_id: id,
            medicine_name: item.medicine_name,
            dosage: item.dosage ?? null,
            frequency: item.frequency ?? null,
            duration: item.duration ?? null,
            instructions: item.instructions ?? null,
            sort_order: index,
          })),
        );
        if (insertError) throw insertError;
      }
    }
    return ok({ prescription: data });
  } catch (e) {
    return httpError(e);
  }
}
