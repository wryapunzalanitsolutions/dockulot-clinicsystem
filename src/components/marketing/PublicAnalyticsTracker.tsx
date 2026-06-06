"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPublicAnalytics } from "@/src/components/marketing/analytics-client";

export default function PublicAnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    trackPublicAnalytics({
      eventName: "page_view",
      path: pathname,
    });
  }, [pathname]);

  return null;
}
