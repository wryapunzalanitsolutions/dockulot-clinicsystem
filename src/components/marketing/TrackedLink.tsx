"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackPublicAnalytics } from "@/src/components/marketing/analytics-client";

type TrackedLinkProps = {
  href: string;
  className?: string;
  target?: string;
  rel?: string;
  children: ReactNode;
  eventName: string;
  path?: string;
  contentPostId?: string;
  serviceId?: string;
  metadata?: Record<string, unknown>;
};

export default function TrackedLink({
  href,
  className,
  target,
  rel,
  children,
  eventName,
  path,
  contentPostId,
  serviceId,
  metadata,
}: TrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={() => {
        trackPublicAnalytics({
          eventName,
          path,
          contentPostId,
          serviceId,
          metadata,
        });
      }}
    >
      {children}
    </Link>
  );
}
