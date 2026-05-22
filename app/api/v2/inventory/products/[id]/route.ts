import { HttpError, httpError, isClinicStaff, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

export async function PATCH(req: Request, ctx: RouteContext<"/api/v2/inventory/products/[id]">) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const { id } = await ctx.params;
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    for (const key of ["sku", "name", "brand_name", "generic_name", "dosage", "category", "description", "unit", "expiry_date"] as const) {
      if (key in body) patch[key] = body[key] || null;
    }
    for (const key of ["cost_price", "selling_price", "stock_qty", "reorder_level"] as const) {
      if (key in body) patch[key] = Number(body[key] ?? 0);
    }
    if ("supplier_id" in body) patch.supplier_id = body.supplier_id || null;
    if ("is_active" in body) patch.is_active = Boolean(body.is_active);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("inventory_products")
      .update(patch)
      .eq("id", id)
      .select("*, suppliers(name)")
      .single();
    if (error) throw error;
    return ok({ product: data });
  } catch (e) {
    return httpError(e);
  }
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/v2/inventory/products/[id]">) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const { id } = await ctx.params;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("inventory_products").update({ is_active: false }).eq("id", id);
    if (error) throw error;
    return ok({ ok: true });
  } catch (e) {
    return httpError(e);
  }
}
