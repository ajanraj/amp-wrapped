import { generateWeeksForYear, getIntensityLevel } from "../utils/dates";
import { ampColors, ampTypography, ampSpacing, ampComponents, AMP_HEATMAP_COLORS, AMP_STREAK_COLORS } from "./design-tokens";

interface HeatmapProps {
  dailyActivity: Map<string, number>;
  year: number;
  maxStreakDays?: Set<string>;
}

interface MonthLabel {
  month: number;
  x: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CELL_SIZE = ampComponents.heatmapCell.size;
const CELL_GAP = ampComponents.heatmapCell.gap;
const CELL_RADIUS = ampComponents.heatmapCell.borderRadius;

const LEGEND_CELL_SIZE = ampComponents.legend.cellSize;
const LEGEND_GAP = ampComponents.legend.gap;

export function AmpActivityHeatmap({ dailyActivity, year, maxStreakDays }: HeatmapProps) {
  const weeks = generateWeeksForYear(year);

  const counts = Array.from(dailyActivity.values());
  const maxCount = counts.length > 0 ? Math.max(...counts) : 0;

  const monthLabels = getMonthLabels(weeks, CELL_SIZE, CELL_GAP);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: ampSpacing[2],
      }}
    >
      <MonthLabelsRow labels={monthLabels} />
      <HeatmapGrid weeks={weeks} dailyActivity={dailyActivity} maxStreakDays={maxStreakDays} maxCount={maxCount} />
      <HeatmapLegend />
    </div>
  );
}

function MonthLabelsRow({ labels }: { labels: MonthLabel[] }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        position: "relative",
        height: 20,
        marginBottom: ampSpacing[1],
      }}
    >
      {labels.map(({ month, x }) => (
        <div
          key={`${month}-${x}`}
          style={{
            position: "absolute",
            left: x,
            fontSize: ampTypography.size.sm,
            fontWeight: ampTypography.weight.medium,
            color: ampColors.text.muted,
            fontFamily: ampTypography.fontFamily.mono,
          }}
        >
          {MONTHS[month]}
        </div>
      ))}
    </div>
  );
}

interface HeatmapGridProps {
  weeks: (string | null)[][];
  dailyActivity: Map<string, number>;
  maxStreakDays?: Set<string>;
  maxCount: number;
}

function HeatmapGrid({ weeks, dailyActivity, maxStreakDays, maxCount }: HeatmapGridProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: CELL_GAP,
        flexWrap: "wrap",
        maxWidth: "100%",
      }}
    >
      {weeks.map((week, weekIndex) => (
        <WeekColumn key={weekIndex} week={week} dailyActivity={dailyActivity} maxStreakDays={maxStreakDays} maxCount={maxCount} />
      ))}
    </div>
  );
}

interface WeekColumnProps {
  week: (string | null)[];
  dailyActivity: Map<string, number>;
  maxStreakDays?: Set<string>;
  maxCount: number;
}

function WeekColumn({ week, dailyActivity, maxStreakDays, maxCount }: WeekColumnProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: CELL_GAP,
      }}
    >
      {week.map((dateStr, dayIndex) => (
        <DayCell key={dayIndex} dateStr={dateStr} dailyActivity={dailyActivity} maxStreakDays={maxStreakDays} maxCount={maxCount} />
      ))}
    </div>
  );
}

interface DayCellProps {
  dateStr: string | null;
  dailyActivity: Map<string, number>;
  maxStreakDays?: Set<string>;
  maxCount: number;
}

function DayCell({ dateStr, dailyActivity, maxStreakDays, maxCount }: DayCellProps) {
  const count = dateStr ? dailyActivity.get(dateStr) || 0 : 0;
  const intensity = getIntensityLevel(count, maxCount) as keyof typeof AMP_HEATMAP_COLORS;
  const isStreakDay = dateStr && maxStreakDays?.has(dateStr);
  const colorPalette = isStreakDay ? AMP_STREAK_COLORS : AMP_HEATMAP_COLORS;
  const color = colorPalette[intensity];

  return (
    <div
      style={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        backgroundColor: dateStr ? color : "transparent",
        borderRadius: CELL_RADIUS,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
}

function HeatmapLegend() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: ampSpacing[2],
        marginTop: ampSpacing[3],
      }}
    >
      <span
        style={{
          fontSize: ampComponents.legend.fontSize,
          fontWeight: ampTypography.weight.medium,
          color: ampComponents.legend.color,
          fontFamily: ampTypography.fontFamily.mono,
        }}
      >
        Less
      </span>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: LEGEND_GAP,
        }}
      >
        {(Object.keys(AMP_HEATMAP_COLORS) as unknown as (keyof typeof AMP_HEATMAP_COLORS)[]).map((intensity) => (
          <div
            key={intensity}
            style={{
              width: LEGEND_CELL_SIZE,
              height: LEGEND_CELL_SIZE,
              backgroundColor: AMP_HEATMAP_COLORS[intensity],
              borderRadius: 3,
            }}
          />
        ))}
      </div>

      <span
        style={{
          fontSize: ampComponents.legend.fontSize,
          fontWeight: ampTypography.weight.medium,
          color: ampComponents.legend.color,
          fontFamily: ampTypography.fontFamily.mono,
        }}
      >
        More
      </span>
    </div>
  );
}

function getMonthLabels(weeks: (string | null)[][], cellSize: number, gap: number): MonthLabel[] {
  const labels: MonthLabel[] = [];
  let lastMonth = -1;

  for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
    const week = weeks[weekIndex];

    for (const dateStr of week) {
      if (dateStr) {
        const month = parseInt(dateStr.split("-")[1], 10) - 1;

        if (month !== lastMonth) {
          labels.push({
            month,
            x: weekIndex * (cellSize + gap),
          });
          lastMonth = month;
        }
        break;
      }
    }
  }

  return labels;
}
