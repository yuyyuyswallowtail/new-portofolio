/** Lapisan di belakang konten: glow fosfor, roll bar, dan glitch bar. */
export function CrtBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[28px] md:rounded-[40px]"
    >
      <div className="crt-glow" />
      <div className="crt-roll" />
      <div className="crt-glitch-bar" />
      <div className="crt-glitch-bar crt-glitch-bar-b" />
    </div>
  );
}

/** Lapisan tipis di atas konten: scanline, vignette, dan lengkung tepi layar. */
export function CrtOverlay() {
  return <div aria-hidden="true" className="crt-overlay" />;
}
