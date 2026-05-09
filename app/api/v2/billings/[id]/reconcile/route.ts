import { HttpError, httpError, ok, requireActor, isStaff } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";
import type { Payment } from "@/src/lib/db/types";
import { confirmPaymentByRef } from "@/src/lib/services/payment";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const actor = await requireActor(req);
    if (!isStaff(actor.profile.role) && actor.profile.role !== "doctor") {
      throw new HttpError(403, "Only clinic staff or doctors can reconcile POS payments.");
    }

    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data: payment, error } = await supabase
      .from("payments")
      .select("*")
      .eq("billing_id", id)
      .eq("provider", "paymongo")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<Payment>();
    if (error) throw error;
    if (!payment?.provider_ref) {
      throw new HttpError(404, "No PayMongo checkout was found for this billing.");
    }

    const result = await confirmPaymentByRef("paymongo", payment.provider_ref);
    return ok({
      reconciled: true,
      billing_id: id,
      appointment: result.appointment,
      payment: result.payment,
    });
  } catch (e) {
    return httpError(e);
  }
}
