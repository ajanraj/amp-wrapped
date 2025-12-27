import type { AmpCodeStats, AmpWeekdayActivity } from "../types";
import { formatNumberFull, formatDate } from "../utils/format";
import { AmpActivityHeatmap } from "./heatmap";
import { ampColors, ampTypography, ampSpacing, ampLayout, ampComponents } from "./design-tokens";
import ampLogo from "../../assets/images/amp-logo-color.svg" with { type: "text" };
import ampTextSvg from "../../assets/images/amp-text-light.svg" with { type: "text" };

const AMP_LOGO_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(ampLogo).toString("base64")}`;
// Make the text white for dark background
const ampTextWhite = ampTextSvg.replace('fill="#000000"', 'fill="#FFFFFF"');
const AMP_TEXT_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(ampTextWhite).toString("base64")}`;

export function AmpWrappedTemplate({ stats }: { stats: AmpCodeStats }) {
  return (
    <div
      style={{
        width: ampLayout.canvas.width,
        height: ampLayout.canvas.height,
        display: "flex",
        flexDirection: "column",
        backgroundColor: ampColors.background,
        color: ampColors.text.primary,
        fontFamily: ampTypography.fontFamily.mono,
        paddingLeft: ampLayout.padding.horizontal,
        paddingRight: ampLayout.padding.horizontal,
        paddingTop: ampLayout.padding.top,
        paddingBottom: ampLayout.padding.bottom,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: -180,
          right: -120,
          width: 520,
          height: 520,
          backgroundColor: ampColors.accent.primary,
          opacity: 0.15,
          borderRadius: ampLayout.radius.full,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -220,
          left: -140,
          width: 620,
          height: 620,
          backgroundColor: ampColors.accent.secondary,
          opacity: 0.10,
          borderRadius: ampLayout.radius.full,
        }}
      />

      <Header year={stats.year} />

      <div style={{ marginTop: ampSpacing[8], display: "flex", flexDirection: "row", gap: ampSpacing[16], alignItems: "flex-start" }}>
        <HeroStatItem
          label="Started"
          subtitle={formatDate(stats.firstSessionDate)}
          value={`${stats.daysSinceFirstSession} Days Ago`}
        />
        <HeroStatItem
          label="Most Active Day"
          subtitle={stats.weekdayActivity.mostActiveDayName}
          value={stats.mostActiveDay?.formattedDate ?? "N/A"}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: ampColors.surface,
            borderRadius: ampLayout.radius.lg,
            padding: ampSpacing[8],
            border: `1px solid ${ampColors.surfaceBorder}`,
          }}
        >
          <span
            style={{
              fontSize: ampComponents.sectionHeader.fontSize,
              fontWeight: ampComponents.sectionHeader.fontWeight,
              color: ampComponents.sectionHeader.color,
              letterSpacing: ampComponents.sectionHeader.letterSpacing,
              textTransform: ampComponents.sectionHeader.textTransform,
            }}
          >
            Weekly
          </span>
          <WeeklyBarChart weekdayActivity={stats.weekdayActivity} />
        </div>
      </div>

      <Section title="Activity" marginTop={ampSpacing[8]}>
        <AmpActivityHeatmap dailyActivity={stats.dailyActivity} year={stats.year} maxStreakDays={stats.maxStreakDays} />
      </Section>

      <div
        style={{
          marginTop: ampSpacing[8],
          display: "flex",
          flexDirection: "row",
          gap: ampSpacing[16],
        }}
      >
        <RankingList
          title="Top Models"
          items={stats.topModels.map((m) => ({
            name: m.name,
          }))}
        />
        <InsightCard stats={stats} />
      </div>

      <StatsGrid stats={stats} />
      <Footer />
    </div>
  );
}

function Header({ year }: { year: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: ampSpacing[2],
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: ampSpacing[8],
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: ampSpacing[4] }}>
          <img
            src={AMP_LOGO_DATA_URL}
            height={72}
            width={72}
            style={{
              objectFit: "contain",
            }}
          />
          <img
            src={AMP_TEXT_DATA_URL}
            height={56}
            style={{
              objectFit: "contain",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: ampSpacing[2],
            textAlign: "right",
          }}
        >
          <span
            style={{
              fontSize: ampTypography.size["3xl"],
              fontWeight: ampTypography.weight.medium,
              letterSpacing: ampTypography.letterSpacing.normal,
              color: ampColors.text.tertiary,
              lineHeight: ampTypography.lineHeight.none,
            }}
          >
            wrapped
          </span>
          <span
            style={{
              fontSize: ampTypography.size["3xl"],
              fontWeight: ampTypography.weight.bold,
              letterSpacing: ampTypography.letterSpacing.normal,
              color: ampColors.accent.primary,
              lineHeight: ampTypography.lineHeight.none,
            }}
          >
            {year}
          </span>
        </div>
      </div>
    </div>
  );
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const BAR_HEIGHT = 100;
const BAR_WIDTH = 56;
const BAR_GAP = 12;

