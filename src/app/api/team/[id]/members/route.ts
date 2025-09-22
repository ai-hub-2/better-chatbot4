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

    const { id: teamId } = await params;
    const members = await teamStore.getTeamMembers(teamId);

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Team members query error:", error);
    return NextResponse.json(
      { error: "Failed to query team members" },
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

    const { id: teamId } = await params;
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "User ID and role are required" },
        { status: 400 },
      );
    }

    const member = await teamStore.addMember({
      userId,
      teamId,
      role,
      joinedAt: new Date(),
      invitedBy: session.user.id,
    });

    await auditLog(session.user.id, "team.member.add", "team", {
      resourceId: teamId,
      metadata: { memberId: userId, role },
      ip: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Team member addition error:", error);
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 },
    );
  }
}
