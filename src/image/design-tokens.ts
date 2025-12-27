/**
 * Amp Code Wrapped Design Tokens
 *
 * Design system for Amp Wrapped image generation.
 * Uses red accent colors to match Amp branding.
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

/**
 * Core color palette - dark theme with red accent (Amp branding)
 */
export const ampColors = {
  // Backgrounds - dark theme
  background: "#0F0F0F", // Deep dark
  surface: "#1A1A1A", // Card surface
  surfaceHover: "#252525", // Hover state
  surfaceBorder: "#333333", // Subtle border

  // Text hierarchy
  text: {
    primary: "#FFFFFF", // Primary content
    secondary: "#E0E0E0", // Secondary content
    tertiary: "#A0A0A0", // Labels and captions
    muted: "#707070", // Footer/subtle text
    disabled: "#505050", // Disabled states
  },

  // Accent colors - Amp Red
  accent: {
    primary: "#E53935", // Amp red
    primaryHover: "#EF5350",
    secondary: "#FF7043", // Warm orange-red
    tertiary: "#B71C1C", // Deep red
  },

  // Semantic colors
  semantic: {
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },

  // Heatmap colors - red progression (7 levels: 0-6)
  heatmap: {
    empty: "#1F1F1F", // No activity
    level1: "#2D1A1A", // Very low
    level2: "#3D2020", // Low
    level3: "#5C2828", // Medium-low
    level4: "#7C3030", // Medium
    level5: "#9C3838", // Medium-high
    level6: "#BC4040", // High
    level7: "#E53935", // Very high (accent)
  },

  // Streak colors - red progression (7 levels: 0-6)
  streak: {
    empty: "#1F1F1F", // No activity
    level1: "#2D1A1A", // Very low
    level2: "#3D2020", // Low
    level3: "#5C2828", // Medium-low
    level4: "#7C3030", // Medium
    level5: "#9C3838", // Medium-high
    level6: "#BC4040", // High
    level7: "#E53935", // Max (accent)
  },
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const ampTypography = {
  fontFamily: {
    mono: "IBM Plex Mono",
  },

  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  size: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 20,
    lg: 24,
    xl: 32,
    "2xl": 40,
    "3xl": 48,
    "4xl": 56,
    "5xl": 64,
    "6xl": 72,
  },

  lineHeight: {
    none: 1,
    tight: 1.15,
    snug: 1.25,
    normal: 1.4,
    relaxed: 1.5,
    loose: 1.75,
  },

  letterSpacing: {
    tighter: -2,
    tight: -1,
    normal: 0,
    wide: 1,
    wider: 2,
    widest: 4,
  },
} as const;

// =============================================================================
// SPACING (8px Grid System)
// =============================================================================

export const ampSpacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

// =============================================================================
// LAYOUT
// =============================================================================

export const ampLayout = {
  canvas: {
    width: 1500,
    height: 1400,
  },

  padding: {
    horizontal: 64,
    top: 64,
    bottom: 8,
  },

  content: {
    width: 1322,
  },

  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    "2xl": 24,
    full: 9999,
  },

  shadow: {
    none: "none",
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
  },
} as const;

// =============================================================================
// COMPONENT TOKENS
// =============================================================================

export const ampComponents = {
  statBox: {
    background: ampColors.surface,
    borderRadius: ampLayout.radius.lg,
    padding: {
      x: 32,
      y: 24,
    },
    gap: 8,
  },

  card: {
    background: ampColors.surface,
    borderRadius: ampLayout.radius.lg,
    borderColor: ampColors.surfaceBorder,
    padding: ampSpacing[6],
  },

  sectionHeader: {
    fontSize: ampTypography.size.lg,
    fontWeight: ampTypography.weight.medium,
    color: ampColors.text.secondary,
    letterSpacing: ampTypography.letterSpacing.wider,
    textTransform: "uppercase" as const,
  },

  heatmapCell: {
    size: 23.4,
    gap: 3,
    borderRadius: ampLayout.radius.sm,
  },

  legend: {
    fontSize: ampTypography.size.xs,
    color: ampColors.text.muted,
    cellSize: 14,
    gap: 6,
  },

  ranking: {
    numberWidth: 48,
    numberSize: ampTypography.size.xl,
    itemSize: ampTypography.size.lg,
    gap: ampSpacing[4],
    logoSize: 32,
    logoBorderRadius: ampLayout.radius.md,
  },
} as const;

// =============================================================================
// HEATMAP COLOR MAPS
// =============================================================================

export const AMP_HEATMAP_COLORS = {
  0: ampColors.heatmap.empty,
  1: ampColors.heatmap.level1,
  2: ampColors.heatmap.level2,
  3: ampColors.heatmap.level3,
  4: ampColors.heatmap.level4,
  5: ampColors.heatmap.level5,
  6: ampColors.heatmap.level6,
} as const;

export const AMP_STREAK_COLORS = {
  0: ampColors.streak.empty,
  1: ampColors.streak.level1,
  2: ampColors.streak.level2,
  3: ampColors.streak.level3,
  4: ampColors.streak.level4,
  5: ampColors.streak.level5,
  6: ampColors.streak.level7,
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function ampSpace(key: keyof typeof ampSpacing): number {
  return ampSpacing[key];
}

export function ampFontSize(key: keyof typeof ampTypography.size): number {
  return ampTypography.size[key];
}

export function ampRadius(key: keyof typeof ampLayout.radius): number {
  return ampLayout.radius[key];
}