const HERO_STAT_CONTENT_HEIGHT = BAR_HEIGHT + ampSpacing[2] + 50;

function HeroStatItem({ label, subtitle, value }: { label: string; subtitle?: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: ampColors.surface,
        borderRadius: ampLayout.radius.lg,
        padding: ampSpacing[8],
        height: HERO_STAT_CONTENT_HEIGHT + ampSpacing[8] * 2,
        border: `1px solid ${ampColors.surfaceBorder}`,
      }}
    >
      <span
        style={{
          fontSize: ampComponents.sectionHeader.fontSize,
          fontWeight: ampComponents.sectionHeader.fontWeight,
          color: ampComponents.sectionHeader.color,
          letterSpacing: ampComponents.sectionHeader.letterSpacing,
          textTransform: ampComponents.sectionHeader.textTransform,
        }}
      >
        {label}
      </span>
      {subtitle && (
        <span
          style={{
            fontSize: ampTypography.size['xl'],
            fontWeight: ampTypography.weight.medium,
            color: ampColors.text.tertiary,
          }}
        >
          {subtitle}
        </span>
      )}
      <span
        style={{
          fontSize: ampTypography.size["4xl"],
          fontWeight: ampTypography.weight.medium,
          color: ampColors.text.primary,
          lineHeight: ampTypography.lineHeight.none,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function WeeklyBarChart({ weekdayActivity }: { weekdayActivity: AmpWeekdayActivity }) {
  const { counts, mostActiveDay, maxCount } = weekdayActivity;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ampSpacing[2] }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          gap: BAR_GAP,
          height: BAR_HEIGHT,
        }}
      >
        {counts.map((count, i) => {
          const heightPercent = maxCount > 0 ? count / maxCount : 0;
          const barHeight = Math.max(8, Math.round(heightPercent * BAR_HEIGHT));
          const isHighlighted = i === mostActiveDay;

          return (
            <div
              key={i}
              style={{
                width: BAR_WIDTH,
                height: barHeight,
                backgroundColor: isHighlighted ? ampColors.accent.primary : ampColors.heatmap.level4,
                borderRadius: 4,
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: BAR_GAP,
        }}
      >
        {WEEKDAY_LABELS.map((label, i) => {
          const isHighlighted = i === mostActiveDay;
          return (
            <div
              key={i}
              style={{
                width: BAR_WIDTH,
                display: "flex",
                justifyContent: "center",
                fontSize: ampTypography.size.sm,
                fontWeight: isHighlighted ? ampTypography.weight.bold : ampTypography.weight.regular,
                color: isHighlighted ? ampColors.accent.primary : ampColors.text.muted,
              }}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, marginTop = 0, children }: { title: string; marginTop?: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop,
        display: "flex",
        flexDirection: "column",
        gap: ampSpacing[4],
      }}
    >
      <span
        style={{
          fontSize: ampComponents.sectionHeader.fontSize,
          fontWeight: ampComponents.sectionHeader.fontWeight,
          color: ampComponents.sectionHeader.color,
          letterSpacing: ampComponents.sectionHeader.letterSpacing,
          textTransform: ampComponents.sectionHeader.textTransform,
        }}
      >
        {title}
      </span>
      {children}
    </div>
  );
}

interface RankingItem {
  name: string;
  logoUrl?: string;
}

function RankingList({ title, items }: { title: string; items: RankingItem[] }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: ampSpacing[5],
        flex: 1,
        backgroundColor: ampColors.surface,
        border: `1px solid ${ampColors.surfaceBorder}`,
        borderRadius: ampLayout.radius.lg,
        padding: ampSpacing[6],
      }}
    >
      <span
        style={{
          fontSize: ampComponents.sectionHeader.fontSize,
          fontWeight: ampComponents.sectionHeader.fontWeight,
          color: ampComponents.sectionHeader.color,
          letterSpacing: ampComponents.sectionHeader.letterSpacing,
          textTransform: ampComponents.sectionHeader.textTransform,
        }}
      >
        {title}
      </span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: ampSpacing[4],
        }}
      >
        {items.map((item, i) => (
          <RankingItemRow key={i} rank={i + 1} name={item.name} logoUrl={item.logoUrl} />
        ))}
      </div>
    </div>
  );
}

