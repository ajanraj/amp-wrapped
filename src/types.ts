// Amp Code Wrapped Types

export interface AmpCodeStats {
  year: number;

  // Time-based
  firstSessionDate: Date;
  daysSinceFirstSession: number;

  // Counts
  totalSessions: number;
  totalMessages: number;
  totalProjects: number;

  // Tokens
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCacheReadTokens: number;
  cacheHitRate: number; // 0-100

  // Credits (Amp uses credits instead of USD cost)
  totalCredits: number;
  hasCredits: boolean;

  // Models (sorted by usage)
  topModels: AmpModelStats[];

  // Providers (sorted by usage)
  topProviders: AmpProviderStats[];

  // Streak
  maxStreak: number;
  currentStreak: number;
  maxStreakDays: Set<string>;

  // Activity heatmap
  dailyActivity: Map<string, number>;

  // Most active day
  mostActiveDay: {
    date: string;
    count: number;
    formattedDate: string;
  } | null;

  // Weekday activity distribution
  weekdayActivity: AmpWeekdayActivity;
}

export interface AmpModelStats {
  id: string;
  name: string;
  providerId: string;
  count: number;
  percentage: number;
  credits: number;
}

export interface AmpProviderStats {
  id: string;
  name: string;
  count: number;
  percentage: number;
}

export interface AmpWeekdayActivity {
  counts: [number, number, number, number, number, number, number];
  mostActiveDay: number;
  mostActiveDayName: string;
  maxCount: number;
}

export interface AmpCliArgs {
  year?: number;
  help?: boolean;
}
