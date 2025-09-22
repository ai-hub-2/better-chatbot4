import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { sandboxJobManager } from "lib/sandbox/job-manager";

export async function fix(
  ctx: { projectId: string; prompt: string; logs: string[] },
  testResult: {
    passed: boolean;
    testResults: Array<{
      name: string;
      passed: boolean;
      output: string;
      error?: string;
      type: string;
    }>;
    coverage: number;
    summary: {
      total: number;
      passed: number;
      failed: number;
      duration: number;
    };
  },
) {
  ctx.logs.push(`🔧 Analyzing test failures and fixing issues...`);

  if (testResult.passed) {
    ctx.logs.push(`✅ All tests passed, no fixes needed`);
    return {
      fixed: true,
      fixes: [],
      summary: "No issues found",
    };
  }

  const failedTests = testResult.testResults.filter((t) => !t.passed);
  const fixes: Array<{
    testName: string;
    description: string;
    type: string;
    files: any[];
    commands: any[];
    explanation: string;
    applied: boolean;
  }> = [];

  for (const failedTest of failedTests) {
    ctx.logs.push(`🔍 Analyzing failure: ${failedTest.name}`);

    try {
      const fix = await generateFix(failedTest, ctx);
      if (fix) {
        fixes.push(fix);

        // Apply the fix
        const applied = await applyFix(fix, ctx);
        if (applied) {
          ctx.logs.push(`✅ Applied fix for ${failedTest.name}`);
        } else {
          ctx.logs.push(`❌ Failed to apply fix for ${failedTest.name}`);
        }
      }
    } catch (error) {
      ctx.logs.push(
        `💥 Error fixing ${failedTest.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  const fixedCount = fixes.filter((f) => f.applied).length;
  ctx.logs.push(
    `🎯 Fix phase complete: ${fixedCount}/${fixes.length} fixes applied`,
  );

  return {
    fixed: fixedCount > 0,
    fixes,
    summary: `Applied ${fixedCount} fixes out of ${fixes.length} attempted`,
  };
}

async function generateFix(failedTest: any, ctx: any) {
  try {
    const response = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "system",
          content: `You are a debugging expert. Analyze the test failure and provide a specific fix.

Return a JSON object with:
- description: what the issue is
- type: "code_fix" | "dependency_fix" | "config_fix" | "test_fix"
- files: array of files to modify with their new content
- commands: array of shell commands to run
- explanation: why this fix should work

Be specific and actionable. Focus on the root cause of the failure.`,
        },
        {
          role: "user",
          content: `Test: ${failedTest.name}
Type: ${failedTest.type}
Output: ${failedTest.output}
Error: ${failedTest.error || "None"}

Please provide a fix for this test failure.`,
        },
      ],
      temperature: 0.2,
    });

    const fix = JSON.parse(response.text || "{}");

    return {
      testName: failedTest.name,
      description: fix.description || "Unknown issue",
      type: fix.type || "code_fix",
      files: fix.files || [],
      commands: fix.commands || [],
      explanation: fix.explanation || "",
      applied: false,
    };
  } catch (error) {
    ctx.logs.push(
      `❌ Failed to generate fix: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return null;
  }
}

async function applyFix(fix: any, ctx: any): Promise<boolean> {
  try {
    // Apply file changes
    for (const file of fix.files) {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/studio/files`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: file.path,
            content: file.content,
          }),
        },
      );

      if (!response.ok) {
        ctx.logs.push(`❌ Failed to update file: ${file.path}`);
        return false;
      }
    }

    // Run commands
    for (const command of fix.commands) {
      const job = sandboxJobManager.start({
        image: "node:18-alpine",
        cmd: "sh",
        args: ["-c", command],
        workdir: "/workspace",
        network: "bridge",
      });

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const jobState = sandboxJobManager.get(job.id);
      if (jobState?.status !== "exited" || jobState.exitCode !== 0) {
        ctx.logs.push(`❌ Command failed: ${command}`);
        return false;
      }
    }

    fix.applied = true;
    return true;
  } catch (error) {
    ctx.logs.push(
      `❌ Error applying fix: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return false;
  }
}
