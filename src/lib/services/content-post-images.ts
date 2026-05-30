import { HttpError, type Actor } from "@/src/lib/http";
import { getSupabaseAdmin } from "@/src/lib/supabase/server";

function ensureCanUpload(actor: Actor) {
  const role = actor.profile.role;
  if (role !== "super_admin" && role !== "admin" && role !== "doctor") {
    throw new HttpError(403, "Only clinic managers can upload blog images");
  }
}

export async function uploadContentPostImage(
  file: File,
  actor: Actor,
): Promise<{ url: string; path: string }> {
  ensureCanUpload(actor);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const allowed = ["png", "jpg", "jpeg", "webp", "avif", "gif"];
  if (!allowed.includes(ext)) {
    throw new HttpError(400, `Unsupported image type: .${ext}`);
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new HttpError(400, "Image must be 10 MB or smaller");
  }

  const safeName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "blog-image";
  const path = `blog-posts/${actor.id}/${Date.now()}-${safeName}.${ext}`;

  const supabase = getSupabaseAdmin();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("landing-assets")
    .upload(path, buffer, {
      contentType: file.type || `image/${ext}`,
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { data: pub } = supabase.storage.from("landing-assets").getPublicUrl(path);
  return { url: pub.publicUrl, path };
}
