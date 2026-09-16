import { toArabicDigits, type MetricPoint } from "@/lib/clinic-data";

export function MetricChart({
  label,
  unit,
  points,
  normal,
}: {
  label: string;
  unit: string;
  points: MetricPoint[];
  normal: [number, number];
}) {
  if (points.length === 0) {
    return (
      <div className="glass-soft rounded-2xl p-4">
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-2 text-xs text-muted-foreground">لا توجد قياسات مسجلة.</p>
      </div>
    );
  }

  const w = 320;
  const h = 110;
  const pad = 14;
  const values = points.map((p) => p.value);
  const min = Math.min(...values, normal[0]);
  const max = Math.max(...values, normal[1]);
  const span = max - min || 1;
  const x = (i: number) => (points.length === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (points.length - 1));
  const y = (v: number) => h - pad - ((v - min) / span) * (h - pad * 2);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(points.length - 1).toFixed(1)} ${h - pad} L ${x(0).toFixed(1)} ${h - pad} Z`;

  const last = points[points.length - 1]!;
  const prev = points.length > 1 ? points[points.length - 2]! : null;
  const delta = prev ? last.value - prev.value : 0;
  const outOfRange = last.value < normal[0] || last.value > normal[1];

  const bandTop = y(Math.min(normal[1], max));
  const bandBottom = y(Math.max(normal[0], min));

  return (
    <div className="glass-soft rounded-2xl p-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">{label}</p>
        <p className={`text-sm font-bold ${outOfRange ? "text-destructive" : "text-primary"}`}>
          {toArabicDigits(last.value)} <span className="text-[10px] font-normal text-muted-foreground">{unit}</span>
        </p>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={`تطور ${label}`}>
        <defs>
          <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect
          x={pad}
          y={Math.min(bandTop, bandBottom)}
          width={w - pad * 2}
          height={Math.abs(bandBottom - bandTop)}
          className="fill-primary/10"
          rx="4"
        />
        <path d={area} fill={`url(#g-${label})`} className="text-primary" />
        <path d={line} fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-primary" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r="3.5" className="fill-primary" />
        ))}
      </svg>

      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{points[0]!.date}</span>
        {prev ? (
          <span className={delta === 0 ? "" : delta > 0 ? "text-amber-400" : "text-emerald-400"}>
            {delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} {toArabicDigits(Math.abs(Number(delta.toFixed(1))))}
          </span>
        ) : null}
        <span>{last.date}</span>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">
        المعدل الطبيعي {toArabicDigits(normal[0])}–{toArabicDigits(normal[1])} {unit}
      </p>
    </div>
  );
}
