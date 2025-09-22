export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { auditStore } from "lib/security/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const resource = searchParams.get("resource");
    const since = searchParams.get("since");
    const limit = searchParams.get("limit");

    // Only allow users to query their own audit logs or admin users
    const queryUserId = userId === session.user.id ? userId : session.user.id;

    const events = await auditStore.query({
      userId: queryUserId,
      action: action || undefined,
      resource: resource || undefined,
      since: since ? new Date(since) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Audit query error:", error);
    return NextResponse.json(
      { error: "Failed to query audit logs" },
      { status: 500 },
    );
  }
}
