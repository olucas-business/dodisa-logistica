interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { badge: "w-9 h-9 rounded-lg", icon: "w-[20px] h-[20px]" },
  md: { badge: "w-10 h-10 rounded-xl", icon: "w-[22px] h-[22px]" },
  lg: { badge: "w-11 h-11 rounded-xl", icon: "w-6 h-6" },
};

export default function BrandMark({ size = "md", className = "" }: BrandMarkProps) {
  const { badge, icon } = SIZES[size];

  return (
    <div
      className={`relative ${badge} flex-shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0B3D5C] to-[#153F73] shadow-lg shadow-blue-900/30 border border-white/10 group ${className}`}
    >
      {/* Glass highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />

      {/* Fleet One mark: setas convergentes — fluxo, rota, direção, precisão */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={`${icon} relative z-10 transform group-hover:scale-110 transition-transform duration-300`}
      >
        <path d="M12 14 L22 24 L12 34" stroke="#5B8DEF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        <path d="M19 14 L29 24 L19 34" stroke="#8FB2F5" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
        <path d="M26 14 L36 24 L26 34" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping m-0.5" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full m-0.5" />
    </div>
  );
}
