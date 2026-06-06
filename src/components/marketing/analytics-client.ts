"use client";

const CLIENT_ID_KEY = "publicAnalyticsClientId";

type TrackInput = {
  eventName: string;
  path?: string;
  contentPostId?: string;
  serviceId?: string;
  metadata?: Record<string, unknown>;
};

function getClientId() {
  if (typeof window === "undefined") return "";

  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(CLIENT_ID_KEY, generated);
  return generated;
}

export function trackPublicAnalytics(input: TrackInput) {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    event_name: input.eventName,
    path: input.path ?? window.location.pathname,
    content_post_id: input.contentPostId,
    service_id: input.serviceId,
    metadata: {
      client_id: getClientId(),
      referrer: document.referrer || null,
      ...input.metadata,
    },
  });

  if (typeof navigator.sendBeacon === "function") {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon("/api/v2/analytics/track", blob);
    return;
  }

  void fetch("/api/v2/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  });
}
