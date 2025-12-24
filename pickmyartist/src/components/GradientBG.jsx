export default function GradientBG() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -left-40 top-[-200px] h-96 w-96 rounded-full blur-[160px]"
        style={{
          background:
            "radial-gradient(circle, rgba(138,43,226,0.35) 0%, rgba(138,43,226,0) 70%)",
        }}
      />
      <div
        className="absolute right-[-160px] top-10 h-[28rem] w-[28rem] rounded-full blur-[180px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255,45,149,0.35) 0%, rgba(255,45,149,0) 70%)",
        }}
      />
      <div
        className="absolute bottom-[-200px] left-1/3 h-80 w-80 rounded-full blur-[150px]"
        style={{
          background:
            "radial-gradient(circle, rgba(138,43,226,0.25) 0%, rgba(138,43,226,0) 70%)",
        }}
      />
    </div>
  );
}
