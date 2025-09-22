import { NextRequest } from "next/server";
import { getSession } from "auth/server";
import { auditLog } from "lib/security/audit";

export const POST = async (req: NextRequest) => {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, target, projectId, environment } = await req.json();

    if (!url || typeof url !== "string") {
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Validate deployment target
    const validTargets = [
      "vercel",
      "netlify",
      "cloudflare",
      "docker",
      "generic",
    ];
    if (target && !validTargets.includes(target)) {
      return Response.json(
        { error: "Invalid deployment target" },
        { status: 400 },
      );
    }

    // Prepare deployment payload based on target
    let deployPayload: any = {};
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    switch (target) {
      case "vercel":
        deployPayload = {
          name: projectId || "deployment",
          gitSource: {
            type: "github",
            ref: "main",
          },
        };
        break;
      case "netlify":
        deployPayload = {
          name: projectId || "deployment",
          branch: "main",
        };
        break;
      case "cloudflare":
        deployPayload = {
          project_name: projectId || "deployment",
          branch: "main",
        };
        break;
      case "docker":
        deployPayload = {
          image: projectId || "app",
          tag: "latest",
        };
        break;
      default:
        deployPayload = { projectId, environment };
    }

    // Execute deployment
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(deployPayload),
    });

    const responseText = await res.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }

    // Log deployment attempt
    await auditLog(session.user.id, "deploy.trigger", "deployment", {
      resourceId: projectId,
      metadata: { target, url, environment },
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
      success: res.ok,
    });

    if (!res.ok) {
      return Response.json(
        {
          error: responseData?.message || res.statusText,
          status: res.status,
          target,
          projectId,
        },
        { status: res.status },
      );
    }

    return Response.json({
      success: true,
      status: res.status,
      data: responseData,
      target,
      projectId,
      deploymentUrl: responseData?.url || responseData?.deployment_url,
    });
  } catch (e: any) {
    console.error("Deployment error:", e);
    return Response.json(
      { error: e.message || "Unknown error" },
      { status: 500 },
    );
  }
};
