import { IS_VERCEL_ENV } from "lib/const";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!IS_VERCEL_ENV) {
      // run DB migration
      const runMigrate = await import("./lib/db/pg/migrate.pg").then(
        (m) => m.runMigrate,
      );
      await runMigrate().catch((e) => {
        console.error(e);
        // Do not crash the server if the database is unavailable locally.
        // Continue startup; features requiring DB will error gracefully.
      });
      const initMCPManager = await import("./lib/ai/mcp/mcp-manager").then(
        (m) => m.initMCPManager,
      );
      await initMCPManager();

      // register queue workers
      const { registerPipelineWorker } = await import("./lib/queue");
      const { pipelineWorker } = await import("./lib/pipeline");
      registerPipelineWorker(pipelineWorker);
    }
  }
}
