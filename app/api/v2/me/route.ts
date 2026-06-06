import { HttpError, httpError, ok, requireActor } from "@/src/lib/http";
import { isProtectedSuperAdminEmail } from "@/src/lib/auth/protected-accounts";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const actor = await requireActor(req);
    const supabase = getSupabaseAdmin();

    let extra: Record<string, unknown> = {};
    if (actor.profile.role === "patient") {
      const { data } = await supabase
        .from("patients")
        .select("*")
        .eq("id", actor.id)
        .maybeSingle();
      extra = { patient: data };
    } else if (actor.profile.role === "doctor") {
      const { data } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", actor.id)
        .maybeSingle();
      extra = { doctor: data };
    }

    return ok({ profile: actor.profile, ...extra });
  } catch (e) {
    return httpError(e);
  }
}

type UpdateMeBody = {
  full_name?: string;
  phone?: string | null;
  email?: string;
  new_password?: string;
};

export async function PATCH(req: Request) {
  try {
    const actor = await requireActor(req);
    const body = (await req.json()) as UpdateMeBody;

    if (!body || typeof body !== "object") {
      throw new HttpError(400, "Invalid payload.");
    }

    const updates: Record<string, string | null> = {};
    let nextEmail: string | null = null;
    let nextPassword: string | null = null;

    if (body.full_name != null) {
      const fullName = body.full_name.trim();
      if (!fullName) throw new HttpError(400, "Full name is required.");
      if (fullName.length > 120) throw new HttpError(400, "Full name is too long.");
      updates.full_name = fullName;
    }

    if ("phone" in body) {
      const phone = body.phone?.trim() ?? "";
      if (phone.length > 30) throw new HttpError(400, "Phone number is too long.");
      updates.phone = phone || null;
    }

    if (body.email != null) {
      const email = body.email.trim().toLowerCase();
      if (!email) throw new HttpError(400, "Email is required.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new HttpError(400, "Please provide a valid email address.");
      }
      if (isProtectedSuperAdminEmail(email) && actor.profile.role !== "super_admin") {
        throw new HttpError(400, "This email is reserved for the super admin account.");
      }
      nextEmail = email;
      updates.email = email;
    }

    if (body.new_password != null) {
      const password = body.new_password;
      if (password.length < 8) {
        throw new HttpError(400, "Password must be at least 8 characters long.");
      }
      nextPassword = password;
    }

    if (Object.keys(updates).length === 0 && nextPassword == null) {
      throw new HttpError(400, "Nothing to update.");
    }

    const supabase = getSupabaseAdmin();
    let data: typeof actor.profile | null = null;
    if (Object.keys(updates).length > 0) {
      const result = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", actor.id)
        .select("*")
        .single();

      if (result.error) throw result.error;
      data = result.data as typeof actor.profile;
    }

    if (updates.full_name) {
      await supabase.auth.admin.updateUserById(actor.id, {
        user_metadata: { full_name: updates.full_name },
      });
    }

    if (nextEmail || nextPassword) {
      await supabase.auth.admin.updateUserById(actor.id, {
        ...(nextEmail ? { email: nextEmail } : {}),
        ...(nextPassword ? { password: nextPassword } : {}),
      });
    }

    return ok({ profile: data ?? actor.profile });
  } catch (e) {
    return httpError(e);
  }
}
