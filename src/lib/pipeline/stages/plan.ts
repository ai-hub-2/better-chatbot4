import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function plan(
  ctx: { projectId: string; prompt: string; logs: string[] },
  analysis: {
    objectives: string[];
    requirements: string[];
    constraints: string[];
    technologies: string[];
  },
) {
  ctx.logs.push(
    `📋 Planning execution for ${analysis.objectives.length} objectives...`,
  );

  try {
    const response = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "system",
          content: `You are a software development planner. Create a detailed execution plan based on the analysis.

Return a JSON object with:
- steps: array of execution steps, each with:
  - id: unique identifier
  - name: descriptive name
  - type: "file_creation" | "file_modification" | "command" | "dependency_install" | "test" | "deploy"
  - description: what this step does
  - files: array of files to create/modify (if applicable)
  - commands: array of shell commands to run (if applicable)
  - dependencies: array of dependencies to install (if applicable)
  - order: execution order number
- estimated_duration: estimated time in minutes
- dependencies: array of external dependencies needed

Be specific about file paths, commands, and dependencies. Order steps logically.`,
        },
        {
          role: "user",
          content: `Objectives: ${JSON.stringify(analysis.objectives)}
Requirements: ${JSON.stringify(analysis.requirements)}
Constraints: ${JSON.stringify(analysis.constraints)}
Technologies: ${JSON.stringify(analysis.technologies)}`,
        },
      ],
      temperature: 0.3,
    });

    const plan = JSON.parse(response.text || "{}");

    ctx.logs.push(
      `✅ Plan created: ${plan.steps?.length || 0} steps, estimated ${plan.estimated_duration || 0} minutes`,
    );

    return {
      steps: plan.steps || [],
      estimated_duration: plan.estimated_duration || 30,
      dependencies: plan.dependencies || [],
    };
  } catch (error) {
    ctx.logs.push(
      `❌ Planning failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return {
      steps: [],
      estimated_duration: 30,
      dependencies: [],
    };
  }
}
