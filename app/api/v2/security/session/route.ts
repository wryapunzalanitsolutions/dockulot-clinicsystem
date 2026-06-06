import { httpError, ok, requireActor } from "@/src/lib/http";
import { assertTrustedOrigin, enforceRateLimit } from "@/src/lib/security";
import { logActivity } from "@/src/lib/services/activity-log";

export async function POST(req: Request) {
  try {
    assertTrustedOrigin(req);
    enforceRateLimit(req, "security-session", 20, 60_000);
    const actor = await requireActor(req);
    const body = (await req.json().catch(() => ({}))) as { event?: string };
    const event = body.event === "logout" ? "auth.logout" : "auth.login";

    await logActivity({
      actor,
      action: event,
      entity_table: "profiles",
      entity_id: actor.id,
      metadata: {
        role: actor.profile.role,
        email: actor.profile.email,
      },
    });

    return ok({ logged: true });
  } catch (e) {
    return httpError(e);
  }
}
