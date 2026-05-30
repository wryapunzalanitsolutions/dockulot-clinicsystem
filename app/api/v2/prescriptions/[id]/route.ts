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
    const { data: current, error: currentError } = await supabase
      .from("prescriptions")
      .select("id, patient_id, doctor_id, appointment_id, diagnosis_id")
      .eq("id", id)
      .single<{
        id: string;
        patient_id: string;
        doctor_id: string;
        appointment_id: string | null;
        diagnosis_id: string | null;
      }>();
    if (currentError) throw currentError;

    let diagnosisId = current.diagnosis_id;
    const diagnosisText = typeof body.diagnosis_text === "string" ? body.diagnosis_text.trim() : undefined;
    const treatmentPlan = typeof body.treatment_plan === "string" ? body.treatment_plan.trim() : undefined;
    const nextFollowUpDate =
      "follow_up_date" in body ? (body.follow_up_date || null) : undefined;
    const nextVisibleToPatient =
      "released_to_patient" in body ? Boolean(body.released_to_patient) : undefined;

    const shouldTouchDiagnosis =
      diagnosisText !== undefined
      || treatmentPlan !== undefined
      || nextFollowUpDate !== undefined
      || (nextVisibleToPatient !== undefined && Boolean(current.diagnosis_id));

    if (shouldTouchDiagnosis) {
      const diagnosisPatch = {
        appointment_id: current.appointment_id,
        patient_id: current.patient_id,
        doctor_id: current.doctor_id,
        diagnosis_text: diagnosisText || "Diagnosis recorded in prescription module",
        treatment_plan: treatmentPlan ?? null,
        follow_up_date: nextFollowUpDate ?? null,
        visible_to_patient: nextVisibleToPatient ?? true,
      };

      if (current.diagnosis_id) {
        const { error: diagnosisError } = await supabase
          .from("diagnoses")
          .update(diagnosisPatch)
          .eq("id", current.diagnosis_id);
        if (diagnosisError) throw diagnosisError;
      } else {
        const { data: diagnosis, error: diagnosisError } = await supabase
          .from("diagnoses")
          .insert(diagnosisPatch)
          .select("id")
          .single<{ id: string }>();
        if (diagnosisError) throw diagnosisError;
        diagnosisId = diagnosis.id;
        patch.diagnosis_id = diagnosis.id;
      }
    }

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
