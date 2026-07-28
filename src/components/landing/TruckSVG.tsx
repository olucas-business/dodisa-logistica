import { motion } from "motion/react";

interface TruckSVGProps {
  reduced: boolean;
}

interface WheelProps {
  cx: number;
  cy: number;
  reduced: boolean;
}

function Wheel({ cx, cy, reduced }: WheelProps) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={24} fill="#1E293B" stroke="#0F172A" strokeWidth={2} />
      <circle r={13} fill="url(#rimGrad)" />
      <g>
        <rect x={-2} y={-11} width={4} height={22} rx={1.5} fill="#475569" />
        <rect x={-11} y={-2} width={22} height={4} rx={1.5} fill="#475569" />
        {!reduced && (
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.7s" repeatCount="indefinite" />
        )}
      </g>
      <circle r={4} fill="#0F172A" />
    </g>
  );
}

export default function TruckSVG({ reduced }: TruckSVGProps) {
  return (
    <motion.div
      className="relative w-full h-full"
      animate={reduced ? undefined : { y: [0, -3, 0] }}
      transition={reduced ? undefined : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 400 170" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id="cabGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2455D9" />
            <stop offset="100%" stopColor="#0B3D5C" />
          </linearGradient>
          <linearGradient id="trailerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          <linearGradient id="rimGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
          <radialGradient id="headlightGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx={190} cy={158} rx={190} ry={8} fill="#0B0F19" opacity={0.18} />

        {/* Trailer */}
        <rect x={8} y={28} width={222} height={98} rx={8} fill="url(#trailerGrad)" stroke="#94A3B8" strokeWidth={1.5} />
        <rect x={8} y={28} width={222} height={16} rx={8} fill="#E2E8F0" opacity={0.6} />
        <line x1={70} y1={28} x2={70} y2={126} stroke="#CBD5E1" strokeWidth={1.5} />
        <line x1={150} y1={28} x2={150} y2={126} stroke="#CBD5E1" strokeWidth={1.5} />

        {/* Exhaust stack */}
        <rect x={222} y={12} width={10} height={44} rx={3} fill="url(#rimGrad)" stroke="#64748B" strokeWidth={1} />

        {/* Cab */}
        <path
          d="M 232 126 L 232 66 Q 232 56 242 56 L 300 56 Q 312 56 320 66 L 344 100 L 372 100 L 372 126 Z"
          fill="url(#cabGrad)"
          stroke="#0B3D5C"
          strokeWidth={1.5}
        />
        {/* Windshield */}
        <path d="M 246 64 L 300 64 Q 308 64 314 72 L 322 88 L 250 88 Z" fill="#BFDBFE" opacity={0.75} />
        {/* Side mirror */}
        <rect x={236} y={58} width={5} height={16} rx={2} fill="#0B3D5C" />
        {/* Door line */}
        <line x1={300} y1={56} x2={300} y2={126} stroke="#0B3D5C" strokeWidth={1.2} opacity={0.5} />
        {/* Bumper */}
        <rect x={344} y={104} width={30} height={16} rx={4} fill="#1E293B" />
        {/* Headlight glow + lamp */}
        <circle cx={366} cy={96} r={14} fill="url(#headlightGlow)" className={reduced ? "" : "headlight-glow"} />
        <rect x={360} y={90} width={10} height={8} rx={2} fill="#FDE68A" />
        {/* Taillight accent on trailer */}
        <rect x={12} y={70} width={4} height={14} rx={1.5} fill="#EF4444" opacity={0.85} />

        {/* Wheels */}
        <Wheel cx={40} cy={140} reduced={reduced} />
        <Wheel cx={95} cy={140} reduced={reduced} />
        <Wheel cx={190} cy={140} reduced={reduced} />
        <Wheel cx={300} cy={140} reduced={reduced} />
      </svg>

      {!reduced && (
        <>
          <span className="exhaust-puff absolute w-3 h-3 rounded-full bg-slate-400/50" style={{ left: "55%", top: "4%", animationDelay: "0s" }} aria-hidden="true" />
          <span className="exhaust-puff absolute w-2.5 h-2.5 rounded-full bg-slate-400/40" style={{ left: "56.5%", top: "4%", animationDelay: "0.6s" }} aria-hidden="true" />
          <span className="exhaust-puff absolute w-2 h-2 rounded-full bg-slate-400/30" style={{ left: "54%", top: "4%", animationDelay: "1.2s" }} aria-hidden="true" />
        </>
      )}
    </motion.div>
  );
}
