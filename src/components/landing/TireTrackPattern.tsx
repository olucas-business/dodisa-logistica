const TIRE_TREAD_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'>
    <path d='M0 24 L24 0 M24 48 L48 24' stroke='#64748B' stroke-width='5' stroke-linecap='round' fill='none'/>
  </svg>`
)}`;

export default function TireTrackPattern() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 opacity-[0.05] pointer-events-none z-0"
      style={{
        backgroundImage: `url("${TIRE_TREAD_SVG}")`,
        backgroundRepeat: "repeat",
        backgroundSize: "48px 48px",
      }}
    />
  );
}