function InsightCard({ stats }: { stats: AmpCodeStats }) {
  const insights = [
    stats.totalCacheReadTokens > 0 && {
      label: "Cache Read",
      value: `${formatNumberFull(stats.totalCacheReadTokens)} tok`,
    },
    stats.cacheHitRate > 0 && {
      label: "Cache Hit",
      value: `${stats.cacheHitRate.toFixed(1)}%`,
    },
    stats.hasCredits && {
      label: "Credits Used",
      value: stats.totalCredits.toFixed(2),
    },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: ampSpacing[5],
        flex: 1,
        backgroundColor: ampColors.surface,
        border: `1px solid ${ampColors.surfaceBorder}`,
        borderRadius: ampLayout.radius.lg,
        padding: ampSpacing[6],
      }}
    >
      <span
        style={{
          fontSize: ampComponents.sectionHeader.fontSize,
          fontWeight: ampComponents.sectionHeader.fontWeight,
          color: ampComponents.sectionHeader.color,
          letterSpacing: ampComponents.sectionHeader.letterSpacing,
          textTransform: ampComponents.sectionHeader.textTransform,
        }}
      >
        Usage Insights
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: ampSpacing[3] }}>
        {insights.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: ampSpacing[4],
            }}
          >
            <span
              style={{
                fontSize: ampTypography.size.md,
                fontWeight: ampTypography.weight.medium,
                color: ampColors.text.tertiary,
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                fontSize: ampTypography.size.md,
                fontWeight: ampTypography.weight.semibold,
                color: ampColors.text.primary,
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RankingItemRowProps {
  rank: number;
  name: string;
  logoUrl?: string;
}

function RankingItemRow({ rank, name, logoUrl }: RankingItemRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: ampSpacing[4],
      }}
    >
      <span
        style={{
          fontSize: ampComponents.ranking.numberSize,
          fontWeight: ampTypography.weight.bold,
          color: ampColors.text.tertiary,
          width: ampComponents.ranking.numberWidth,
          textAlign: "right",
        }}
      >
        {rank}
      </span>

      {logoUrl && (
        <img
          src={logoUrl}
          width={ampComponents.ranking.logoSize}
          height={ampComponents.ranking.logoSize}
          style={{
            borderRadius: ampComponents.ranking.logoBorderRadius,
            background: "#ffffff",
          }}
        />
      )}

      <span
        style={{
          fontSize: ampComponents.ranking.itemSize,
          fontWeight: ampTypography.weight.medium,
          color: ampColors.text.primary,
        }}
      >
        {name}
      </span>
    </div>
  );
}

function StatsGrid({ stats }: { stats: AmpCodeStats }) {
  const hasCredits = stats.hasCredits;

  return (
    <div
      style={{
        marginTop: ampSpacing[4],
        display: "flex",
        flexDirection: "column",
        gap: ampSpacing[5],
      }}
    >
      {hasCredits ? (
        <div style={{ display: "flex", flexDirection: "column", gap: ampSpacing[5] }}>
          <div style={{ display: "flex", gap: ampSpacing[5] }}>
            <StatBox label="Threads" value={formatNumberFull(stats.totalSessions)} />
            <StatBox label="Messages" value={formatNumberFull(stats.totalMessages)} />
            <StatBox label="Total Tokens" value={formatNumberFull(stats.totalTokens)} />
          </div>

          <div style={{ display: "flex", gap: ampSpacing[5] }}>
            <StatBox label="Projects" value={formatNumberFull(stats.totalProjects)} />
            <StatBox label="Streak" value={`${stats.maxStreak}d`} />
            <StatBox label="Credits" value={stats.totalCredits.toFixed(1)} />
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ampSpacing[5] }}>
          <div style={{ display: "flex", gap: ampSpacing[5] }}>
            <StatBox label="Threads" value={formatNumberFull(stats.totalSessions)} />
            <StatBox label="Messages" value={formatNumberFull(stats.totalMessages)} />
            <StatBox label="Tokens" value={formatNumberFull(stats.totalTokens)} />
          </div>

          <div style={{ display: "flex", gap: ampSpacing[5] }}>
            <StatBox label="Projects" value={formatNumberFull(stats.totalProjects)} />
            <StatBox label="Streak" value={`${stats.maxStreak}d`} />
          </div>
        </div>
      )}
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: string;
}

function StatBox({ label, value }: StatBoxProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: ampComponents.statBox.background,
        paddingTop: ampComponents.statBox.padding.y,
        paddingBottom: ampComponents.statBox.padding.y,
        paddingLeft: ampComponents.statBox.padding.x,
        paddingRight: ampComponents.statBox.padding.x,
        gap: ampComponents.statBox.gap,
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: ampComponents.statBox.borderRadius,
        border: `1px solid ${ampColors.surfaceBorder}`,
      }}
    >
      <span
        style={{
          fontSize: ampTypography.size.lg,
          fontWeight: ampTypography.weight.medium,
          color: ampColors.text.tertiary,
          textTransform: "uppercase",
          letterSpacing: ampTypography.letterSpacing.wide,
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontSize: ampTypography.size["2xl"],
          fontWeight: ampTypography.weight.bold,
          color: ampColors.text.primary,
          lineHeight: ampTypography.lineHeight.none,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Footer() {
  return (
    <div
      style={{
        marginTop: ampSpacing[2],
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: ampTypography.size.lg,
          fontWeight: ampTypography.weight.medium,
          color: ampColors.text.muted,
          letterSpacing: ampTypography.letterSpacing.normal,
        }}
      >
        ampcode.com
      </span>
    </div>
  );
}
