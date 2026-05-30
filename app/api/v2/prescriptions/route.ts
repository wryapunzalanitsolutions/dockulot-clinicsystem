import { HttpError, httpError, isClinicStaff, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

type PrescriptionItemInput = {
  medicine_name?: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
};

export async function GET(req: Request) {
  try {
    const actor = await requireActor(req);
    const supabase = getSupabaseAdmin();
    let q = supabase
      .from("prescriptions")
      .select("*, prescription_items(*), diagnoses(id, diagnosis_text, treatment_plan, follow_up_date, visible_to_patient), patients(profiles(full_name, email)), doctors(profiles(full_name))")
      .order("created_at", { ascending: false });
    if (!isClinicStaff(actor.profile.role)) {
      q = q.eq("patient_id", actor.id).eq("released_to_patient", true);
    }
    const { data, error } = await q.limit(200);
    if (error) throw error;
    return ok({ prescriptions: data ?? [] });
  } catch (e) {
    return httpError(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const body = await req.json();
    if (!body.patient_id || !body.doctor_id) throw new HttpError(400, "patient_id and doctor_id required");
    const supabase = getSupabaseAdmin();
    let diagnosisId: string | null = null;

    const diagnosisText = typeof body.diagnosis_text === "string" ? body.diagnosis_text.trim() : "";
    const treatmentPlan = typeof body.treatment_plan === "string" ? body.treatment_plan.trim() : "";
    const followUpDate = body.follow_up_date || null;
    const releaseToPortal = body.released_to_patient ?? true;

    if (diagnosisText || treatmentPlan || followUpDate) {
      const { data: diagnosis, error: diagnosisError } = await supabase
        .from("diagnoses")
        .insert({
          appointment_id: body.appointment_id || null,
          patient_id: body.patient_id,
          doctor_id: body.doctor_id,
          diagnosis_text: diagnosisText || "Diagnosis recorded in prescription module",
          treatment_plan: treatmentPlan || null,
          follow_up_date: followUpDate,
          visible_to_patient: releaseToPortal,
        })
        .select("id")
        .single<{ id: string }>();
      if (diagnosisError) throw diagnosisError;
      diagnosisId = diagnosis.id;
    }

    const { data: prescription, error } = await supabase
      .from("prescriptions")
      .insert({
        appointment_id: body.appointment_id || null,
        patient_id: body.patient_id,
        doctor_id: body.doctor_id,
        diagnosis_id: diagnosisId ?? body.diagnosis_id ?? null,
        general_instructions: body.general_instructions ?? treatmentPlan ?? null,
        follow_up_date: followUpDate,
        released_to_patient: releaseToPortal,
      })
      .select()
      .single();
    if (error) throw error;

    const items: PrescriptionItemInput[] = Array.isArray(body.items) ? body.items : [];
    if (items.length) {
      const { error: itemsError } = await supabase.from("prescription_items").insert(
        items
          .filter((item) => item.medicine_name)
          .map((item, index) => ({
            prescription_id: prescription.id,
            medicine_name: item.medicine_name,
            dosage: item.dosage ?? null,
            frequency: item.frequency ?? null,
            duration: item.duration ?? null,
            instructions: item.instructions ?? null,
            sort_order: index,
          })),
      );
      if (itemsError) throw itemsError;
    }

    return ok({ prescription }, 201);
  } catch (e) {
    return httpError(e);
  }
}
