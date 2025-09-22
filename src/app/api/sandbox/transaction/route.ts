import { NextRequest } from "next/server";
export const runtime = "nodejs";
import { spawn } from "node:child_process";

type Step = { cmd: string; args?: string[] };

export async function POST(req: NextRequest) {
  try {
    const { path, steps } = (await req.json()) as {
      path: string;
      steps: Step[];
    };
    if (!path || !Array.isArray(steps) || steps.length === 0) {
      return Response.json(
        { error: "path and steps required" },
        { status: 400 },
      );
    }
    // snapshot
    const snapshot = await snapshotPath(path);
    const logs: string[] = [];
    for (const s of steps) {
      const { code, out, err } = await runCmd(s.cmd, s.args ?? [], {
        cwd: path,
      });
      logs.push(out, err);
      if (code !== 0) {
        await restorePath(path, snapshot);
        return Response.json({
          ok: false,
          error: `step failed: ${s.cmd}`,
          logs,
        });
      }
    }
    return Response.json({ ok: true, logs });
  } catch (e: any) {
    return Response.json({ error: e?.message || "unknown" }, { status: 500 });
  }
}

function snapshotPath(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tar = spawn("tar", ["-C", path, "-czf", "-", "."], {
      env: process.env,
    });
    const chunks: Buffer[] = [];
    const errs: Buffer[] = [];
    tar.stdout.on("data", (c) => chunks.push(Buffer.from(c)));
    tar.stderr.on("data", (c) => errs.push(Buffer.from(c)));
    tar.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(chunks).toString("base64"));
      else
        reject(new Error(Buffer.concat(errs).toString() || `tar exit ${code}`));
    });
  });
}

function restorePath(path: string, snapshot: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tar = spawn("tar", ["-C", path, "-xzf", "-"], { env: process.env });
    tar.stdin.write(Buffer.from(snapshot, "base64"));
    tar.stdin.end();
    const errs: Buffer[] = [];
    tar.stderr.on("data", (c) => errs.push(Buffer.from(c)));
    tar.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(new Error(Buffer.concat(errs).toString() || `tar exit ${code}`));
    });
  });
}

function runCmd(
  cmd: string,
  args: string[],
  opt: { cwd?: string },
): Promise<{ code: number; out: string; err: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { env: process.env, cwd: opt.cwd });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on("data", (c) => out.push(Buffer.from(c)));
    child.stderr.on("data", (c) => err.push(Buffer.from(c)));
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        out: Buffer.concat(out).toString(),
        err: Buffer.concat(err).toString(),
      });
    });
  });
}
