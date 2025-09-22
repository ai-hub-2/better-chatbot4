import { randomUUID } from "node:crypto";
import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";

export type SandboxJobSpec = {
  image: string;
  cmd: string;
  args?: string[];
  workdir?: string;
  env?: Record<string, string>;
  mounts?: { host: string; target: string; readonly?: boolean }[];
  network?: "none" | "bridge";
  cpus?: string;
  memory?: string;
};

export type SandboxJobState = {
  id: string;
  pid?: number;
  spec: SandboxJobSpec;
  status: "running" | "exited" | "error";
  exitCode?: number | null;
  startedAt: number;
  endedAt?: number;
  logs: string[];
};

class SandboxJobManager {
  private jobs: Map<string, SandboxJobState> = new Map();
  private processes: Map<string, ChildProcessWithoutNullStreams> = new Map();

  list(): SandboxJobState[] {
    return Array.from(this.jobs.values());
  }

  get(id: string): SandboxJobState | undefined {
    return this.jobs.get(id);
  }

  start(spec: SandboxJobSpec): SandboxJobState {
    const id = randomUUID();
    const state: SandboxJobState = {
      id,
      spec,
      status: "running",
      startedAt: Date.now(),
      logs: [],
    };

    const dockerArgs: string[] = [
      "run",
      "--rm",
      "--name",
      `job_${id}`,
      "--network",
      spec.network ?? "none",
      "--cpus",
      spec.cpus ?? "1",
      "--memory",
      spec.memory ?? "1g",
    ];

    if (spec.workdir) dockerArgs.push("-w", spec.workdir);
    Object.entries(spec.env ?? {}).forEach(([k, v]) =>
      dockerArgs.push("-e", `${k}=${v}`),
    );
    (spec.mounts ?? []).forEach((m) => {
      const ro = m.readonly ? ":ro" : "";
      dockerArgs.push("-v", `${m.host}:${m.target}${ro}`);
    });

    dockerArgs.push(spec.image, spec.cmd, ...(spec.args ?? []));

    const child = spawn("docker", dockerArgs, { env: process.env });
    this.jobs.set(id, state);
    this.processes.set(id, child);
    state.pid = child.pid ?? undefined;

    const onData = (buf: Buffer) => {
      const s = buf.toString();
      state.logs.push(s);
      // Keep memory bounded
      if (state.logs.length > 5000)
        state.logs.splice(0, state.logs.length - 5000);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("close", (code) => {
      state.status = "exited";
      state.exitCode = code ?? null;
      state.endedAt = Date.now();
      this.processes.delete(id);
    });
    child.on("error", (err) => {
      state.status = "error";
      state.logs.push(`[error] ${err.message}`);
      state.endedAt = Date.now();
      this.processes.delete(id);
    });

    return state;
  }

  stop(id: string): boolean {
    const proc = this.processes.get(id);
    if (!proc) return false;
    try {
      proc.kill("SIGTERM");
      return true;
    } catch {
      return false;
    }
  }
}

export const sandboxJobManager = new SandboxJobManager();
