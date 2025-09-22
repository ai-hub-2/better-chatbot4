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
  let fixResult;
  if (!testResult.passed) {
    ctx.logs.push(`fix:start`);
    fixResult = await fix(ctx, testResult);
  } else {
    fixResult = { fixed: true, fixes: [], summary: "No fixes needed" };
  }
  ctx.logs.push(`summarize:start`);
  const summary = await summarize(ctx, fixResult);
  // optional deploy trigger
  try {
    if (process.env.PIPELINE_AUTO_DEPLOY === "1") {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
      await fetch(`${baseUrl}/api/deploy/hooks`, { method: "POST" }).catch(
        () => undefined,
      );
    }
  } catch {}
  return {
    success: summary.overall_status === "success",
    summary,
    logs: ctx.logs,
    analysis,
    plan: planResult,
    execution: exec,
    testing: testResult,
    fixes: fixResult,
  };
}
