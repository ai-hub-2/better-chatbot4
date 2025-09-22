export const runtime = "nodejs";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
  UIMessage,
} from "ai";

import { customModelProvider, isToolCallUnsupportedModel } from "lib/ai/models";

import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";

import { agentRepository, chatRepository } from "lib/db/repository";
import globalLogger from "logger";
import {
  buildMcpServerCustomizationsSystemPrompt,
  buildUserSystemPrompt,
  buildToolCallUnsupportedModelSystemPrompt,
} from "lib/ai/prompts";
import { chatApiSchemaRequestBodySchema, ChatMetadata } from "app-types/chat";

import { errorIf, safe } from "ts-safe";

import {
  excludeToolExecution,
  handleError,
  manualToolExecuteByLastMessage,
  mergeSystemPrompt,
  extractInProgressToolPart,
  filterMcpServerCustomizations,
  loadMcpTools,
  loadWorkFlowTools,
  loadAppDefaultTools,
  convertToSavePart,
} from "./shared.chat";
import {
  rememberAgentAction,
  rememberMcpServerCustomizationsAction,
} from "./actions";
import { getSession } from "auth/server";
import { colorize } from "consola/utils";
import { generateUUID } from "lib/utils";
import { parseChatCommand } from "lib/chat/command-parser";
import { hasProjectPermission } from "lib/security/rbac";
import { auditLog } from "lib/security/audit";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Chat API: `),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();

    const session = await getSession();

    if (!session?.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }
    const {
      id,
      message,
      chatModel,
      toolChoice,
      allowedAppDefaultToolkit,
      allowedMcpServers,
      mentions = [],
    } = chatApiSchemaRequestBodySchema.parse(json);

    const model = customModelProvider.getModel(chatModel);

    let thread = await chatRepository.selectThreadDetails(id);

    if (!thread) {
      logger.info(`create chat thread: ${id}`);
      const newThread = await chatRepository.insertThread({
        id,
        title: "",
        userId: session.user.id,
      });
      thread = await chatRepository.selectThreadDetails(newThread.id);
    }

    if (thread!.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    const messages: UIMessage[] = (thread?.messages ?? []).map((m) => {
      return {
        id: m.id,
        role: m.role,
        parts: m.parts,
        metadata: m.metadata,
      };
    });

    if (messages.at(-1)?.id == message.id) {
      messages.pop();
    }
    messages.push(message);

    const supportToolCall = !isToolCallUnsupportedModel(model);

    const agentId = mentions.find((m) => m.type === "agent")?.agentId;

    const agent = await rememberAgentAction(agentId, session.user.id);

    if (agent?.instructions?.mentions) {
      mentions.push(...agent.instructions.mentions);
    }

    const isToolCallAllowed =
      supportToolCall && (toolChoice != "none" || mentions.length > 0);

    const metadata: ChatMetadata = {
      agentId: agent?.id,
      toolChoice: toolChoice,
      toolCount: 0,
      chatModel: chatModel,
    };

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        const mcpClients = await mcpClientsManager.getClients();
        const mcpTools = await mcpClientsManager.tools();
        logger.info(
          `mcp-server count: ${mcpClients.length}, mcp-tools count :${Object.keys(mcpTools).length}`,
        );
        const MCP_TOOLS = await safe()
          .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
          .map(() =>
            loadMcpTools({
              mentions,
              allowedMcpServers,
            }),
          )
          .orElse({});

        const WORKFLOW_TOOLS = await safe()
          .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
          .map(() =>
            loadWorkFlowTools({
              mentions,
              dataStream,
            }),
          )
          .orElse({});

        const APP_DEFAULT_TOOLS = await safe()
          .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
          .map(() =>
            loadAppDefaultTools({
              mentions,
              allowedAppDefaultToolkit,
            }),
          )
          .orElse({});
        const inProgressToolParts = extractInProgressToolPart(message);
        if (inProgressToolParts.length) {
          await Promise.all(
            inProgressToolParts.map(async (part) => {
              const output = await manualToolExecuteByLastMessage(
                part,
                { ...MCP_TOOLS, ...WORKFLOW_TOOLS, ...APP_DEFAULT_TOOLS },
                request.signal,
              );
              part.output = output;

              dataStream.write({
                type: "tool-output-available",
                toolCallId: part.toolCallId,
                output,
              });
            }),
          );
        }

        const userPreferences = thread?.userPreferences || undefined;

        const mcpServerCustomizations = await safe()
          .map(() => {
            if (Object.keys(MCP_TOOLS ?? {}).length === 0)
              throw new Error("No tools found");
            return rememberMcpServerCustomizationsAction(session.user.id);
          })
          .map((v) => filterMcpServerCustomizations(MCP_TOOLS!, v))
          .orElse({});

        const systemPrompt = mergeSystemPrompt(
          buildUserSystemPrompt(session.user, userPreferences, agent),
          buildMcpServerCustomizationsSystemPrompt(mcpServerCustomizations),
          !supportToolCall && buildToolCallUnsupportedModelSystemPrompt,
        );

        const vercelAITooles = safe({ ...MCP_TOOLS, ...WORKFLOW_TOOLS })
          .map((t) => {
            const bindingTools =
              toolChoice === "manual" ||
              (message.metadata as ChatMetadata)?.toolChoice === "manual"
                ? excludeToolExecution(t)
                : t;
            return {
              ...bindingTools,
              ...APP_DEFAULT_TOOLS, // APP_DEFAULT_TOOLS Not Supported Manual
            };
          })
          .unwrap();
        metadata.toolCount = Object.keys(vercelAITooles).length;

        const allowedMcpTools = Object.values(allowedMcpServers ?? {})
          .map((t) => t.tools)
          .flat();

        logger.info(
          `${agent ? `agent: ${agent.name}, ` : ""}tool mode: ${toolChoice}, mentions: ${mentions.length}`,
        );

        logger.info(
          `allowedMcpTools: ${allowedMcpTools.length ?? 0}, allowedAppDefaultToolkit: ${allowedAppDefaultToolkit?.length ?? 0}`,
        );
        logger.info(
          `binding tool count APP_DEFAULT: ${Object.keys(APP_DEFAULT_TOOLS ?? {}).length}, MCP: ${Object.keys(MCP_TOOLS ?? {}).length}, Workflow: ${Object.keys(WORKFLOW_TOOLS ?? {}).length}`,
        );
        logger.info(`model: ${chatModel?.provider}/${chatModel?.model}`);

        const result = streamText({
          model,
          system: systemPrompt,
          messages: convertToModelMessages(messages),
          experimental_transform: smoothStream({ chunking: "word" }),
          maxRetries: 2,
          tools: vercelAITooles,
          stopWhen: stepCountIs(10),
          toolChoice: "auto",
          abortSignal: request.signal,
        });
        result.consumeStream();
        dataStream.merge(
          result.toUIMessageStream({
            messageMetadata: ({ part }) => {
              if (part.type == "finish") {
                metadata.usage = part.totalUsage;
                return metadata;
              }
            },
          }),
        );
      },

      generateId: generateUUID,
      onFinish: async ({ responseMessage }) => {
        if (responseMessage.id == message.id) {
          await chatRepository.upsertMessage({
            threadId: thread!.id,
            ...responseMessage,
            parts: responseMessage.parts.map(convertToSavePart),
            metadata,
          });
        } else {
          await chatRepository.upsertMessage({
            threadId: thread!.id,
            role: message.role,
            parts: message.parts.map(convertToSavePart),
            id: message.id,
          });
          await chatRepository.upsertMessage({
            threadId: thread!.id,
            role: responseMessage.role,
            id: responseMessage.id,
            parts: responseMessage.parts.map(convertToSavePart),
            metadata,
          });
        }

        if (agent) {
          agentRepository.updateAgent(agent.id, session.user.id, {
            updatedAt: new Date(),
          } as any);
        }

        // Strict command parsing and RBAC
        try {
          const lastUserText = (message.parts || [])
            .map((p: any) =>
              typeof p.text === "string" ? p.text : p.content || "",
            )
            .join(" ")
            .toLowerCase();
          const cmd = parseChatCommand(lastUserText);
          if (cmd) {
            const projectId = thread!.id;
            const userId = session.user.id;
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
            const ip = request.headers.get("x-forwarded-for") || "unknown";
            const userAgent = request.headers.get("user-agent") || "unknown";

            try {
              if (cmd.type === "pipeline.run") {
                const hasAccess = await hasProjectPermission(
                  userId,
                  projectId,
                  "pipeline:run",
                );
                if (!hasAccess) {
                  await auditLog(userId, "pipeline.run.denied", "project", {
                    resourceId: projectId,
                    ip,
                    userAgent,
                    success: false,
                    error: "Insufficient permissions",
                  });
                  return;
                }
                await auditLog(userId, "pipeline.run", "project", {
                  resourceId: projectId,
                  metadata: { prompt: cmd.prompt },
                  ip,
                  userAgent,
                });
                fetch(`${baseUrl}/api/pipeline`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ projectId, prompt: cmd.prompt }),
                }).catch(() => undefined);
              } else if (cmd.type === "workflow.create") {
                const hasAccess = await hasProjectPermission(
                  userId,
                  projectId,
                  "workflow:create",
                );
                if (!hasAccess) {
                  await auditLog(userId, "workflow.create.denied", "workflow", {
                    ip,
                    userAgent,
                    success: false,
                    error: "Insufficient permissions",
                  });
                  return;
                }
                await auditLog(userId, "workflow.create", "workflow", {
                  metadata: { name: cmd.name, description: cmd.description },
                  ip,
                  userAgent,
                });
                fetch(`${baseUrl}/api/workflow`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: cmd.name,
                    description: cmd.description,
                  }),
                }).catch(() => undefined);
              } else if (cmd.type === "workflow.update") {
                const hasAccess = await hasProjectPermission(
                  userId,
                  projectId,
                  "workflow:update",
                );
                if (!hasAccess) {
                  await auditLog(userId, "workflow.update.denied", "workflow", {
                    ip,
                    userAgent,
                    success: false,
                    error: "Insufficient permissions",
                  });
                  return;
                }
                await auditLog(userId, "workflow.update", "workflow", {
                  metadata: { name: cmd.name, patch: cmd.patch },
                  ip,
                  userAgent,
                });
              } else if (cmd.type === "workflow.execute") {
                const hasAccess = await hasProjectPermission(
                  userId,
                  projectId,
                  "workflow:execute",
                );
                if (!hasAccess) {
                  await auditLog(
                    userId,
                    "workflow.execute.denied",
                    "workflow",
                    {
                      ip,
                      userAgent,
                      success: false,
                      error: "Insufficient permissions",
                    },
                  );
                  return;
                }
                await auditLog(userId, "workflow.execute", "workflow", {
                  metadata: { name: cmd.name, query: cmd.query },
                  ip,
                  userAgent,
                });
              } else if (cmd.type === "agent.create") {
                const hasAccess = await hasProjectPermission(
                  userId,
                  projectId,
                  "agent:create",
                );
                if (!hasAccess) {
                  await auditLog(userId, "agent.create.denied", "agent", {
                    ip,
                    userAgent,
                    success: false,
                    error: "Insufficient permissions",
                  });
                  return;
                }
                await auditLog(userId, "agent.create", "agent", {
                  metadata: {
                    name: cmd.name,
                    model: cmd.model,
                    tools: cmd.tools,
                  },
                  ip,
                  userAgent,
                });
              } else if (cmd.type === "agent.update") {
                const hasAccess = await hasProjectPermission(
                  userId,
                  projectId,
                  "agent:update",
                );
                if (!hasAccess) {
                  await auditLog(userId, "agent.update.denied", "agent", {
                    ip,
                    userAgent,
                    success: false,
                    error: "Insufficient permissions",
                  });
                  return;
                }
                await auditLog(userId, "agent.update", "agent", {
                  metadata: { name: cmd.name, patch: cmd.patch },
                  ip,
                  userAgent,
                });
              } else if (cmd.type === "mcp.invoke") {
                const hasAccess = await hasProjectPermission(
                  userId,
                  projectId,
                  "mcp:invoke",
                );
                if (!hasAccess) {
                  await auditLog(userId, "mcp.invoke.denied", "mcp", {
                    ip,
                    userAgent,
                    success: false,
                    error: "Insufficient permissions",
                  });
                  return;
                }
                await auditLog(userId, "mcp.invoke", "mcp", {
                  metadata: {
                    server: cmd.server,
                    tool: cmd.tool,
                    args: cmd.args,
                  },
                  ip,
                  userAgent,
                });
              } else if (cmd.type === "model.select") {
                await auditLog(userId, "model.select", "chat", {
                  metadata: { model: cmd.model },
                  ip,
                  userAgent,
                });
              }
            } catch (error) {
              await auditLog(userId, "command.error", "chat", {
                metadata: { command: cmd.type },
                ip,
                userAgent,
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
          }
        } catch {}
      },
      onError: handleError,
      originalMessages: messages,
    });

    return createUIMessageStreamResponse({
      stream,
    });
  } catch (error: any) {
    logger.error(error);
    return Response.json({ message: error.message }, { status: 500 });
  }
}
