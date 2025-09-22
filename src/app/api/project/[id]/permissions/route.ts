export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { teamStore } from "lib/security/team";
import { auditLog } from "lib/security/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const permissions = await teamStore.getUserProjectPermissions(
      session.user.id,
      projectId,
    );

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Project permissions query error:", error);
    return NextResponse.json(
      { error: "Failed to query project permissions" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const { userId, permissions, teamId } = body;

    if (!userId || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "User ID and permissions array are required" },
        { status: 400 },
      );
    }

    const access = await teamStore.grantProjectAccess({
      projectId,
      userId,
      teamId,
      permissions,
      grantedBy: session.user.id,
    });

    await auditLog(session.user.id, "project.permissions.grant", "project", {
      resourceId: projectId,
      metadata: { targetUserId: userId, permissions, teamId },
      ip: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ access });
  } catch (error) {
    console.error("Project permissions grant error:", error);
    return NextResponse.json(
      { error: "Failed to grant project permissions" },
      { status: 500 },
    );
  }
}
