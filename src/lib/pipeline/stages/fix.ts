export async function fix(ctx: {
  projectId: string;
  prompt: string;
  logs: string[];
}) {
  ctx.logs.push(`fix:attempt`);
  return { ok: true };
}
