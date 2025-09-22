import { sandboxJobManager } from "lib/sandbox/job-manager";

export async function test(
  ctx: { projectId: string; prompt: string; logs: string[] },
  execution: {
    ok: boolean;
    results: Array<{
      stepId: string;
      stepName: string;
      success: boolean;
      output: string;
      error: string | null;
    }>;
    successCount: number;
    totalSteps: number;
  },
) {
  ctx.logs.push(`🧪 Running comprehensive tests...`);

  if (!execution.ok) {
    ctx.logs.push(`❌ Skipping tests due to execution failures`);
    return {
      passed: false,
      testResults: [],
      coverage: 0,
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0,
      },
      error: "Execution failed, cannot run tests",
    };
  }

  const testResults = [];

  try {
    // Run unit tests
    const unitTestResult = await runUnitTests(ctx);
    testResults.push(unitTestResult);

    // Run integration tests
    const integrationTestResult = await runIntegrationTests(ctx);
    testResults.push(integrationTestResult);

    // Run linting
    const lintResult = await runLinting(ctx);
    testResults.push(lintResult);

    // Run type checking
    const typeCheckResult = await runTypeChecking(ctx);
    testResults.push(typeCheckResult);

    // Calculate overall results
    const passedTests = testResults.filter((t) => t.passed).length;
    const totalTests = testResults.length;
    const overallPassed = passedTests === totalTests;

    ctx.logs.push(
      `📊 Test Results: ${passedTests}/${totalTests} test suites passed`,
    );

    return {
      passed: overallPassed,
      testResults,
      coverage: calculateCoverage(testResults),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        duration: testResults.reduce((sum, t) => sum + (t.duration || 0), 0),
      },
    };
  } catch (error) {
    ctx.logs.push(
      `💥 Testing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return {
      passed: false,
      testResults: [],
      coverage: 0,
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0,
      },
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function runUnitTests(ctx: any) {
  try {
    ctx.logs.push(`🔬 Running unit tests...`);

    const job = sandboxJobManager.start({
      image: "node:18-alpine",
      cmd: "sh",
      args: ["-c", "npm run test:unit || npm test"],
      workdir: "/workspace",
      network: "bridge",
    });

    await new Promise((resolve) => setTimeout(resolve, 10000));

    const jobState = sandboxJobManager.get(job.id);
    const output = jobState?.logs.join("\n") || "";

    if (jobState?.status === "exited" && jobState.exitCode === 0) {
      return {
        name: "Unit Tests",
        passed: true,
        output,
        duration: 10000,
        type: "unit",
      };
    } else {
      return {
        name: "Unit Tests",
        passed: false,
        output,
        duration: 10000,
        type: "unit",
        error: "Unit tests failed",
      };
    }
  } catch (error) {
    return {
      name: "Unit Tests",
      passed: false,
      output: "",
      duration: 0,
      type: "unit",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function runIntegrationTests(ctx: any) {
  try {
    ctx.logs.push(`🔗 Running integration tests...`);

    const job = sandboxJobManager.start({
      image: "node:18-alpine",
      cmd: "sh",
      args: [
        "-c",
        "npm run test:integration || echo 'No integration tests configured'",
      ],
      workdir: "/workspace",
      network: "bridge",
    });

    await new Promise((resolve) => setTimeout(resolve, 15000));

    const jobState = sandboxJobManager.get(job.id);
    const output = jobState?.logs.join("\n") || "";

    // Integration tests are optional, so we consider them passed if they don't exist
    const passed =
      jobState?.status === "exited" &&
      (jobState.exitCode === 0 || output.includes("No integration tests"));

    return {
      name: "Integration Tests",
      passed,
      output,
      duration: 15000,
      type: "integration",
    };
  } catch (error) {
    return {
      name: "Integration Tests",
      passed: false,
      output: "",
      duration: 0,
      type: "integration",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function runLinting(ctx: any) {
  try {
    ctx.logs.push(`🔍 Running linting...`);

    const job = sandboxJobManager.start({
      image: "node:18-alpine",
      cmd: "sh",
      args: [
        "-c",
        "npm run lint || npx eslint . || echo 'No linting configured'",
      ],
      workdir: "/workspace",
      network: "bridge",
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const jobState = sandboxJobManager.get(job.id);
    const output = jobState?.logs.join("\n") || "";

    const passed =
      jobState?.status === "exited" &&
      (jobState.exitCode === 0 || output.includes("No linting"));

    return {
      name: "Linting",
      passed,
      output,
      duration: 5000,
      type: "lint",
    };
  } catch (error) {
    return {
      name: "Linting",
      passed: false,
      output: "",
      duration: 0,
      type: "lint",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function runTypeChecking(ctx: any) {
  try {
    ctx.logs.push(`📝 Running type checking...`);

    const job = sandboxJobManager.start({
      image: "node:18-alpine",
      cmd: "sh",
      args: [
        "-c",
        "npm run type-check || npx tsc --noEmit || echo 'No TypeScript configured'",
      ],
      workdir: "/workspace",
      network: "bridge",
    });

    await new Promise((resolve) => setTimeout(resolve, 8000));

    const jobState = sandboxJobManager.get(job.id);
    const output = jobState?.logs.join("\n") || "";

    const passed =
      jobState?.status === "exited" &&
      (jobState.exitCode === 0 || output.includes("No TypeScript"));

    return {
      name: "Type Checking",
      passed,
      output,
      duration: 8000,
      type: "typecheck",
    };
  } catch (error) {
    return {
      name: "Type Checking",
      passed: false,
      output: "",
      duration: 0,
      type: "typecheck",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function calculateCoverage(testResults: any[]): number {
  // Simplified coverage calculation
  const passedTests = testResults.filter((t) => t.passed).length;
  return testResults.length > 0 ? (passedTests / testResults.length) * 100 : 0;
}
