import { HttpError, httpError, ok, requireActor, isStaff } from "@/src/lib/http";
import {
  getAppointmentTypeBreakdown,
  getNoShowRates,
  getPaymentMethodBreakdown,
  getPaymentStatusBreakdown,
  getPatientVolume,
  getPeakHours,
  getReportsDashboard,
  getRevenue,
  getDailyTrends,
} from "@/src/lib/services/reports";

export async function GET(req: Request) {
  try {
    const actor = await requireActor(req);
    if (!isStaff(actor.profile.role) && actor.profile.role !== "doctor")
      throw new HttpError(403, "Forbidden");

    const url = new URL(req.url);
    const kind = url.searchParams.get("kind");
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;

    switch (kind) {
      case "revenue":
        return ok({ revenue: await getRevenue(from, to) });
      case "no-show":
        return ok({ no_show: await getNoShowRates(from, to) });
      case "peak-hours":
        return ok({ peak_hours: await getPeakHours(from, to) });
      case "patient-volume":
        return ok({ volume: await getPatientVolume(from, to) });
      case "payment-methods":
        return ok({ payment_methods: await getPaymentMethodBreakdown(from, to) });
      case "payment-statuses":
        return ok({ payment_statuses: await getPaymentStatusBreakdown(from, to) });
      case "daily-trends":
        return ok({ daily_trends: await getDailyTrends(from, to) });
      case "appointment-types":
        return ok({ appointment_types: await getAppointmentTypeBreakdown(from, to) });
      default:
        return ok(await getReportsDashboard(from, to));
    }
  } catch (e) {
    return httpError(e);
  }
}
