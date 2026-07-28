import { motion } from "motion/react";

interface TruckSVGProps {
  reduced: boolean;
}

interface WheelProps {
  cx: number;
  cy: number;
  reduced: boolean;
}

const LUG_ANGLES = Array.from({ length: 5 }, (_, i) => (i / 5) * Math.PI * 2);

function Wheel({ cx, cy, reduced }: WheelProps) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={25} fill="#1E293B" stroke="#0F172A" strokeWidth={2} />
      <circle r={25} fill="none" stroke="#334155" strokeWidth={3} strokeDasharray="4 5.5" opacity={0.55} />
      <circle r={14} fill="url(#rimGrad)" stroke="#64748B" strokeWidth={1} />
      <g>
        {LUG_ANGLES.map((angle, i) => (
          <circle key={i} cx={Math.cos(angle) * 8} cy={Math.sin(angle) * 8} r={2.2} fill="#475569" />
        ))}
        {!reduced && (
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="0.7s" repeatCount="indefinite" />
        )}
      </g>
      <circle r={4.5} fill="url(#rimGrad)" stroke="#475569" strokeWidth={0.75} />
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
      <svg viewBox="0 0 420 190" className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id="cabGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2F63E0" />
            <stop offset="55%" stopColor="#1D4FB8" />
            <stop offset="100%" stopColor="#0B3D5C" />
          </linearGradient>
          <linearGradient id="trailerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#E7ECF3" />
            <stop offset="100%" stopColor="#B8C4D6" />
          </linearGradient>
          <linearGradient id="rimGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#8493A8" />
          </linearGradient>
          <linearGradient id="bumperGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <radialGradient id="headlightGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx={205} cy={177} rx={205} ry={7} fill="#0B0F19" opacity={0.18} />

        {/* Trailer */}
        <rect x={10} y={45} width={225} height={100} rx={8} fill="url(#trailerGrad)" stroke="#94A3B8" strokeWidth={1.5} />
        <rect x={10} y={45} width={225} height={5} rx={2.5} fill="#FFFFFF" opacity={0.7} />
        <line x1={78} y1={45} x2={78} y2={145} stroke="#C7D2E0" strokeWidth={1.5} />
        <line x1={160} y1={45} x2={160} y2={145} stroke="#C7D2E0" strokeWidth={1.5} />
        <rect x={10} y={137} width={225} height={8} fill="#0B0F19" opacity={0.08} />
        {/* Mudflap behind rear axle */}
        <rect x={22} y={145} width={11} height={19} rx={2} fill="#1E293B" opacity={0.85} />
        {/* Taillight accent on trailer */}
        <rect x={13} y={68} width={4} height={15} rx={1.5} fill="#EF4444" opacity={0.85} />

        {/* Exhaust stack */}
        <rect x={232} y={16} width={11} height={46} rx={3} fill="url(#rimGrad)" stroke="#64748B" strokeWidth={1} />
        <ellipse cx={237.5} cy={16} rx={7} ry={3.5} fill="#CBD5E1" stroke="#64748B" strokeWidth={0.75} />
        <line x1={232} y1={36} x2={243} y2={36} stroke="#64748B" strokeWidth={1} opacity={0.6} />
        <line x1={232} y1={48} x2={243} y2={48} stroke="#64748B" strokeWidth={1} opacity={0.6} />

        {/* Roof visor */}
        <path d="M 244 58 L 350 58 L 357 51 L 249 51 Z" fill="#0B3D5C" />

        {/* Cab body (cab-over profile) */}
        <rect x={245} y={58} width={100} height={87} rx={10} fill="url(#cabGrad)" stroke="#0B3D5C" strokeWidth={1.5} />
        <rect x={249} y={61} width={93} height={3} rx={1.5} fill="#FFFFFF" opacity={0.3} />

        {/* Windshield */}
        <rect x={253} y={70} width={84} height={33} rx={6} fill="#BFDBFE" opacity={0.85} />
        <polygon points="259,72 275,72 264,101 256,101" fill="#FFFFFF" opacity={0.2} />
        <line x1={296} y1={70} x2={296} y2={103} stroke="#0B3D5C" strokeWidth={2.5} />

        {/* Side mirror */}
        <line x1={246} y1={68} x2={239} y2={72} stroke="#0B3D5C" strokeWidth={2} />
        <rect x={233} y={70} width={6} height={14} rx={2} fill="#0B3D5C" stroke="#08243A" strokeWidth={0.75} />

        {/* Grille */}
        <rect x={258} y={110} width={80} height={16} rx={3} fill="#1E293B" />
        <line x1={261} y1={115} x2={335} y2={115} stroke="#475569" strokeWidth={1.4} opacity={0.8} />
        <line x1={261} y1={120} x2={335} y2={120} stroke="#475569" strokeWidth={1.4} opacity={0.8} />

        {/* Bumper */}
        <rect x={250} y={128} width={92} height={15} rx={5} fill="url(#bumperGrad)" />
        <rect x={252} y={129} width={88} height={2.5} rx={1.25} fill="#94A3B8" opacity={0.7} />

        {/* Fuel tank */}
        <rect x={272} y={134} width={58} height={17} rx={8.5} fill="url(#rimGrad)" stroke="#64748B" strokeWidth={1} />

        {/* Headlight + indicator */}
        <circle cx={335} cy={121} r={14} fill="url(#headlightGlow)" className={reduced ? "" : "headlight-glow"} />
        <rect x={329} y={114} width={12} height={9} rx={2.5} fill="#FEF3C7" stroke="#D97706" strokeWidth={0.75} />
        <rect x={329} y={125} width={12} height={4} rx={1.5} fill="#F59E0B" opacity={0.9} />

        {/* Wheels */}
        <Wheel cx={45} cy={150} reduced={reduced} />
        <Wheel cx={102} cy={150} reduced={reduced} />
        <Wheel cx={205} cy={150} reduced={reduced} />
        <Wheel cx={325} cy={150} reduced={reduced} />
      </svg>

      {!reduced && (
        <>
          <span className="exhaust-puff absolute w-3 h-3 rounded-full bg-slate-400/50" style={{ left: "55%", top: "5%", animationDelay: "0s" }} aria-hidden="true" />
          <span className="exhaust-puff absolute w-2.5 h-2.5 rounded-full bg-slate-400/40" style={{ left: "56.5%", top: "5%", animationDelay: "0.6s" }} aria-hidden="true" />
          <span className="exhaust-puff absolute w-2 h-2 rounded-full bg-slate-400/30" style={{ left: "54%", top: "5%", animationDelay: "1.2s" }} aria-hidden="true" />
        </>
      )}
    </motion.div>
  );
}
