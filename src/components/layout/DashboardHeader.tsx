"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowRightFromBracket,
  FaBars,
  FaBell,
  FaChevronDown,
  FaGear,
  FaRegUser,
} from "react-icons/fa6";
import { canAccessPath, getRoleProfile, type UserRole } from "@/src/lib/roles";

type ProfileShape = {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type NotificationItem = {
  id: string;
  channels: Array<"email" | "sms">;
  template: string;
  status: "queued" | "sent" | "failed";
  created_at: string;
  send_at: string;
  sent_at: string | null;
  subject: string;
  body: string;
  is_read: boolean;
  href?: string | null;
};

type NotificationFeedResponse = {
  notifications: NotificationItem[];
  count: number;
};

type DashboardHeaderProps = {
  role: UserRole;
  profile: ProfileShape | null;
  accessToken: string | null;
  onOpenSidebar: () => void;
  onLogout: () => Promise<void>;
};

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/appointments": "Appointments",
  "/appointments/calendar": "Appointment Calendar",
  "/appointments/my": "My Appointments",
  "/patients": "Patients",
  "/patients/add": "Add Walk-In Patient",
  "/patients/records": "Patient Records",
  "/consultations": "Consultations",
  "/consultations/history": "Consultation History",
  "/payments": "Payments",
  "/payments/history": "Payment History",
  "/payments/pos": "POS Billing",
  "/pricing": "Pricing",
  "/reports": "Reports",
  "/schedules": "Schedules",
  "/schedules/slots": "Blocked Dates",
  "/settings": "Settings",
  "/profile": "Profile",
  "/help": "Help Center",
  "/users": "Users",
};

function getInitials(name: string | null | undefined) {
  const value = name?.trim();
  if (!value) return "CU";
  const parts = value.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "CU";
}

function getCompactName(name: string | null | undefined) {
  const value = name?.trim();
  if (!value) return "User";
  const [first, second] = value.split(/\s+/);
  if (!first) return "User";
  return second ? `${first} ${second[0]?.toUpperCase() ?? ""}.` : first;
}

