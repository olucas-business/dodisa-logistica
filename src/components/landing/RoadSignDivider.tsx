interface RoadSignDividerProps {
  label: string;
}

export default function RoadSignDivider({ label }: RoadSignDividerProps) {
  return (
    <div className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 flex items-center justify-center gap-4 py-1" aria-hidden="true">
      <span className="h-px w-12 bg-border" />
      <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground/70 whitespace-nowrap">
        {label}
      </span>
      <span className="h-px w-12 bg-border" />
    </div>
  );
}
