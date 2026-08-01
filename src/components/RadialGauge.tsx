import { useId, useState } from "react";
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Pencil, AlertTriangle } from "lucide-react";

interface RadialGaugeProps {
  label: string;
  value: number;
  displayValue?: string;
  editable?: boolean;
  onEdit?: (newValue: number) => void;
}

export default function RadialGauge({ label, value, displayValue, editable, onEdit }: RadialGaugeProps) {
  const isNegative = value < 0;
  // A value over 100 (e.g. a mistyped tax rate, or commission that happens to
  // exceed the month's billing) would otherwise saturate the ring at "full"
  // with no sign that the real number is bigger than the ring can show —
  // which reads as the ring being wrong relative to the number next to it.
  // Flag it visually (amber ring + warning badge) instead of hiding it.
  const isOverflow = !isNegative && value > 100;
  // Negative values (e.g. a loss instead of a profit margin) get their own
  // small-but-visible red arc instead of silently clamping to 0 — a 0-value
  // ring and a "-64%" ring looked identical before, which read as broken.
  const rawArcValue = isNegative ? Math.min(100, Math.abs(value)) : Math.min(100, Math.max(0, value));
  // Small-but-real percentages (a 2-5% tax rate is common and correct) render
  // as a barely-there dot once the rounded end-caps swallow the whole arc —
  // it reads as "broken/invisible", not "small". Floor any nonzero value to a
  // minimum arc length so it's always clearly legible as a visible segment;
  // the number in the center keeps showing the true, unfloored figure.
  const MIN_VISIBLE_ARC = 15;
  const arcValue = rawArcValue > 0 && rawArcValue < MIN_VISIBLE_ARC ? MIN_VISIBLE_ARC : rawArcValue;
  const data = [{ value: arcValue }];
  const gradientId = `gauge-grad-${useId().replace(/:/g, "")}`;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEdit = () => {
    setDraft(String(value));
    setEditing(true);
  };

  const commit = () => {
    const parsed = parseFloat(draft.replace(",", "."));
    if (!isNaN(parsed) && onEdit) onEdit(parsed);
    setEditing(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center gap-3 shadow-sm relative group">
      {editable && !editing && (
        <button
          onClick={startEdit}
          className="absolute top-2.5 right-2.5 p-1 rounded-md text-muted-foreground/60 hover:text-blue-500 hover:bg-muted opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
          title="Editar valor manualmente"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      {isOverflow && (
        <span
          className="absolute top-2.5 left-2.5 text-amber-500"
          title={`Valor real (${value.toFixed(1)}%) passa de 100% — o anel está cheio, mas o número ao lado mostra o valor verdadeiro.`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
        </span>
      )}
      <div className="relative w-40 h-40" style={{ filter: "drop-shadow(0 0 12px rgba(34,197,94,0.3)) drop-shadow(0 0 12px rgba(59,130,246,0.25))" }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius="74%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            barSize={13}
          >
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                {isNegative ? (
                  <>
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </>
                ) : isOverflow ? (
                  <>
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f97316" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#4ade80" />
                  </>
                )}
              </linearGradient>
            </defs>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            {/* Short, fixed-duration animation: long enough to read as a
                "loading in" transition when the value changes (e.g. switching
                the selected month), short enough that several gauges with
                very different values settle together instead of visibly
                drifting out of sync with each other (the original complaint
                with Recharts' ~1500ms default). */}
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              fill={`url(#${gradientId})`}
              background={{ fill: "var(--muted)" }}
              isAnimationActive
              animationDuration={550}
              animationEasing="ease-out"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center px-2">
          {editing ? (
            <input
              type="number"
              step="0.01"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setEditing(false);
              }}
              className="w-20 text-center text-xl font-black font-mono bg-transparent border-b-2 border-blue-500 outline-none text-foreground"
            />
          ) : (
            <span
              className={`font-black font-mono bg-clip-text text-transparent text-center ${
                isNegative
                  ? "bg-gradient-to-br from-red-400 to-red-600"
                  : isOverflow
                  ? "bg-gradient-to-br from-amber-400 to-orange-500"
                  : "bg-gradient-to-br from-blue-400 to-emerald-400"
              } ${
                // Arbitrary sizes on purpose — a plain `text-3xl` here would get
                // silently forced to a fixed 30px/JetBrains-Mono by the app-wide
                // KPI-number override in index.css, ignoring these three tiers.
                (displayValue?.length ?? 0) > 10
                  ? "text-[0.8rem] leading-tight"
                  : (displayValue?.length ?? 0) > 6
                  ? "text-[1.15rem] leading-none"
                  : "text-[1.6rem] leading-none"
              }`}
            >
              {displayValue !== undefined ? displayValue : `${value.toFixed(0)}%`}
            </span>
          )}
        </div>
      </div>
      <span className="text-xs uppercase font-mono font-bold tracking-wider text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}
