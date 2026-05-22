import { HttpError, httpError, isClinicStaff, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);
    const active = url.searchParams.get("active");
    let q = supabase
      .from("inventory_products")
      .select("*, suppliers(name)")
      .order("brand_name");
    if (active === "true") q = q.eq("is_active", true);
    const { data, error } = await q;
    if (error) throw error;
    return ok({ products: data ?? [] });
  } catch (e) {
    return httpError(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const body = await req.json();
    if (!body.sku || !body.name) throw new HttpError(400, "sku and name required");
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("inventory_products")
      .insert({
        sku: String(body.sku).trim(),
        name: String(body.name ?? body.brand_name ?? body.generic_name ?? body.sku).trim(),
        brand_name: String(body.brand_name ?? body.name ?? body.generic_name ?? body.sku).trim(),
        generic_name: body.generic_name ?? null,
        dosage: body.dosage ?? null,
        category: body.category ?? "Medicine",
        description: body.description ?? null,
        supplier_id: body.supplier_id || null,
        unit: body.unit || "pc",
        cost_price: Number(body.cost_price ?? 0),
        selling_price: Number(body.selling_price ?? 0),
        stock_qty: Number(body.stock_qty ?? 0),
        reorder_level: Number(body.reorder_level ?? 0),
        expiry_date: body.expiry_date || null,
        is_active: body.is_active ?? true,
      })
      .select("*, suppliers(name)")
      .single();
    if (error) throw error;
    return ok({ product: data }, 201);
  } catch (e) {
    return httpError(e);
  }
}
