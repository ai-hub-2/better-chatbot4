import { graphMemory } from "lib/ai/memory/graph-memory";

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ project: string }> },
) => {
  const { project } = await params;
  const detailed = (graphMemory as any).listDetailed
    ? await (graphMemory as any).listDetailed(project)
    : {
        short: await graphMemory.list(project),
        long: await graphMemory.list(project),
      };
  return Response.json(detailed);
};

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ project: string }> },
) => {
  const { project } = await params;
  const body = await req.json();
  graphMemory.append(project, {
    ts: Date.now(),
    role: body.role ?? "system",
    content: String(body.content ?? ""),
    tags: body.tags,
  });
  return Response.json({ ok: true });
};

export const DELETE = async (
  _req: Request,
  { params }: { params: Promise<{ project: string }> },
) => {
  const { project } = await params;
  graphMemory.clear(project);
  return Response.json({ ok: true });
};
