export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "auth/server";
import { advancedMCPServices } from "lib/mcp/advanced-services";
import { auditLog } from "lib/security/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "services":
        const services = advancedMCPServices.getAvailableServices();
        return NextResponse.json({ services });

      case "health":
        const health = await advancedMCPServices.healthCheck();
        return NextResponse.json({ health });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Advanced MCP services error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
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
    const { service, action, ...params } = body;

    if (!service || !action) {
      return NextResponse.json(
        { error: "Service and action are required" },
        { status: 400 },
      );
    }

    let result;
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    try {
      switch (service) {
        case "deerflow":
          switch (action) {
            case "create_workflow":
              result = await advancedMCPServices.createDeerFlowWorkflow(params);
              break;
            case "execute_workflow":
              result = await advancedMCPServices.executeDeerFlowWorkflow(
                params.workflowId,
                params.inputs,
              );
              break;
            default:
              return NextResponse.json(
                { error: "Invalid DeerFlow action" },
                { status: 400 },
              );
          }
          break;

        case "browserbase":
          switch (action) {
            case "create_session":
              result =
                await advancedMCPServices.createBrowserbaseSession(params);
              break;
            case "execute_action":
              result = await advancedMCPServices.executeBrowserbaseAction(
                params.sessionId,
                params.action,
              );
              break;
            default:
              return NextResponse.json(
                { error: "Invalid Browserbase action" },
                { status: 400 },
              );
          }
          break;

        case "e2b":
          switch (action) {
            case "create_sandbox":
              result = await advancedMCPServices.createE2BSandbox(params);
              break;
            case "execute_code":
              result = await advancedMCPServices.executeE2BCode(
                params.sandboxId,
                params.code,
                params.language,
              );
              break;
            default:
              return NextResponse.json(
                { error: "Invalid E2B action" },
                { status: 400 },
              );
          }
          break;

        case "mem0":
          switch (action) {
            case "add_memory":
              result = await advancedMCPServices.addMem0Memory(params);
              break;
            case "search_memories":
              result = await advancedMCPServices.searchMem0Memories(
                params.query,
                params.options,
              );
              break;
            default:
              return NextResponse.json(
                { error: "Invalid Mem0 action" },
                { status: 400 },
              );
          }
          break;

        case "firecrawl":
          switch (action) {
            case "scrape_url":
              result = await advancedMCPServices.scrapeFirecrawlUrl(
                params.url,
                params.options,
              );
              break;
            case "crawl_site":
              result = await advancedMCPServices.crawlFirecrawlSite(
                params.url,
                params.options,
              );
              break;
            default:
              return NextResponse.json(
                { error: "Invalid Firecrawl action" },
                { status: 400 },
              );
          }
          break;

        default:
          return NextResponse.json(
            { error: "Invalid service" },
            { status: 400 },
          );
      }

      // Log successful action
      await auditLog(session.user.id, `mcp.${service}.${action}`, "mcp", {
        metadata: { service, action, params },
        ip,
        userAgent,
        success: true,
      });

      return NextResponse.json({ success: true, result });
    } catch (serviceError) {
      // Log failed action
      await auditLog(session.user.id, `mcp.${service}.${action}`, "mcp", {
        metadata: { service, action, params },
        ip,
        userAgent,
        success: false,
        error:
          serviceError instanceof Error
            ? serviceError.message
            : "Unknown error",
      });

      return NextResponse.json(
        {
          error:
            serviceError instanceof Error
              ? serviceError.message
              : "Service error",
          service,
          action,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Advanced MCP services error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
