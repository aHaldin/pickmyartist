export default function Pill({ children, className = "" }) {
  return (
    <span
      className={`rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-widest text-white/60 ${className}`}
    >
      {children}
    </span>
  );
}
