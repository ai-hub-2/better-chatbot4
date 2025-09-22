export async function plan(
  ctx: { projectId: string; prompt: string; logs: string[] },
  analysis: { objectives: string[] },
) {
  ctx.logs.push(`plan:objectives:${analysis.objectives.length}`);
  return {
    steps: analysis.objectives.map((o) => ({ cmd: "echo", args: [o] })),
  };
}
