export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { getAvailableAdvancedTools } from "lib/mcp/advanced-tools";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const availableTools = getAvailableAdvancedTools();

    // Format tools for the MCP system
    const formattedTools = Object.entries(availableTools).map(
      ([name, tool]) => ({
        name,
        description: tool.description,
        parameters: tool.parameters,
      }),
    );

    return NextResponse.json({
      tools: formattedTools,
      count: formattedTools.length,
    });
  } catch (error) {
    console.error("Advanced MCP tools error:", error);
    return NextResponse.json({ error: "Failed to get tools" }, { status: 500 });
  }
}
