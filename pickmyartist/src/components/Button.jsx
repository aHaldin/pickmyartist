export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-full text-xs uppercase tracking-[0.3em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    primary:
      "bg-gradient-to-r from-[#8A2BE2] to-[#FF2D95] text-white shadow-[0_0_25px_rgba(138,43,226,0.35)] hover:opacity-90",
    secondary:
      "border border-white/20 text-white/80 hover:border-white hover:text-white",
    ghost:
      "border border-white/10 text-white/60 hover:border-white/40 hover:text-white",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
