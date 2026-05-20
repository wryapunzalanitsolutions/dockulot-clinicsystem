import { NextResponse } from "next/server";
import { hasPermission } from "@/src/lib/auth/permissions";
import { requireAuthenticatedUser } from "@/src/lib/auth/server-auth";
import {
  createPersistedAppointmentWithContext,
  type AppointmentCreatePayload,
} from "@/src/lib/server/appointments-store";

async function authenticateRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!accessToken) {
    return null;
  }

  try {
    return await requireAuthenticatedUser(accessToken);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const authenticatedUser = await authenticateRequest(request);

  if (!authenticatedUser || !hasPermission(authenticatedUser.role, "appointments.create")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as AppointmentCreatePayload;
  const result = await createPersistedAppointmentWithContext(payload, {
    actor: authenticatedUser,
    initialStatus: "CheckedIn",
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message, appointments: result.appointments },
      { status: 409 },
    );
  }

  return NextResponse.json(
    {
      message: result.message,
      appointment: result.appointment,
      appointments: result.appointments,
    },
    { status: 201 },
  );
}
