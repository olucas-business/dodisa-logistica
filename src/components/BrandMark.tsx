interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { badge: "w-9 h-9 rounded-lg", icon: "w-[18px] h-[18px]" },
  md: { badge: "w-10 h-10 rounded-xl", icon: "w-5 h-5" },
  lg: { badge: "w-11 h-11 rounded-xl", icon: "w-[22px] h-[22px]" },
};

export default function BrandMark({ size = "md", className = "" }: BrandMarkProps) {
  const { badge, icon } = SIZES[size];

  return (
    <div
      className={`relative ${badge} flex-shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-700 shadow-lg shadow-indigo-500/30 border border-white/10 group ${className}`}
    >
      {/* Glass highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent" />
      <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-white/10 rounded-full blur-md" />

      {/* Custom truck + route glyph */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`${icon} relative z-10 transform group-hover:scale-110 transition-transform duration-300`}
      >
        <path
          d="M2.5 6.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v8.5h-11v-8.5Z"
          fill="white"
          fillOpacity="0.95"
        />
        <path
          d="M13.5 9.5h3.3a1 1 0 0 1 .8.4l2.2 2.9a1 1 0 0 1 .2.6v2.6h-6.5v-6.5Z"
          fill="white"
          fillOpacity="0.7"
        />
        <circle cx="6.5" cy="16.5" r="1.9" fill="white" />
        <circle cx="6.5" cy="16.5" r="0.7" className="fill-indigo-600" />
        <circle cx="16.5" cy="16.5" r="1.9" fill="white" />
        <circle cx="16.5" cy="16.5" r="0.7" className="fill-indigo-600" />
        <path
          d="M1 19c1.8-1.4 3.6-1.4 5.4 0s3.6 1.4 5.4 0 3.6-1.4 5.4 0 3.6 1.4 5.4 0"
          stroke="white"
          strokeOpacity="0.55"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping m-0.5" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full m-0.5" />
    </div>
  );
}
