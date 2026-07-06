import { useId } from "react";
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

export default function RadialGauge({ label, value, displayValue }: { label: string; value: number; displayValue?: string }) {
  const data = [{ value: Math.min(100, Math.max(0, value)) }];
  const gradientId = `gauge-grad-${useId().replace(/:/g, "")}`;
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm">
      <div className="relative w-24 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius="72%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            barSize={8}
          >
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" cornerRadius={8} fill={`url(#${gradientId})`} background={{ fill: "var(--muted)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center px-1">
          <span className="text-lg font-black font-mono bg-gradient-to-br from-blue-500 to-emerald-500 bg-clip-text text-transparent text-center leading-none">
            {displayValue !== undefined ? displayValue : `${value.toFixed(0)}%`}
          </span>
        </div>
      </div>
      <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}