function formatRelativeDate(input: string) {
  const value = new Date(input);
  const diffMinutes = Math.round((Date.now() - value.getTime()) / 60000);

  if (Math.abs(diffMinutes) < 1) return "Just now";
  if (Math.abs(diffMinutes) < 60) return `${Math.abs(diffMinutes)} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return `${Math.abs(diffHours)} hr ago`;

  return value.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function mapTemplateToLabel(template: string) {
  switch (template) {
    case "welcome":
      return "Registration";
    case "appointment_booked":
    case "appointment_staff_booked":
      return "Appointment Booking";
    case "appointment_staff_confirmed":
      return "Appointment Confirmed";
    case "appointment_staff_rescheduled":
      return "Appointment Rescheduled";
    case "appointment_confirmed":
      return "Appointment Confirmed";
    case "appointment_payment_success":
    case "appointment_paid_and_confirmed":
      return "Payment Success";
    case "online_meeting_link":
      return "Online Meeting Link";
    case "appointment_payment_failed":
      return "Payment Issue";
    case "appointment_reminder_24h":
      return "24-Hour Reminder";
    case "appointment_reminder_6h":
      return "Upcoming Reminder";
    case "appointment_staff_checked_in":
      return "Patient Check-In";
    case "appointment_staff_in_progress":
      return "Consultation Started";
    case "appointment_staff_completed":
      return "Consultation Completed";
    case "appointment_staff_payment_failed":
      return "Payment Issue";
    case "billing_issued":
      return "Billing Notice";
    case "appointment_cancelled":
    case "appointment_staff_cancelled":
      return "Appointment Update";
    default:
      return "Notification";
  }
}

function formatChannels(channels: Array<"email" | "sms">) {
  if (channels.length === 0) return "in-app";
  return channels.join(" + ");
}

export function DashboardHeader({
  role,
  profile,
  accessToken,
  onOpenSidebar,
  onLogout,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [notifPulse, setNotifPulse] = useState(false);
  const [isNotifLoading, setIsNotifLoading] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notifMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedNotificationsRef = useRef(false);
  const notificationCountRef = useRef(0);
  const notifPulseTimerRef = useRef<number | null>(null);

  const pageTitle = PAGE_TITLES[pathname] ?? "Workspace";
  const roleLabel = getRoleProfile(role).label.toUpperCase();
  const displayName = profile?.full_name ?? "CHIARA User";
  const compactName = getCompactName(displayName);
  const displayEmail = profile?.email ?? "";
  const initials = getInitials(displayName);
  const canSeeSettings = canAccessPath(role, "/settings");
  const notifCount = useMemo(() => items.filter((item) => !item.is_read).length, [items]);
  const hasNotifications = items.length > 0;

  async function markNotificationAsRead(notificationId: string) {
    if (!accessToken) return;

    try {
      const response = await fetch("/api/v2/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ notification_id: notificationId }),
      });

      if (!response.ok) throw new Error("Failed to mark notification as read");

      // Update local state
      setItems((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, is_read: true } : item,
        ),
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }

  async function openNotification(item: NotificationItem) {
    if (!item.is_read) {
      await markNotificationAsRead(item.id);
    }
    setIsNotifOpen(false);
    setNotifPulse(false);
    if (item.href) {
      router.push(item.href);
    }
  }

  async function markAllRead() {
    if (!accessToken) return;
    try {
      const response = await fetch("/api/v2/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      if (!response.ok) throw new Error("Failed to mark all notifications as read");
      setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }

  function triggerNotificationAlert() {
    if (notifPulseTimerRef.current != null) {
      window.clearTimeout(notifPulseTimerRef.current);
    }

    setNotifPulse(true);
    notifPulseTimerRef.current = window.setTimeout(() => {
      setNotifPulse(false);
      notifPulseTimerRef.current = null;
    }, 2200);

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([120, 60, 120]);
    }
  }

  const loadNotifications = useCallback(
    async ({ showLoading }: { showLoading: boolean }) => {
      if (!accessToken) return;

      if (showLoading) {
        setIsNotifLoading(true);
      }

      try {
        const response = await fetch("/api/v2/notifications", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) throw new Error("Failed to load notifications.");

        const payload = (await response.json()) as NotificationFeedResponse;
        const nextItems = payload.notifications;
        const previousIds = notificationIdsRef.current;
        const newItemCount = hasLoadedNotificationsRef.current
          ? nextItems.filter((item) => !previousIds.has(item.id)).length
          : 0;
        const nextCount = typeof payload.count === "number" ? payload.count : nextItems.length;
        const countIncreased = hasLoadedNotificationsRef.current && nextCount > notificationCountRef.current;

        notificationIdsRef.current = new Set(nextItems.map((item) => item.id));
        hasLoadedNotificationsRef.current = true;
        notificationCountRef.current = nextCount;
        setItems(nextItems);

        if (countIncreased || newItemCount > 0) {
          triggerNotificationAlert();
        }
      } catch {
        setItems([]);
      } finally {
        if (showLoading) {
          setIsNotifLoading(false);
        }
      }
    },
    [accessToken],
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    notificationIdsRef.current = new Set();
    hasLoadedNotificationsRef.current = false;
    notificationCountRef.current = 0;

    void loadNotifications({ showLoading: true });

    const pollId = window.setInterval(() => {
      void loadNotifications({ showLoading: false });
    }, 10000);

    return () => {
      window.clearInterval(pollId);
      if (notifPulseTimerRef.current != null) {
        window.clearTimeout(notifPulseTimerRef.current);
      }
    };
  }, [accessToken, loadNotifications]);

  useEffect(() => {
    if (!accessToken || !isNotifOpen) return;

    void loadNotifications({ showLoading: true });
  }, [accessToken, isNotifOpen, loadNotifications]);

  async function handleLogoutClick() {
    setIsMenuOpen(false);
    await onLogout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-[linear-gradient(180deg,#f6f7ef_0%,#ffffff_72%)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 lg:hidden"
            onClick={onOpenSidebar}
            aria-label="Open sidebar"
          >
            <FaBars className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 sm:block">CHIARA Workspace</p>
            <h1 className="truncate text-base font-bold text-slate-900 sm:text-xl">{pageTitle}</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="relative" ref={notifMenuRef}>
            <button
              type="button"
              className={`relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-600 bg-white text-emerald-600 shadow-sm transition hover:border-emerald-500 hover:text-emerald-700 sm:h-12 sm:w-12 ${
                notifPulse ? "ring-4 ring-rose-200 ring-offset-2 ring-offset-white animate-pulse" : ""
              }`}
              aria-label="Notifications"
              onClick={() => {
                setIsNotifOpen((current) => !current);
                setIsMenuOpen(false);
                setNotifPulse(false);
              }}
            >
              <FaBell className="h-4 w-4" />
              {notifCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white sm:right-2 sm:top-2">
                  {notifCount > 99 ? "99+" : notifCount}
                </span>
              ) : null}
            </button>

            {isNotifOpen ? (
              <button
                type="button"
                className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-[1px] sm:hidden"
                aria-label="Close notifications"
                onClick={() => setIsNotifOpen(false)}
              />
            ) : null}

            {isNotifOpen ? (
              <div className="fixed inset-x-3 top-[calc(env(safe-area-inset-top,0px)+4.3rem)] z-40 max-h-[calc(100svh-5.5rem)] w-auto overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.14)] sm:absolute sm:right-0 sm:inset-x-auto sm:top-auto sm:mt-3 sm:max-h-[32rem] sm:w-[min(24rem,calc(100vw-2rem))]">
                <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Notification Center</p>
                    <p className="mt-1 text-xs text-slate-500">In-app updates for your account activity.</p>
                  </div>
                  <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:justify-start">
                    <button
                      type="button"
                      className="rounded-2xl border border-slate-100 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => {
                        void markAllRead();
                      }}
                      disabled={!hasNotifications}
                    >
                      Mark all read
                    </button>
                    <button
                      type="button"
                      className="rounded-2xl border border-slate-100 bg-white px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={async () => {
                        if (!accessToken) return;
                        try {
                          const res = await fetch("/api/v2/notifications", {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${accessToken}`,
                            },
                            body: JSON.stringify({ action: "delete_all" }),
                          });
                          if (!res.ok) throw new Error("Failed to delete notifications");
                          setItems([]);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      disabled={!hasNotifications}
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                <div className="max-h-[calc(100svh-12rem)] overflow-y-auto sm:max-h-96">
                  {isNotifLoading ? (
                    <div className="space-y-3 p-4 sm:p-5">
                      {[0, 1, 2].map((key) => (
                        <div key={key} className="rounded-2xl border border-slate-100 p-4">
                          <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                          <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100" />
                          <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                        </div>
                      ))}
                    </div>
                  ) : items.length > 0 ? (
                    <div className="space-y-2 p-3">
                      {items.map((item) => (
                        <div key={item.id} className={`rounded-2xl border px-3 py-3 transition sm:px-4 ${
                          item.is_read
                            ? "border-slate-100 hover:border-teal-100 hover:bg-teal-50/40"
                            : "border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50/70"
                        }`}>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
                                {mapTemplateToLabel(item.template)}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{item.subject}</p>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.body}</p>
                            </div>
                            <div className="flex shrink-0 flex-row flex-wrap items-center gap-2 sm:max-w-[8.5rem] sm:flex-col sm:items-end">
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                {formatChannels(item.channels)}
                              </span>
                              {!item.is_read && (
                                <button
                                  type="button"
                                  className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700 transition hover:bg-amber-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void markNotificationAsRead(item.id);
                                  }}
                                >
                                  Mark Read
                                </button>
                              )}
                              {item.href ? (
                                <button
                                  type="button"
                                  className="rounded-full border border-emerald-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 transition hover:bg-emerald-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void openNotification(item);
                                  }}
                                >
                                  Open
                                </button>
                              ) : null}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                            <span>{formatRelativeDate(item.created_at)}</span>
                            <span className="font-medium uppercase tracking-[0.12em]">{item.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-5 py-8 text-center text-sm text-slate-500">
                      No notifications yet.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              className="flex min-w-0 max-w-48 items-center gap-2 rounded-[1.4rem] border-2 border-emerald-600 bg-white px-2.5 py-1.5 text-left shadow-sm transition hover:border-emerald-500 hover:shadow-md sm:max-w-none sm:gap-3 sm:rounded-[1.75rem] sm:px-3 sm:py-2 sm:pr-4"
              onClick={() => {
                setIsMenuOpen((current) => !current);
                setIsNotifOpen(false);
              }}
              aria-label="Open account menu"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] border-emerald-600 bg-[radial-gradient(circle_at_top,#163b7a_0%,#0f2147_80%)] text-xs font-bold text-white sm:h-11 sm:w-11 sm:border-4 sm:text-sm">
                {initials}
              </div>

              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-extrabold uppercase tracking-[0.04em] text-slate-900">
                  {displayName}
                </p>
                <p className="truncate text-[11px] uppercase tracking-[0.18em] text-slate-500">{roleLabel}</p>
              </div>

              <div className="min-w-0 sm:hidden">
                <p className="max-w-19 truncate text-[11px] font-extrabold uppercase tracking-[0.03em] text-slate-900">
                  {compactName}
                </p>
              </div>

              <FaChevronDown className={`h-3 w-3 shrink-0 text-slate-500 transition ${isMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isMenuOpen ? (
              <div className="absolute right-0 mt-3 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.14)]">
                <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                  <p className="truncate text-sm font-bold uppercase tracking-[0.04em] text-slate-900">{displayName}</p>
                  <p className="truncate text-xs text-slate-500">{displayEmail}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">{roleLabel}</p>
                </div>

                <div className="p-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-teal-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaRegUser className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>

                  <Link
                    href={canSeeSettings ? "/settings" : "/profile"}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-teal-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaGear className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 p-2">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-rose-50 hover:text-rose-700"
                    onClick={handleLogoutClick}
                  >
                    <FaArrowRightFromBracket className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
