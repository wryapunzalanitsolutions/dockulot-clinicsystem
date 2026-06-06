"use client";

import { useEffect } from "react";
import { trackPublicAnalytics } from "@/src/components/marketing/analytics-client";

export default function ContentViewTracker({
  contentPostId,
  path,
  eventName = "content_view",
  metadata,
}: {
  contentPostId: string;
  path: string;
  eventName?: string;
  metadata?: Record<string, unknown>;
}) {
  useEffect(() => {
    trackPublicAnalytics({
      eventName,
      path,
      contentPostId,
      metadata,
    });
  }, [contentPostId, eventName, metadata, path]);

  return null;
}
