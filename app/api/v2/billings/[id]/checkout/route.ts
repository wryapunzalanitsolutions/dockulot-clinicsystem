import { HttpError, httpError, ok, requireActor } from "@/src/lib/http";
import { startPosPayMongoCheckout, type PosCheckoutOption } from "@/src/lib/services/billing";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const actor = await requireActor(req);
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as {
      checkout_option?: PosCheckoutOption;
    };

    const checkoutOption = body.checkout_option ?? "paymongo_qr";
    if (
      checkoutOption !== "paymongo_qr"
      && checkoutOption !== "paymongo_card"
      && checkoutOption !== "paymongo_bank"
    ) {
      throw new HttpError(400, "Invalid checkout option.");
    }

    const result = await startPosPayMongoCheckout(id, checkoutOption, actor);
    return ok({
      billing: result.billing,
      payment: result.payment,
      url: result.checkoutUrl,
      checkout_mode: "paymongo",
    });
  } catch (e) {
    return httpError(e);
  }
}
