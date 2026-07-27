import { Milestone } from "lucide-react";

interface RoadSignDividerProps {
  label: string;
}

export default function RoadSignDivider({ label }: RoadSignDividerProps) {
  return (
    <div className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 flex items-center justify-center py-2">
      <div className="flex items-center gap-3 bg-card border-2 border-border rounded-xl px-5 py-2.5 shadow-sm -rotate-1">
        <Milestone className="w-4 h-4 text-blue-500 shrink-0" />
        <span className="text-[11px] uppercase tracking-wider font-black text-muted-foreground">
          Próximo destino: {label}
        </span>
      </div>
    </div>
  );
}
