export default function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/5 backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}
