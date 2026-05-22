import { getSupabaseAdmin } from "@/src/lib/supabase/server";
import { resolveDoctorIdBySlug } from "@/src/lib/server/legacy-bridge";

export function slugifyDoctorName(name: string) {
  const normalized = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "clinic-doctor";
}

type DoctorIdentityRow = {
  id: string;
  slug: string | null;
  profiles:
    | {
        full_name?: string | null;
      }
    | Array<{
        full_name?: string | null;
      }>
    | null;
};

function pickProfile(row: DoctorIdentityRow) {
  if (Array.isArray(row.profiles)) return row.profiles[0] ?? null;
  return row.profiles ?? null;
}

export async function resolvePrimaryDoctorIdentity(): Promise<{
  id: string;
  slug: string;
  fullName: string;
}> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("doctors")
    .select("id, slug, profiles(full_name)")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle<DoctorIdentityRow>();

  if (error) throw error;
  if (!data) {
    throw new Error("No doctors found - create a doctor profile first.");
  }

  const profile = pickProfile(data);
  const fullName = profile?.full_name?.trim() || "Doctor";
  const slug = data.slug?.trim() || slugifyDoctorName(fullName);

  if (data.slug !== slug) {
    await supabase.from("doctors").update({ slug }).eq("id", data.id);
  }

  return { id: data.id, slug, fullName };
}

export async function resolveDoctorUuid(doctorSlug?: string | null) {
  if (doctorSlug?.trim()) {
    return resolveDoctorIdBySlug(doctorSlug.trim());
  }

  const doctor = await resolvePrimaryDoctorIdentity();
  return doctor.id;
}
