import { HttpError, httpError, requireActor } from "@/src/lib/http";
import { createSimplePdf } from "@/src/lib/pdf";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

type PrescriptionRow = {
  id: string;
  prescription_no: string;
  patient_id: string;
  doctor_id: string;
  general_instructions: string | null;
  follow_up_date: string | null;
  released_to_patient: boolean;
  created_at: string;
  diagnoses?: {
    diagnosis_text?: string | null;
    treatment_plan?: string | null;
    follow_up_date?: string | null;
  } | null;
  prescription_items?: Array<{
    medicine_name: string;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
    instructions: string | null;
  }>;
  patients?: { profiles?: { full_name?: string | null } | null } | null;
  doctors?: { profiles?: { full_name?: string | null } | null } | null;
};

export async function GET(req: Request, { params }: Ctx) {
  try {
    const actor = await requireActor(req);
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("prescriptions")
      .select("*, diagnoses(diagnosis_text, treatment_plan, follow_up_date), prescription_items(*), patients(profiles(full_name)), doctors(profiles(full_name))")
      .eq("id", id)
      .maybeSingle<PrescriptionRow>();
    if (error) throw error;
    if (!data) throw new HttpError(404, "Prescription not found.");

    if (actor.profile.role === "patient") {
      if (data.patient_id !== actor.id || !data.released_to_patient) {
        throw new HttpError(403, "Forbidden");
      }
    }

    const lines = [
      "Doctora Kulot Clinic",
      `Prescription No: ${data.prescription_no}`,
      `Patient: ${data.patients?.profiles?.full_name ?? "Patient"}`,
      `Doctor: ${data.doctors?.profiles?.full_name ?? "Doctor"}`,
      `Created: ${new Date(data.created_at).toLocaleDateString("en-US")}`,
      data.diagnoses?.diagnosis_text ? `Diagnosis: ${data.diagnoses.diagnosis_text}` : "Diagnosis: Not set",
      data.diagnoses?.treatment_plan ? `Treatment Plan: ${data.diagnoses.treatment_plan}` : "Treatment Plan: Not set",
      data.follow_up_date ? `Follow-up: ${data.follow_up_date}` : "Follow-up: Not set",
      " ",
      "Medicines",
      ...(data.prescription_items ?? []).flatMap((item, index) => {
        const details = [item.dosage, item.frequency, item.duration].filter(Boolean).join(" | ");
        const result = [`${index + 1}. ${item.medicine_name}`];
        if (details) result.push(`   ${details}`);
        if (item.instructions) result.push(`   ${item.instructions}`);
        return result;
      }),
      " ",
      "General Instructions",
      data.general_instructions ?? "No general instructions provided.",
    ];

    const pdf = createSimplePdf(lines);
    return new Response(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${data.prescription_no}.pdf"`,
      },
    });
  } catch (e) {
    return httpError(e);
  }
}
