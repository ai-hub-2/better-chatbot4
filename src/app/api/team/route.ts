export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { teamStore } from "lib/security/team";
import { auditLog } from "lib/security/audit";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teams = await teamStore.getUserTeams(session.user.id);
    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Team query error:", error);
    return NextResponse.json(
      { error: "Failed to query teams" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, settings } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 },
      );
    }

    const team = await teamStore.createTeam({
      name,
      description,
      ownerId: session.user.id,
      settings: {
        allowMemberInvites: true,
        requireApprovalForJoins: false,
        defaultProjectPermissions: [
          "project:read",
          "workflow:execute",
          "agent:execute",
          "mcp:invoke",
        ],
        ...settings,
      },
    });

    await auditLog(session.user.id, "team.create", "team", {
      resourceId: team.id,
      metadata: { name: team.name },
      ip: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Team creation error:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 },
    );
  }
}
