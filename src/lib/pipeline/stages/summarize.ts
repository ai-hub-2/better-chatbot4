export async function summarize(ctx: {
  projectId: string;
  prompt: string;
  logs: string[];
}) {
  return `Completed pipeline for ${ctx.projectId}`;
}
