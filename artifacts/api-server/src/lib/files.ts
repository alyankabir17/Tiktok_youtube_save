import { unlink } from "node:fs/promises";

interface PendingFile {
  filePath: string;
  filename: string;
  contentType: string;
  fileSize: number;
  createdAt: number;
}

const jobs = new Map<string, PendingFile>();
const TTL_MS = 10 * 60 * 1000;

export function registerJob(jobId: string, file: PendingFile): void {
  jobs.set(jobId, file);
}

export function getJob(jobId: string): PendingFile | undefined {
  return jobs.get(jobId);
}

export function clearJob(jobId: string): void {
  jobs.delete(jobId);
}

setInterval(async () => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > TTL_MS) {
      jobs.delete(id);
      try {
        await unlink(job.filePath);
      } catch {
        // ignore
      }
    }
  }
}, 60 * 1000).unref();
