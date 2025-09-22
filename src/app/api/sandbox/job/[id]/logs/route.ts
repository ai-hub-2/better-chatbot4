export const runtime = "nodejs";
import { sandboxJobManager } from "lib/sandbox/job-manager";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job = sandboxJobManager.get(id);
  if (!job) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ logs: job.logs, status: job.status });
}
