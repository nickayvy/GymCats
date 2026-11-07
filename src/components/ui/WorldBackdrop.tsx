// Fixed, blurred dusk landscape behind every screen, with drifting fireflies.
// Pure SVG/CSS so it renders on the server and costs nothing to load.
// The far ridge has a pair of cat-ear peaks.

const MOTES = [
  { left: "6%", dur: "16s", delay: "0s", sway: "30px" },
  { left: "14%", dur: "21s", delay: "-6s", sway: "-20px" },
  { left: "23%", dur: "18s", delay: "-11s", sway: "26px" },
  { left: "31%", dur: "24s", delay: "-3s", sway: "-34px" },
  { left: "42%", dur: "19s", delay: "-14s", sway: "18px" },
  { left: "51%", dur: "23s", delay: "-8s", sway: "-24px" },
  { left: "60%", dur: "17s", delay: "-2s", sway: "32px" },
  { left: "68%", dur: "22s", delay: "-16s", sway: "-18px" },
  { left: "77%", dur: "20s", delay: "-5s", sway: "22px" },
  { left: "85%", dur: "25s", delay: "-12s", sway: "-30px" },
  { left: "93%", dur: "18s", delay: "-9s", sway: "20px" },
] as const;

export function WorldBackdrop(): React.JSX.Element {
  return (
    <div className="gc-world" aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="gc-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0c1a22" />
            <stop offset="0.45" stopColor="#1f3b42" />
            <stop offset="0.72" stopColor="#6b5a48" />
            <stop offset="0.86" stopColor="#c58a52" />
          </linearGradient>
          <radialGradient id="gc-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff2c8" stopOpacity="0.95" />
            <stop offset="0.25" stopColor="#ffd38a" stopOpacity="0.6" />
            <stop offset="1" stopColor="#ff9a4a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="gc-mist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d9c7a8" stopOpacity="0" />
            <stop offset="0.5" stopColor="#d9c7a8" stopOpacity="0.28" />
            <stop offset="1" stopColor="#d9c7a8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gc-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#14201e" />
            <stop offset="1" stopColor="#070b0a" />
          </linearGradient>
        </defs>

        <rect width="1600" height="900" fill="url(#gc-sky)" />

        {/* sun low over the cat-ear peaks */}
        <circle cx="1040" cy="560" r="300" fill="url(#gc-sun)" />
        <circle cx="1040" cy="560" r="46" fill="#fff6dc" opacity="0.85" />

        {/* far ridge with cat-ear peaks */}
        <path
          d="M0 610 L120 560 L230 585 L360 520 L470 560 L560 540 L640 470 L700 420 L760 500 L820 495 L880 410 L940 480 L1010 520 L1120 500 L1240 545 L1360 520 L1480 560 L1600 540 L1600 900 L0 900 Z"
          fill="#34423f"
        />

        <rect x="0" y="520" width="1600" height="140" fill="url(#gc-mist)" />

        {/* middle hills */}
        <path
          d="M0 680 C120 640 220 650 330 670 C450 692 520 640 640 630 C760 620 860 668 980 660 C1100 652 1180 610 1300 620 C1420 630 1520 664 1600 650 L1600 900 L0 900 Z"
          fill="#25322f"
        />

        {/* distant ruin tower */}
        <path d="M300 668 L300 600 L306 592 L322 592 L328 600 L328 668 Z" fill="#25322f" />
        <rect x="309" y="606" width="10" height="14" fill="#c58a52" opacity="0.5" />

        <rect x="0" y="640" width="1600" height="120" fill="url(#gc-mist)" opacity="0.7" />

        {/* near ground with pines */}
        <path
          d="M0 760 C160 730 300 742 460 755 C620 768 760 728 930 732 C1100 736 1240 770 1400 758 C1500 750 1560 742 1600 744 L1600 900 L0 900 Z"
          fill="url(#gc-near)"
        />
        <g fill="#0b1211">
          <path d="M90 770 L120 660 L150 770 Z" />
          <path d="M140 772 L162 690 L184 772 Z" />
          <path d="M1380 770 L1414 640 L1448 770 Z" />
          <path d="M1440 768 L1466 680 L1492 768 Z" />
          <path d="M1500 766 L1522 700 L1544 766 Z" />
        </g>
      </svg>
      {MOTES.map((m) => (
        <span
          key={m.left}
          className="gc-mote"
          style={
            {
              left: m.left,
              "--dur": m.dur,
              "--delay": m.delay,
              "--sway": m.sway,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
