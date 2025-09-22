import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function analyze(ctx: {
  projectId: string;
  prompt: string;
  logs: string[];
}) {
  ctx.logs.push(`🔍 Analyzing requirements: ${ctx.prompt.slice(0, 100)}...`);

  try {
    const response = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "system",
          content: `You are a software architect. Analyze the user's request and break it down into clear, actionable objectives.

Return a JSON object with:
- objectives: array of specific, measurable goals
- requirements: array of technical requirements
- constraints: array of limitations or constraints
- technologies: array of suggested technologies/frameworks

Be specific and actionable. Focus on what needs to be built, not how to build it.`,
        },
        {
          role: "user",
          content: ctx.prompt,
        },
      ],
      temperature: 0.3,
    });

    const analysis = JSON.parse(response.text || "{}");

    ctx.logs.push(
      `✅ Analysis complete: ${analysis.objectives?.length || 0} objectives identified`,
    );

    return {
      objectives: analysis.objectives || [ctx.prompt],
      requirements: analysis.requirements || [],
      constraints: analysis.constraints || [],
      technologies: analysis.technologies || [],
    };
  } catch (error) {
    ctx.logs.push(
      `❌ Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return {
      objectives: [ctx.prompt],
      requirements: [],
      constraints: [],
      technologies: [],
    };
  }
}
