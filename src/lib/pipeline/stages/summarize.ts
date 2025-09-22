import { openai } from "@ai-sdk/openai";

export async function summarize(
  ctx: { projectId: string; prompt: string; logs: string[] },
  fixResult: {
    fixed: boolean;
    fixes: Array<{
      testName: string;
      description: string;
      type: string;
      applied: boolean;
    }>;
    summary: string;
  },
) {
  ctx.logs.push(`📝 Generating comprehensive summary...`);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a project manager. Create a comprehensive summary of the development pipeline execution.

Return a JSON object with:
- overall_status: "success" | "partial_success" | "failed"
- summary: brief overview of what was accomplished
- key_achievements: array of major accomplishments
- issues_encountered: array of problems that occurred
- fixes_applied: array of fixes that were implemented
- recommendations: array of next steps or improvements
- metrics: object with execution statistics
- deployment_status: current deployment state

Be professional and detailed. Focus on actionable insights.`,
        },
        {
          role: "user",
          content: `Pipeline Execution Summary Request:

Original Prompt: ${ctx.prompt}

Execution Logs:
${ctx.logs.join("\n")}

Fix Results:
- Fixed: ${fixResult.fixed}
- Fixes Applied: ${fixResult.fixes.length}
- Fix Summary: ${fixResult.summary}

Please provide a comprehensive summary of this pipeline execution.`,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const summary = JSON.parse(response.choices[0]?.message?.content || "{}");

    ctx.logs.push(`✅ Summary generated successfully`);

    return {
      overall_status: summary.overall_status || "unknown",
      summary: summary.summary || "Pipeline execution completed",
      key_achievements: summary.key_achievements || [],
      issues_encountered: summary.issues_encountered || [],
      fixes_applied: summary.fixes_applied || [],
      recommendations: summary.recommendations || [],
      metrics: summary.metrics || {},
      deployment_status: summary.deployment_status || "unknown",
      execution_logs: ctx.logs,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    ctx.logs.push(
      `❌ Summary generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );

    return {
      overall_status: "error",
      summary: "Pipeline execution completed with errors",
      key_achievements: [],
      issues_encountered: [
        `Summary generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
      fixes_applied: fixResult.fixes.map((f) => f.description),
      recommendations: [
        "Review execution logs for details",
        "Consider manual intervention",
      ],
      metrics: {
        total_logs: ctx.logs.length,
        fixes_attempted: fixResult.fixes.length,
        fixes_successful: fixResult.fixes.filter((f) => f.applied).length,
      },
      deployment_status: "unknown",
      execution_logs: ctx.logs,
      timestamp: new Date().toISOString(),
    };
  }
}
