import { getSupabaseAdmin } from "@/src/lib/supabase/server";
import { HttpError, httpError, ok, requireActor, isStaff } from "@/src/lib/http";
import { confirmPaymentByRef } from "@/src/lib/services/payment";
import type { OnlineBookingReservation } from "@/src/lib/db/types";

/**
 * POST /api/v2/payments/reconcile
 *
 * Manually finalize an online-consultation reservation whose PayMongo webhook
 * never reached us (or arrived but errored). Idempotent — if the reservation
 * is already converted, this is a no-op.
 *
 * Auth:
 *   - Staff (admin, secretary, super_admin) → any reservation
 *   - Patient                                → only their own reservation
 *
 * This is what the booking-success page calls automatically when the patient
 * lands back from PayMongo, so the booking finalizes even if the webhook was
 * never delivered (e.g. when running locally with no public tunnel).
 *
 * Body: one of
 *   { "reservation_id": "<uuid>" }    — preferred
 *   { "payment_ref":   "cs_xxx..." }  — when you only have the PayMongo session id
 *
 * Returns: { appointment, payment } once finalized.
 */
type ReconcileBody = {
  reservation_id?: string;
  payment_ref?: string;
};

export async function POST(req: Request) {
  try {
    const actor = await requireActor(req);
    const body = (await req.json().catch(() => ({}))) as ReconcileBody;

    const supabase = getSupabaseAdmin();

    // Resolve the reservation by either id or payment_ref.
    let reservation: OnlineBookingReservation | null = null;
    if (body.reservation_id) {
      const { data, error } = await supabase
        .from("online_booking_reservations")
        .select("*")
        .eq("id", body.reservation_id)
        .maybeSingle<OnlineBookingReservation>();
      if (error) throw error;
      reservation = data;
    } else if (body.payment_ref) {
      const { data, error } = await supabase
        .from("online_booking_reservations")
        .select("*")
        .eq("payment_ref", body.payment_ref)
        .maybeSingle<OnlineBookingReservation>();
      if (error) throw error;
      reservation = data;
    } else {
      throw new HttpError(400, "Provide either reservation_id or payment_ref.");
    }

    if (!reservation) throw new HttpError(404, "Reservation not found.");

    // Ownership check: staff can reconcile any reservation; patients can only
    // reconcile their own. This makes the success-redirect path (auto-finalize
    // when patient lands back from PayMongo) safe to expose to patients.
    const callerIsStaff = isStaff(actor.profile.role);
    const callerIsOwner = reservation.patient_id === actor.id;
    if (!callerIsStaff && !callerIsOwner) {
      throw new HttpError(403, "You can only reconcile your own reservation.");
    }

    if (!reservation.payment_provider || !reservation.payment_ref) {
      throw new HttpError(409, "Reservation has no payment provider/ref. Was checkout ever started?");
    }

    // Use the existing webhook handler so behaviour stays identical.
    // confirmPaymentByRef is idempotent: already-converted reservations short-circuit.
    const result = await confirmPaymentByRef("paymongo", reservation.payment_ref);

    console.info("[reconcile] success", {
      actor: actor.id,
      role: actor.profile.role,
      reservation_id: reservation.id,
      payment_ref: reservation.payment_ref,
      appointment_id: result.appointment?.id ?? null,
      payment_id: result.payment?.id ?? null,
    });

    return ok({
      reconciled: true,
      reservation_id: reservation.id,
      payment_ref: reservation.payment_ref,
      appointment: result.appointment,
      payment: result.payment,
    });
  } catch (e) {
    console.error("[reconcile] failed", e);
    return httpError(e);
  }
}
