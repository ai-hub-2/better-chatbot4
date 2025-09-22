import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(
  process.env.REDIS_URL ?? "redis://localhost:6379",
);

export const pipelineQueueName = "pipeline";
export const pipelineQueue = new Queue(pipelineQueueName, { connection });

export type PipelinePayload = {
  projectId: string;
  prompt: string;
};

export function registerPipelineWorker(
  handler: (job: Job<PipelinePayload>) => Promise<any>,
) {
  const worker = new Worker<PipelinePayload>(pipelineQueueName, handler, {
    connection,
  });
  worker.on("failed", (job, err) => {
    console.error(`Pipeline job ${job?.id} failed:`, err);
  });
  worker.on("completed", (job) => {
    console.log(`Pipeline job ${job.id} completed.`);
  });
  return worker;
}
