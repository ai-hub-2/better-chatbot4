import { Job } from "bullmq";
import type { PipelinePayload } from "lib/queue";
import { analyze } from "./stages/analyze";
import { plan } from "./stages/plan";
import { execute } from "./stages/execute";
import { test } from "./stages/test";
import { fix } from "./stages/fix";
import { summarize } from "./stages/summarize";

export async function pipelineWorker(job: Job<PipelinePayload>) {
  const ctx = {
    projectId: job.data.projectId,
    prompt: job.data.prompt,
    logs: [] as string[],
  };
  ctx.logs.push(`analyze:start`);
  const analysis = await analyze(ctx);
  ctx.logs.push(`plan:start`);
  const planResult = await plan(ctx, analysis);
  ctx.logs.push(`execute:start`);
  const exec = await execute(ctx, planResult);
  ctx.logs.push(`test:start`);
  const testResult = await test(ctx, exec);
  if (!testResult.ok) {
    ctx.logs.push(`fix:start`);
    await fix(ctx);
  }
  ctx.logs.push(`summarize:start`);
  const summary = await summarize(ctx);
  return { ok: true, summary, logs: ctx.logs };
}
