interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { badge: "w-9 h-9 rounded-lg", icon: "w-[22px] h-[22px]" },
  md: { badge: "w-10 h-10 rounded-xl", icon: "w-6 h-6" },
  lg: { badge: "w-11 h-11 rounded-xl", icon: "w-[26px] h-[26px]" },
};

export default function BrandMark({ size = "md", className = "" }: BrandMarkProps) {
  const { badge, icon } = SIZES[size];

  return (
    <div
      className={`relative ${badge} flex-shrink-0 flex items-center justify-center overflow-hidden bg-slate-900 shadow-lg shadow-amber-500/20 border border-white/10 group ${className}`}
    >
      {/* Glass highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />

      {/* Two "D" letters stylized as forward arrows, + truck on top */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`${icon} relative z-10 transform group-hover:scale-110 transition-transform duration-300`}
      >
        {/* First "D" arrow */}
        <path d="M2 3.5v17l6.5-1.4c3-2.6 3-11.6 0-14.2L2 3.5Z" fill="#FBBF24" fillOpacity="0.9" />
        {/* Second "D" arrow, offset to the right */}
        <path d="M10.5 3.5v17l6.5-1.4c3-2.6 3-11.6 0-14.2L10.5 3.5Z" fill="#F59E0B" />

        {/* Truck silhouette on top */}
        <g transform="translate(1.5,7.5)">
          <rect x="0" y="0" width="12" height="7" rx="1" fill="white" />
          <path d="M12 2h3.6a1 1 0 0 1 .8.4l2.1 2.7a1 1 0 0 1 .2.6V7h-6.7V2Z" fill="white" fillOpacity="0.85" />
          <circle cx="3.2" cy="8.2" r="1.7" fill="#0F172A" stroke="white" strokeWidth="0.8" />
          <circle cx="15.3" cy="8.2" r="1.7" fill="#0F172A" stroke="white" strokeWidth="0.8" />
        </g>
      </svg>

      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping m-0.5" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full m-0.5" />
    </div>
  );
}
