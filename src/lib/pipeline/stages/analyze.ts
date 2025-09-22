export async function analyze(ctx: {
  projectId: string;
  prompt: string;
  logs: string[];
}) {
  ctx.logs.push(`analyze:prompt:${ctx.prompt.slice(0, 100)}`);
  return { objectives: [ctx.prompt] };
}
