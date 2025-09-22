export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { pipelineQueue } from "lib/queue";

export async function POST(req: NextRequest) {
  const { projectId, prompt } = await req.json();
  if (!projectId || !prompt)
    return Response.json(
      { error: "projectId and prompt required" },
      { status: 400 },
    );
  const job = await pipelineQueue.add("pipeline", { projectId, prompt });
  return Response.json({ id: job.id });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const job = await pipelineQueue.getJob(id);
  if (!job) return Response.json({ error: "not found" }, { status: 404 });
  const st = await job.getState();
  return Response.json({ state: st, result: job.returnvalue });
}
