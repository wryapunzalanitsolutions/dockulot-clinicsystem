import { httpError, ok } from "@/src/lib/http";
import { confirmPaymentByRef, failPaymentByRef } from "@/src/lib/services/payment";
import { verifyPayMongoSignature } from "@/src/lib/services/paymongo";

/**
 * POST /api/v2/payments/paymongo-webhook
 *
 * Configure this endpoint in:
 *   PayMongo Dashboard → Developers → Webhooks → Add Endpoint
 *
 * URL:    https://<your-domain>/api/v2/payments/paymongo-webhook
 * Method: POST
 *
 * Subscribe to these events (covers GCash / QR Ph, Card, and Direct Online Banking):
 *   - checkout_session.payment.paid    ← success for any method on a Checkout Session
 *   - payment.paid                     ← belt-and-suspenders for non-checkout-session flows
 *   - payment.failed                   ← user/issuer declined or DOB authorization timed out
 *
 * The webhook secret returned by PayMongo (whsk_…) must be saved as
 * PAYMONGO_WEBHOOK_SECRET in the environment so verifyPayMongoSignature() passes.
 *
 * Failure philosophy:
 *   - Bad signature                → 401 (PayMongo logs but won't retry forever)
 *   - Anything else (no-match, bad payload, downstream error)
 *                                  → 200 with {ignored: <reason>} so PayMongo
 *                                    doesn't enter a retry storm. Every event
 *                                    is logged with type + reference + outcome
 *                                    so Vercel logs are the source of truth.
 *                                    Use /api/v2/payments/reconcile to
 *                                    manually finalize anything that got
 *                                    stuck.
 */

type PayMongoInnerData = {
  id?: string;
  attributes?: {
    checkout_session_id?: string | null;
    payment_intent_id?: string | null;
    [key: string]: unknown;
  };
};

type PayMongoEvent = {
  data?: {
    id?: string;
    attributes?: {
      type?: string;
      data?: PayMongoInnerData;
    };
  };
};

function pickReferenceForLookup(type: string, inner: PayMongoInnerData | undefined): string | null {
  if (!inner) return null;
  // Checkout-session events carry the cs_… id we stored as provider_ref.
  if (type.startsWith("checkout_session.")) return inner.id ?? null;
  // payment.* events carry pay_… as inner.id, but PayMongo also includes the
  // originating checkout_session_id for sessions-driven payments. Prefer that
  // so confirmPaymentByRef() finds the reservation.
  return inner.attributes?.checkout_session_id ?? inner.id ?? null;
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  let raw = "";

  try {
    raw = await req.text();
    verifyPayMongoSignature(raw, req.headers.get("Paymongo-Signature"));
  } catch (e) {
    // Signature failures are the *one* case we surface as an error to PayMongo.
    // It tells PayMongo to back off, and it tells you (in their dashboard) that
    // your PAYMONGO_WEBHOOK_SECRET likely doesn't match.
    console.warn("[paymongo-webhook] signature rejected", {
      error: e instanceof Error ? e.message : String(e),
      bodyLength: raw.length,
    });
    return httpError(e);
  }

  let event: PayMongoEvent = {};
  try {
    event = JSON.parse(raw) as PayMongoEvent;
  } catch (e) {
    console.error("[paymongo-webhook] invalid JSON body", e);
    return ok({ received: true, ignored: true, reason: "invalid-json" });
  }

  const type = event.data?.attributes?.type ?? "unknown";
  const eventId = event.data?.id ?? null;
  const inner = event.data?.attributes?.data;
  const reference = pickReferenceForLookup(type, inner);

  // Structured log line — searchable in Vercel logs by `[paymongo-webhook]`.
  const baseLog = {
    eventId,
    type,
    reference,
    innerId: inner?.id ?? null,
    checkoutSessionId: inner?.attributes?.checkout_session_id ?? null,
  };

  if (!reference) {
    console.info("[paymongo-webhook] no-reference", baseLog);
    return ok({ received: true, ignored: true, reason: "no-reference", type });
  }

  try {
    if (type === "checkout_session.payment.paid" || type === "payment.paid") {
      const result = await confirmPaymentByRef("paymongo", reference);
      console.info("[paymongo-webhook] confirmed", {
        ...baseLog,
        appointmentId: result.appointment?.id ?? null,
        paymentId: result.payment?.id ?? null,
        durationMs: Date.now() - startedAt,
      });
      return ok({ received: true, type, ...result });
    }

    if (type === "payment.failed") {
      const payment = await failPaymentByRef("paymongo", reference);
      console.info("[paymongo-webhook] failed", {
        ...baseLog,
        paymentId: payment?.id ?? null,
        durationMs: Date.now() - startedAt,
      });
      return ok({ received: true, type, payment });
    }

    console.info("[paymongo-webhook] ignored-type", baseLog);
    return ok({ received: true, ignored: true, type });
  } catch (e) {
    // Downstream lookup/processing error (e.g. reference is for a reservation
    // we don't know about, or a slot validation failure). We log loudly but
    // still return 200 — retries won't fix a stale reference, and we have the
    // /api/v2/payments/reconcile endpoint to recover real stuck reservations.
    console.error("[paymongo-webhook] processing-error", {
      ...baseLog,
      error: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - startedAt,
    });
    return ok({
      received: true,
      ignored: true,
      reason: "processing-error",
      type,
      message: e instanceof Error ? e.message : "Unknown error",
    });
  }
}
