export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { sandboxJobManager } from "lib/sandbox/job-manager";

export async function GET() {
  return Response.json({ jobs: sandboxJobManager.list() });
}

export async function POST(req: NextRequest) {
  try {
    const spec = await req.json();
    const job = sandboxJobManager.start(spec);
    return Response.json({ job });
  } catch (e: any) {
    return Response.json({ error: e?.message || "unknown" }, { status: 500 });
  }
}
