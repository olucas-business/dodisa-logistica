import { useId, useState } from "react";
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Pencil } from "lucide-react";

interface RadialGaugeProps {
  label: string;
  value: number;
  displayValue?: string;
  editable?: boolean;
  onEdit?: (newValue: number) => void;
}

export default function RadialGauge({ label, value, displayValue, editable, onEdit }: RadialGaugeProps) {
  const data = [{ value: Math.min(100, Math.max(0, value)) }];
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
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
            </defs>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" cornerRadius={10} fill={`url(#${gradientId})`} background={{ fill: "var(--muted)" }} />
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
              className={`font-black font-mono bg-gradient-to-br from-blue-400 to-emerald-400 bg-clip-text text-transparent text-center leading-none ${
                (displayValue?.length ?? 0) > 6 ? "text-2xl" : "text-4xl"
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
