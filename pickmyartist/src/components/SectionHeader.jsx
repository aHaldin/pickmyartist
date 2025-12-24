export default function SectionHeader({ eyebrow, title, subtitle = "" }) {
  return (
    <div className="flex flex-col gap-3">
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold text-white">{title}</h2>
      {subtitle ? <p className="text-sm text-white/70">{subtitle}</p> : null}
    </div>
  );
}
