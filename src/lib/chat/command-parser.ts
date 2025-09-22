export type ChatCommand =
  | { type: "pipeline.run"; projectId: string; prompt: string }
  | { type: "workflow.create"; name: string; description?: string }
  | { type: "workflow.update"; name: string; patch: string }
  | { type: "workflow.execute"; name: string; query?: string }
  | { type: "agent.create"; name: string; model: string; tools?: string[] }
  | { type: "agent.update"; name: string; patch: string }
  | {
      type: "mcp.invoke";
      server: string;
      tool: string;
      args: Record<string, any>;
    }
  | { type: "model.select"; model: string };

export function parseChatCommand(text: string): ChatCommand | null {
  const t = text.trim();
  const lower = t.toLowerCase();

  // pipeline
  if (/^(build|create|scaffold|generate)\b/.test(lower)) {
    return { type: "pipeline.run", projectId: "auto", prompt: t };
  }

  // workflow create
  let m = t.match(
    /^create\s+workflow\s+named\s+([^\s].*?)(?:\s+with\s+description\s+(.+))?$/i,
  );
  if (m)
    return {
      type: "workflow.create",
      name: m[1].trim(),
      description: m[2]?.trim(),
    };

  // workflow update
  m = t.match(/^update\s+workflow\s+([^:]+):\s*(.+)$/i);
  if (m)
    return { type: "workflow.update", name: m[1].trim(), patch: m[2].trim() };

  // workflow execute
  m = t.match(/^run\s+workflow\s+([^\s].*?)(?:\s+with\s+query\s+'(.+?)')?$/i);
  if (m) return { type: "workflow.execute", name: m[1].trim(), query: m[2] };

  // agent create
  m = t.match(
    /^create\s+agent\s+'?([^']+)'?\s+using\s+model\s+([^,]+)(?:,\s*tools:\s*(.+))?$/i,
  );
  if (m)
    return {
      type: "agent.create",
      name: m[1].trim(),
      model: m[2].trim(),
      tools: m[3]?.split(/\s*,\s*/),
    };

  // agent update
  m = t.match(/^update\s+agent\s+([^:]+):\s*(.+)$/i);
  if (m) return { type: "agent.update", name: m[1].trim(), patch: m[2].trim() };

  // model select
  m = t.match(/^use\s+model\s+([^\s]+)$/i);
  if (m) return { type: "model.select", model: m[1].trim() };

  // mcp invoke
  m = t.match(/^mcp:server=(\S+)\s+tool=(\S+)(?:\s+(.+))?$/i);
  if (m) {
    const args: Record<string, any> = {};
    const rest = m[3] || "";
    rest.split(/\s+/).forEach((kv) => {
      const [k, v] = kv.split("=");
      if (k && v) args[k] = v;
    });
    return { type: "mcp.invoke", server: m[1], tool: m[2], args };
  }

  return null;
}
