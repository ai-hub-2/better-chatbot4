export const runtime = "nodejs";
import { sandboxJobManager } from "lib/sandbox/job-manager";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job = sandboxJobManager.get(id);
  if (!job) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ job });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ok = sandboxJobManager.stop(id);
  return Response.json({ ok });
}
