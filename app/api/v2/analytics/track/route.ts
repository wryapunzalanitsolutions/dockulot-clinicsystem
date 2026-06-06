import { HttpError, httpError, ok } from "@/src/lib/http";
import { trackAnalyticsEvent } from "@/src/lib/services/analytics";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      event_name?: string;
      path?: string;
      content_post_id?: string;
      service_id?: string;
      metadata?: Record<string, unknown>;
    };

    const eventName = body.event_name?.trim();
    if (!eventName) {
      throw new HttpError(400, "event_name is required");
    }

    await trackAnalyticsEvent({
      eventName,
      path: body.path,
      contentPostId: body.content_post_id,
      serviceId: body.service_id,
      metadata: body.metadata,
    });

    return ok({ tracked: true });
  } catch (e) {
    return httpError(e);
  }
}
