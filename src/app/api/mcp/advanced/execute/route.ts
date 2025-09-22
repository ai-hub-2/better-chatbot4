export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { getAvailableAdvancedTools } from "lib/mcp/advanced-tools";
import { auditLog } from "lib/security/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { toolName, parameters } = body;

    if (!toolName || !parameters) {
      return NextResponse.json(
        { error: "Tool name and parameters are required" },
        { status: 400 },
      );
    }

    const availableTools = getAvailableAdvancedTools();
    const tool = availableTools[toolName];

    if (!tool) {
      return NextResponse.json(
        { error: `Tool '${toolName}' not found or not available` },
        { status: 404 },
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    try {
      const result = await tool.execute(parameters);

      // Log successful execution
      await auditLog(session.user.id, `mcp.advanced.${toolName}`, "mcp", {
        metadata: { toolName, parameters },
        ip,
        userAgent,
        success: true,
      });

      return NextResponse.json({
        success: true,
        result,
        toolName,
      });
    } catch (toolError) {
      // Log failed execution
      await auditLog(session.user.id, `mcp.advanced.${toolName}`, "mcp", {
        metadata: { toolName, parameters },
        ip,
        userAgent,
        success: false,
        error: toolError instanceof Error ? toolError.message : "Unknown error",
      });

      return NextResponse.json(
        {
          error:
            toolError instanceof Error
              ? toolError.message
              : "Tool execution failed",
          toolName,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Advanced MCP tool execution error:", error);
    return NextResponse.json(
      { error: "Failed to execute tool" },
      { status: 500 },
    );
  }
}
