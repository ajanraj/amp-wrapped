import type { AmpCodeStats, AmpModelStats, AmpProviderStats, AmpWeekdayActivity } from "./types";
import { collectAmpUsageSummary } from "./collector";

export async function calculateAmpStats(year: number): Promise<AmpCodeStats> {
  const usageSummary = await collectAmpUsageSummary(year);

  const dailyActivity = usageSummary.dailyActivity;
  const weekdayCounts: [number, number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0, 0];

  // Build weekday counts from daily activity
  for (const [entryDate, messageCount] of dailyActivity.entries()) {
    const weekday = new Date(entryDate).getDay();
    weekdayCounts[weekday] += messageCount;
  }

  // Build model stats
  const modelStats: AmpModelStats[] = [];
  const providerCounts = new Map<string, number>();
  const totalTokens = usageSummary.totalTokens;

  for (const [modelId, tokens] of usageSummary.modelTokenTotals.entries()) {
    if (tokens <= 0) continue;

    const providerId = resolveProviderId(modelId);
    const credits = usageSummary.modelCreditTotals.get(modelId) || 0;

    providerCounts.set(providerId, (providerCounts.get(providerId) || 0) + tokens);

    modelStats.push({
      id: modelId,
      name: getModelDisplayName(modelId),
      providerId,
      count: tokens,
      percentage: totalTokens > 0 ? (tokens / totalTokens) * 100 : 0,
      credits,
    });
  }

  const topModels = modelStats.sort((a, b) => b.count - a.count).slice(0, 3);

  const topProviders: AmpProviderStats[] = Array.from(providerCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({
      id,
      name: getProviderDisplayName(id),
      count,
      percentage: totalTokens > 0 ? (count / totalTokens) * 100 : 0,
    }));

  const { maxStreak, currentStreak, maxStreakDays } = calculateStreaks(dailyActivity, year);
  const mostActiveDay = findMostActiveDay(dailyActivity);
  const weekdayActivity = buildWeekdayActivity(weekdayCounts);

  const cacheHitRate = usageSummary.totalCacheReadTokens > 0
    ? (usageSummary.totalCacheReadTokens / (usageSummary.totalCacheReadTokens + usageSummary.totalInputTokens)) * 100
    : 0;

  const firstSessionDate = usageSummary.firstTimestamp || new Date();
  const daysSinceFirstSession = Math.floor((Date.now() - firstSessionDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    year,
    firstSessionDate,
    daysSinceFirstSession,
    totalSessions: usageSummary.totalSessions,
    totalMessages: usageSummary.totalMessages,
    totalProjects: usageSummary.projects.size,
    totalInputTokens: usageSummary.totalInputTokens,
    totalOutputTokens: usageSummary.totalOutputTokens,
    totalTokens: usageSummary.totalTokens,
    totalCacheReadTokens: usageSummary.totalCacheReadTokens,
    cacheHitRate,
    totalCredits: usageSummary.totalCredits,
    hasCredits: usageSummary.totalCredits > 0,
    topModels,
    topProviders,
    maxStreak,
    currentStreak,
    maxStreakDays,
    dailyActivity,
    mostActiveDay,
    weekdayActivity,
  };
}

function resolveProviderId(modelId: string): string {
  if (modelId.startsWith("claude")) return "anthropic";
  if (modelId.startsWith("gpt") || modelId.startsWith("o1") || modelId.startsWith("o3")) return "openai";
  if (modelId.startsWith("gemini")) return "google";
  if (modelId.includes("mistral") || modelId.includes("mixtral")) return "mistral";
  if (modelId.includes("llama")) return "meta";
  if (modelId.includes("deepseek")) return "deepseek";
  return "unknown";
}

function getModelDisplayName(modelId: string): string {
  // Common model name mappings
  const modelNames: Record<string, string> = {
    "claude-opus-4-5-20251101": "Opus 4.5",
    "claude-sonnet-4-5-20250929": "Sonnet 4.5",
    "claude-sonnet-4-20250514": "Sonnet 4",
    "claude-haiku-4-5-20251001": "Haiku 4.5",
    "claude-3-5-sonnet-20241022": "Sonnet 3.5",
    "claude-3-5-haiku-20241022": "Haiku 3.5",
    "claude-3-opus-20240229": "Opus 3",
    "claude-3-sonnet-20240229": "Sonnet 3",
    "claude-3-haiku-20240307": "Haiku 3",
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    "gpt-4-turbo": "GPT-4 Turbo",
    "gpt-5": "GPT-5",
    "gpt-5.1": "GPT-5.1",
    "o1-preview": "o1 Preview",
    "o1-mini": "o1 Mini",
    "o3-mini": "o3 Mini",
    "gemini-2.0-flash": "Gemini 2.0 Flash",
    "gemini-3-flash-preview": "Gemini 3 Flash",
    "gemini-1.5-pro": "Gemini 1.5 Pro",
    "deepseek-chat": "DeepSeek Chat",
    "deepseek-coder": "DeepSeek Coder",
  };

  if (modelNames[modelId]) return modelNames[modelId];

  // Try to extract a clean name from the model ID
  if (modelId.startsWith("claude-")) {
    const parts = modelId.replace("claude-", "").split("-");
    if (parts.length >= 2) {
      const variant = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      const version = parts[1];
      return `${variant} ${version}`;
    }
  }

  // Fallback: just capitalize first letter
  return modelId.charAt(0).toUpperCase() + modelId.slice(1);
}

function getProviderDisplayName(providerId: string): string {
  const providerNames: Record<string, string> = {
    anthropic: "Anthropic",
    openai: "OpenAI",
    google: "Google",
    mistral: "Mistral",
    meta: "Meta",
    deepseek: "DeepSeek",
    unknown: "Other",
  };
  return providerNames[providerId] || providerId;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateStreaks(
  dailyActivity: Map<string, number>,
  year: number
): { maxStreak: number; currentStreak: number; maxStreakDays: Set<string> } {
  const activeDates = Array.from(dailyActivity.keys())
    .filter((date) => date.startsWith(String(year)))
    .sort();

  if (activeDates.length === 0) {
    return { maxStreak: 0, currentStreak: 0, maxStreakDays: new Set() };
  }

  let maxStreak = 1;
  let tempStreak = 1;
  let tempStreakStart = 0;
  let maxStreakStart = 0;
  let maxStreakEnd = 0;

  for (let i = 1; i < activeDates.length; i++) {
    const prevDate = new Date(activeDates[i - 1]);
    const currDate = new Date(activeDates[i]);
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
        maxStreakStart = tempStreakStart;
        maxStreakEnd = i;
      }
    } else {
      tempStreak = 1;
      tempStreakStart = i;
    }
  }

  const maxStreakDays = new Set<string>();
  for (let i = maxStreakStart; i <= maxStreakEnd; i++) {
    maxStreakDays.add(activeDates[i]);
  }

  const today = formatDateKey(new Date());
  const yesterday = formatDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const currentStreak = dailyActivity.has(today)
    ? countStreakBackwards(dailyActivity, new Date())
    : dailyActivity.has(yesterday)
      ? countStreakBackwards(dailyActivity, new Date(Date.now() - 24 * 60 * 60 * 1000))
      : 0;

  return { maxStreak, currentStreak, maxStreakDays };
}

