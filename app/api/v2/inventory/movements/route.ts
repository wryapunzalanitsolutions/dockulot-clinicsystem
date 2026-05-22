import { HttpError, httpError, isClinicStaff, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

const STOCK_INCREASE = new Set(["StockIn", "Return"]);
const STOCK_DECREASE = new Set(["StockOut", "Sale", "Expired"]);

export async function GET(req: Request) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("inventory_movements")
      .select("*, inventory_products(name, brand_name, generic_name, dosage, sku)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return ok({ movements: data ?? [] });
  } catch (e) {
    return httpError(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const body = await req.json();
    if (!body.product_id || !body.movement_type || body.quantity == null) {
      throw new HttpError(400, "product_id, movement_type, quantity required");
    }
    const quantity = Number(body.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) throw new HttpError(400, "quantity must be positive");
    const supabase = getSupabaseAdmin();
    const { data: product, error: productError } = await supabase
      .from("inventory_products")
      .select("stock_qty")
      .eq("id", body.product_id)
      .single();
    if (productError) throw productError;
    const delta = STOCK_INCREASE.has(body.movement_type)
      ? quantity
      : STOCK_DECREASE.has(body.movement_type)
        ? -quantity
        : body.movement_type === "Adjustment"
          ? quantity - Number(product.stock_qty ?? 0)
          : 0;
    const nextStock = Number(product.stock_qty ?? 0) + delta;
    if (nextStock < 0) throw new HttpError(400, "Stock cannot go below zero");
    const { data, error } = await supabase
      .from("inventory_movements")
      .insert({
        product_id: body.product_id,
        movement_type: body.movement_type,
        quantity,
        notes: body.notes ?? null,
        reference_table: body.reference_table ?? null,
        reference_id: body.reference_id ?? null,
        created_by: actor.id,
      })
      .select("*, inventory_products(name, brand_name, generic_name, dosage, sku)")
      .single();
    if (error) throw error;
    const { error: updateError } = await supabase
      .from("inventory_products")
      .update({ stock_qty: nextStock })
      .eq("id", body.product_id);
    if (updateError) throw updateError;
    return ok({ movement: data, stock_qty: nextStock }, 201);
  } catch (e) {
    return httpError(e);
  }
}
