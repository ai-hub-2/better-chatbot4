export async function test(
  ctx: { projectId: string; prompt: string; logs: string[] },
  _exec: any,
) {
  ctx.logs.push(`test:ok`);
  return { ok: true };
}