function countStreakBackwards(dailyActivity: Map<string, number>, startDate: Date): number {
  let streak = 1;
  let checkDate = new Date(startDate);

  while (true) {
    checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    if (dailyActivity.has(formatDateKey(checkDate))) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function findMostActiveDay(dailyActivity: Map<string, number>): { date: string; count: number; formattedDate: string } | null {
  if (dailyActivity.size === 0) return null;

  let maxDate = "";
  let maxCount = 0;

  for (const [date, count] of dailyActivity.entries()) {
    if (count > maxCount) {
      maxCount = count;
      maxDate = date;
    }
  }

  if (!maxDate) return null;

  const [year, month, day] = maxDate.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedDate = `${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}`;

  return { date: maxDate, count: maxCount, formattedDate };
}

function buildWeekdayActivity(counts: [number, number, number, number, number, number, number]): AmpWeekdayActivity {
  const WEEKDAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  let mostActiveDay = 0;
  let maxCount = 0;
  for (let i = 0; i < 7; i++) {
    if (counts[i] > maxCount) {
      maxCount = counts[i];
      mostActiveDay = i;
    }
  }

  return {
    counts,
    mostActiveDay,
    mostActiveDayName: WEEKDAY_NAMES_FULL[mostActiveDay],
    maxCount,
  };
}
