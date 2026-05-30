import { HttpError, httpError, ok, requireActor } from "@/src/lib/http";
import { uploadContentPostImage } from "@/src/lib/services/content-post-images";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const actor = await requireActor(req);
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      throw new HttpError(400, "file is required");
    }

    const result = await uploadContentPostImage(file, actor);
    return ok(result);
  } catch (e) {
    return httpError(e);
  }
}
