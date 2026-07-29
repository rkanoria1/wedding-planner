"use client";

/**
 * Shared Recharts kit — themed to the emerald/gold palette (validated for
 * CVD separation, chroma and contrast in both light & dark modes).
 * Series colors always come from --chart-N tokens in fixed order.
 */

export const SERIES = [
  "var(--chart-1)", // emerald
  "var(--chart-2)", // antique gold
  "var(--chart-3)", // sapphire
  "var(--chart-4)", // terracotta
  "var(--chart-5)", // plum
];

export function seriesColor(i: number) {
  return SERIES[i % SERIES.length];
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      {label && <p className="mb-1 text-xs font-medium">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto pl-3 font-medium tabular-nums">
            {formatter && typeof p.value === "number" ? formatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export const AXIS_PROPS = {
  stroke: "var(--border)",
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
  tickLine: false as const,
  axisLine: false as const,
};

export const GRID_PROPS = {
  stroke: "var(--border)",
  strokeDasharray: "3 3",
  vertical: false as const,
};
