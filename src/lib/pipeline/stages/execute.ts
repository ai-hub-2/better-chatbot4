export async function execute(
  ctx: { projectId: string; prompt: string; logs: string[] },
  plan: { steps: { cmd: string; args?: string[] }[] },
) {
  ctx.logs.push(`execute:steps:${plan.steps.length}`);
  // For now, simulate execution logs
  plan.steps.forEach((s) =>
    ctx.logs.push(`exec:${s.cmd} ${s.args?.join(" ") ?? ""}`),
  );
  return { ok: true };
}
