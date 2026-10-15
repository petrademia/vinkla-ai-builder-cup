import { GoogleGenAI } from "@google/genai";

export const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
export const REQUEST_TIMEOUT_MS = 25_000;

export function createClient(): GoogleGenAI {
  return new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION ?? "global",
  });
}

const RETRYABLE_STATUS = new Set([429, 500, 503, 504]);

function isRetryable(e: unknown): boolean {
  const status = (e as { status?: number; code?: number }).status ?? (e as { code?: number }).code;
  if (typeof status === "number") return RETRYABLE_STATUS.has(status);
  return /timeout|timed out|ECONNRESET|fetch failed|aborted/i.test(String(e));
}

/** Retries transient Gemini failures with exponential backoff. */
export async function withRetry<T>(fn: () => Promise<T>, tries = 3, baseMs = 400): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!isRetryable(e) || i === tries - 1) break;
      await new Promise((r) => setTimeout(r, baseMs * 2 ** i));
    }
  }
  throw last;
}
