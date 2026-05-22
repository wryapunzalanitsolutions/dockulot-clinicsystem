import { HttpError, httpError, isClinicStaff, ok, requireActor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const token = req.headers.get("authorization");
    let includeUnpublished = false;
    if (token) {
      const actor = await requireActor(req);
      includeUnpublished = isClinicStaff(actor.profile.role);
    }
    let q = supabase.from("faqs").select("*").order("sort_order").order("category");
    if (!includeUnpublished) q = q.eq("is_published", true);
    const { data, error } = await q;
    if (error) throw error;
    return ok({ faqs: data ?? [] });
  } catch (e) {
    return httpError(e);
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireActor(req);
    if (!isClinicStaff(actor.profile.role)) throw new HttpError(403, "Forbidden");
    const body = await req.json();
    if (!body.category || !body.question || !body.answer) {
      throw new HttpError(400, "category, question, answer required");
    }
    const { data, error } = await getSupabaseAdmin()
      .from("faqs")
      .insert({
        category: body.category,
        question: body.question,
        answer: body.answer,
        sort_order: Number(body.sort_order ?? 0),
        is_published: body.is_published ?? true,
      })
      .select()
      .single();
    if (error) throw error;
    return ok({ faq: data }, 201);
  } catch (e) {
    return httpError(e);
  }
}
