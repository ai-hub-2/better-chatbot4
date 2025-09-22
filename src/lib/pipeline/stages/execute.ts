import { sandboxJobManager } from "lib/sandbox/job-manager";

export async function execute(
  ctx: { projectId: string; prompt: string; logs: string[] },
  plan: {
    steps: Array<{
      id: string;
      name: string;
      type: string;
      description: string;
      files?: Array<{ path: string; content: string }>;
      commands?: string[];
      dependencies?: string[];
      order: number;
    }>;
    estimated_duration: number;
    dependencies: string[];
  },
) {
  ctx.logs.push(`🚀 Executing ${plan.steps.length} steps...`);

  const results: Array<{
    stepId: string;
    stepName: string;
    success: boolean;
    output: string;
    error: string | null;
  }> = [];
  const sortedSteps = plan.steps.sort((a, b) => a.order - b.order);

  for (const step of sortedSteps) {
    ctx.logs.push(`📝 Step ${step.order}: ${step.name}`);

    try {
      let stepResult: any = { success: false };

      switch (step.type) {
        case "file_creation":
        case "file_modification":
          stepResult = await executeFileOperations(step, ctx);
          break;

        case "command":
          stepResult = await executeCommands(step, ctx);
          break;

        case "dependency_install":
          stepResult = await installDependencies(step, ctx);
          break;

        case "test":
          stepResult = await runTests(step, ctx);
          break;

        case "deploy":
          stepResult = await deployApplication(step, ctx);
          break;

        default:
          ctx.logs.push(`⚠️ Unknown step type: ${step.type}`);
          stepResult = {
            success: false,
            error: `Unknown step type: ${step.type}`,
          };
      }

      results.push({
        stepId: step.id,
        stepName: step.name,
        success: stepResult.success,
        output: stepResult.output || "",
        error: stepResult.error || null,
      });

      if (stepResult.success) {
        ctx.logs.push(`✅ ${step.name} completed successfully`);
      } else {
        ctx.logs.push(`❌ ${step.name} failed: ${stepResult.error}`);
      }
    } catch (error) {
      ctx.logs.push(
        `💥 Step ${step.name} crashed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      results.push({
        stepId: step.id,
        stepName: step.name,
        success: false,
        output: "",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  ctx.logs.push(
    `🎯 Execution complete: ${successCount}/${results.length} steps successful`,
  );

  return {
    ok: successCount > 0,
    results,
    successCount,
    totalSteps: results.length,
  };
}

async function executeFileOperations(step: any, ctx: any) {
  if (!step.files || step.files.length === 0) {
    return { success: false, error: "No files specified" };
  }

  const fileResults: Array<{
    path: string;
    success: boolean;
    error?: string;
  }> = [];
  for (const file of step.files) {
    try {
      // Use the studio files API to create/modify files
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

      if (response.ok) {
        fileResults.push({ path: file.path, success: true });
        ctx.logs.push(`📄 Created/modified: ${file.path}`);
      } else {
        fileResults.push({
          path: file.path,
          success: false,
          error: await response.text(),
        });
      }
    } catch (error) {
      fileResults.push({
        path: file.path,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    success: fileResults.every((f) => f.success),
    output: `Processed ${fileResults.length} files`,
    fileResults,
  };
}

async function executeCommands(step: any, ctx: any) {
  if (!step.commands || step.commands.length === 0) {
    return { success: false, error: "No commands specified" };
  }

  const commandResults: Array<{
    command: string;
    success: boolean;
    output?: string;
    error?: string;
  }> = [];
  for (const command of step.commands) {
    try {
      const job = sandboxJobManager.start({
        image: "node:18-alpine",
        cmd: "sh",
        args: ["-c", command],
        workdir: "/workspace",
        network: "bridge",
      });

      // Wait for completion (simplified - in production, use proper async handling)
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const jobState = sandboxJobManager.get(job.id);
      if (jobState?.status === "exited" && jobState.exitCode === 0) {
        commandResults.push({
          command,
          success: true,
          output: jobState.logs.join("\n"),
        });
        ctx.logs.push(`🔧 Command executed: ${command}`);
      } else {
        commandResults.push({
          command,
          success: false,
          error: jobState?.logs.join("\n") || "Command failed",
        });
      }
    } catch (error) {
      commandResults.push({
        command,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    success: commandResults.every((c) => c.success),
    output: `Executed ${commandResults.length} commands`,
    commandResults,
  };
}

async function installDependencies(step: any, ctx: any) {
  if (!step.dependencies || step.dependencies.length === 0) {
    return { success: false, error: "No dependencies specified" };
  }

  const installCommand = `npm install ${step.dependencies.join(" ")}`;

  try {
    const job = sandboxJobManager.start({
      image: "node:18-alpine",
      cmd: "sh",
      args: ["-c", installCommand],
      workdir: "/workspace",
      network: "bridge",
    });

    await new Promise((resolve) => setTimeout(resolve, 10000));

    const jobState = sandboxJobManager.get(job.id);
    if (jobState?.status === "exited" && jobState.exitCode === 0) {
      ctx.logs.push(
        `📦 Dependencies installed: ${step.dependencies.join(", ")}`,
      );
      return { success: true, output: jobState.logs.join("\n") };
    } else {
      return {
        success: false,
        error: jobState?.logs.join("\n") || "Installation failed",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function runTests(_step: any, ctx: any) {
  try {
    const testCommand = "npm test";

    const job = sandboxJobManager.start({
      image: "node:18-alpine",
      cmd: "sh",
      args: ["-c", testCommand],
      workdir: "/workspace",
      network: "bridge",
    });

    await new Promise((resolve) => setTimeout(resolve, 15000));

    const jobState = sandboxJobManager.get(job.id);
    if (jobState?.status === "exited" && jobState.exitCode === 0) {
      ctx.logs.push(`🧪 Tests passed`);
      return { success: true, output: jobState.logs.join("\n") };
    } else {
      ctx.logs.push(`🧪 Tests failed`);
      return {
        success: false,
        error: jobState?.logs.join("\n") || "Tests failed",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function deployApplication(_step: any, ctx: any) {
  try {
    // Trigger deployment via the deploy API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/deploy/hooks`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "vercel",
          projectId: ctx.projectId,
        }),
      },
    );

    if (response.ok) {
      ctx.logs.push(`🚀 Deployment triggered successfully`);
      return { success: true, output: "Deployment initiated" };
    } else {
      return { success: false, error: await response.text() };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
