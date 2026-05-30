import { HttpError, httpError, isClinicStaff, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

export async function PATCH(req: Request, ctx: RouteContext<"/api/v2/inventory/suppliers/[id]">) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const { id } = await ctx.params;
    const body = await req.json();
    const patch = {
      name: String(body.name ?? "").trim(),
      contact_person: body.contact_person ? String(body.contact_person).trim() : null,
      phone: body.phone ? String(body.phone).trim() : null,
      email: body.email ? String(body.email).trim() : null,
      address: body.address ? String(body.address).trim() : null,
    };
    if (!patch.name) throw new HttpError(400, "name required");

    const { data, error } = await getSupabaseAdmin()
      .from("suppliers")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return ok({ supplier: data });
  } catch (e) {
    return httpError(e);
  }
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/v2/inventory/suppliers/[id]">) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const { id } = await ctx.params;
    const supabase = getSupabaseAdmin();
    const { error: clearProductsError } = await supabase
      .from("inventory_products")
      .update({ supplier_id: null })
      .eq("supplier_id", id);
    if (clearProductsError) throw clearProductsError;

    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) throw error;
    return ok({ ok: true });
  } catch (e) {
    return httpError(e);
  }
}
