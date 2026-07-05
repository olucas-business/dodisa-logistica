import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

export default function RadialGauge({ label, value, color }: { label: string; value: number; color: string }) {
  const data = [{ value: Math.min(100, Math.max(0, value)) }];
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
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" cornerRadius={8} fill={color} background={{ fill: "var(--muted)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black font-mono" style={{ color }}>{value.toFixed(0)}%</span>
        </div>
      </div>
      <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}
