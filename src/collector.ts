// Data collector - reads Amp Code storage and returns raw data

import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import os from "node:os";

/**
 * Get the Amp data directory path for the current platform.
 * Amp uses XDG-style paths on all platforms:
 * - macOS/Linux: ~/.local/share/amp
 * - Windows: %USERPROFILE%\.local\share\amp
 */
export function getAmpDataPath(): string {
  return join(os.homedir(), ".local", "share", "amp");
}

const AMP_DATA_PATH = getAmpDataPath();
const AMP_THREADS_PATH = join(AMP_DATA_PATH, "threads");
const AMP_HISTORY_PATH = join(AMP_DATA_PATH, "history.jsonl");

export interface AmpThreadUsage {
  model: string;
  maxInputTokens?: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens?: number;
  totalInputTokens: number;
  credits: number;
  creditsSinceLastUserMessage?: number;
}

export interface AmpThread {
  id: string;
  v: number;
  created: number;
  messages: AmpMessage[];
}

export interface AmpMessage {
  role: "user" | "assistant";
  messageId: number;
  content?: unknown[];
  usage?: AmpThreadUsage;
  fileMentions?: {
    files?: Array<{ uri: string; content?: string }>;
    mentions?: Array<{ uri: string }>;
  };
  meta?: { sentAt?: number };
}

export interface AmpUsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalTokens: number;
  totalCredits: number;
  modelTokenTotals: Map<string, number>;
  modelCreditTotals: Map<string, number>;
  firstTimestamp: Date | null;
  dailyActivity: Map<string, number>;
  totalMessages: number;
  totalSessions: number;
  projects: Set<string>;
}

export async function checkAmpDataExists(): Promise<boolean> {
  try {
    const info = await stat(AMP_THREADS_PATH);
    return info.isDirectory();
  } catch {
    return false;
  }
}

export async function collectAmpUsageSummary(year: number): Promise<AmpUsageSummary> {
  const modelTokenTotals = new Map<string, number>();
  const modelCreditTotals = new Map<string, number>();
  const dailyActivity = new Map<string, number>();
  const projects = new Set<string>();

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheReadTokens = 0;
  let totalTokens = 0;
  let totalCredits = 0;
  let firstTimestamp: Date | null = null;
  let totalMessages = 0;
  let totalSessions = 0;

  try {
    const threadFiles = await listThreadFiles(AMP_THREADS_PATH);

    for (const filePath of threadFiles) {
      try {
        const content = await readFile(filePath, "utf8");
        const thread: AmpThread = JSON.parse(content);

        // Check if thread is from requested year
        const threadDate = new Date(thread.created);
        if (threadDate.getFullYear() !== year) continue;

        totalSessions++;

        // Track first timestamp
        if (firstTimestamp === null || threadDate < firstTimestamp) {
          firstTimestamp = threadDate;
        }

        // Track daily activity
        const dateKey = formatDateKey(threadDate);
        dailyActivity.set(dateKey, (dailyActivity.get(dateKey) || 0) + 1);

        // Process messages
        for (const message of thread.messages) {
          if (message.role === "user") {
            totalMessages++;

            // Extract projects from file mentions
            if (message.fileMentions?.files) {
              for (const file of message.fileMentions.files) {
                const projectPath = extractProjectPath(file.uri);
                if (projectPath) {
                  projects.add(projectPath);
                }
              }
            }
          }

          if (message.role === "assistant" && message.usage) {
            const usage = message.usage;
            const model = usage.model || "unknown";

            const input = usage.inputTokens || 0;
            const output = usage.outputTokens || 0;
            const cacheRead = usage.cacheReadInputTokens || 0;
            const credits = usage.credits || 0;
            const entryTotal = input + output + cacheRead;

            totalInputTokens += input;
            totalOutputTokens += output;
            totalCacheReadTokens += cacheRead;
            totalTokens += entryTotal;
            totalCredits += credits;

            if (model && model !== "unknown") {
              modelTokenTotals.set(model, (modelTokenTotals.get(model) || 0) + entryTotal);
              modelCreditTotals.set(model, (modelCreditTotals.get(model) || 0) + credits);
            }
          }
        }
      } catch {
        // Skip malformed thread files
      }
    }
  } catch {
    // Threads directory may not exist
  }

  return {
    totalInputTokens,
    totalOutputTokens,
    totalCacheReadTokens,
    totalTokens,
    totalCredits,
    modelTokenTotals,
    modelCreditTotals,
    firstTimestamp,
    dailyActivity,
    totalMessages,
    totalSessions,
    projects,
  };
}

async function listThreadFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isFile() && entry.name.endsWith(".json") && entry.name.startsWith("T-")) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return files;
}

function extractProjectPath(uri: string): string | null {
  // Extract project path from file URI like "file:///Users/user/Projects/myproject/src/file.ts"
  if (!uri.startsWith("file://")) return null;

  const path = uri.replace("file://", "");

  // Find common project indicators
  const projectIndicators = ["/src/", "/lib/", "/app/", "/components/", "/pages/"];
  for (const indicator of projectIndicators) {
    const idx = path.indexOf(indicator);
    if (idx !== -1) {
      return path.substring(0, idx);
    }
  }

  // Fall back to parent directory
  const parts = path.split("/");
  if (parts.length >= 4) {
    return parts.slice(0, -1).join("/");
  }

  return null;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
