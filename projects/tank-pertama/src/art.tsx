import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {PALETTE} from "./config";
import {FONT} from "./fonts";
import {useT} from "./kit/Scene";

const INK = PALETTE.ink;
export const clampI = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

/** Langit + bukit jauh + tanah berlumpur. `horizon` = y garis tanah. */
export const Ground: React.FC<{horizon: number}> = ({horizon}) => {
  const dots = Array.from({length: 46}, (_, i) => ({
    x: (Math.abs(Math.sin(i * 12.9898)) * 1080) % 1080,
    y: horizon + 30 + ((Math.abs(Math.sin(i * 78.233)) * 43758) % (1920 - horizon - 40)),
    r: 4 + (i % 5) * 2,
  }));
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: "absolute", left: 0, top: 0}}>
      <defs>
        <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#caa575" />
          <stop offset="1" stopColor={PALETTE.wall} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={horizon} fill="url(#skyg)" />
      <path
        d={`M0 ${horizon - 60} Q180 ${horizon - 170} 360 ${horizon - 70} T720 ${horizon - 100} T1080 ${horizon - 60} L1080 ${horizon} L0 ${horizon} Z`}
        fill="#b59a6b"
        opacity={0.8}
      />
      <rect x={0} y={horizon} width={1080} height={1920 - horizon} fill={PALETTE.floor} />
      <rect x={0} y={horizon - 6} width={1080} height={12} fill={INK} opacity={0.6} />
      {dots.map((d, i) => (
        <ellipse key={i} cx={d.x} cy={d.y} rx={d.r * 1.8} ry={d.r} fill="#5e482f" opacity={0.55} />
      ))}
    </svg>
  );
};

/** Dinding baja berpaku keling (interior tank). */
export const Steel: React.FC = () => {
  const plates = [0, 1, 2, 3, 4, 5];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: "absolute", left: 0, top: 0}}>
      <defs>
        <linearGradient id="steelg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#64665d" />
          <stop offset="1" stopColor="#34332d" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#steelg)" />
      {plates.map((p) => (
        <g key={p}>
          <rect x={p * 200 - 40} y={0} width={14} height={1920} fill="#2b2a25" opacity={0.7} />
          {Array.from({length: 22}, (_, r) => (
            <circle key={r} cx={p * 200 - 18} cy={80 + r * 90} r={7} fill="#25241f" stroke="#7b7d72" strokeWidth={2} />
          ))}
        </g>
      ))}
      <rect x={0} y={1400} width={1080} height={520} fill="#241f19" />
    </svg>
  );
};

/** Tank belah ketupat tampak samping (rhomboid). */
export const Tank: React.FC<{width?: number; moving?: boolean; hiFront?: boolean}> = ({width = 600, moving = false, hiFront = false}) => {
  const f = useCurrentFrame();
  const off = moving ? -f * 3 : 0;
  const bounce = moving ? Math.sin(f / 3) * 2 : 0;
  const hull = "40,250 140,95 370,95 480,250";
  const pulse = 0.55 + 0.45 * Math.sin(f / 4);
  return (
    <svg width={width} height={(width * 320) / 520} viewBox="0 0 520 320" style={{overflow: "visible"}}>
      <ellipse cx={260} cy={292} rx={236} ry={14} fill="rgba(0,0,0,.25)" />
      <g transform={`translate(0 ${bounce})`}>
        <polygon points={hull} fill="none" stroke="#2f241a" strokeWidth={40} strokeLinejoin="round" />
        <polygon points={hull} fill="none" stroke="#6a5842" strokeWidth={28} strokeLinejoin="round" strokeDasharray="12 12" strokeDashoffset={off} />
        <polygon points="95,232 165,125 345,125 425,232" fill="#7b7d4e" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <rect x={200} y={74} width={92} height={32} rx={8} fill="#6c6e42" stroke={INK} strokeWidth={6} />
        <rect x={214} y={84} width={64} height={8} rx={4} fill={INK} />
        <rect x={230} y={150} width={100} height={62} rx={10} fill="#8e9158" stroke={INK} strokeWidth={6} />
        <rect x={326} y={172} width={66} height={14} rx={5} fill="#4d5560" stroke={INK} strokeWidth={5} />
        {Array.from({length: 11}, (_, i) => (
          <circle key={i} cx={122 + i * 28} cy={222} r={3.5} fill={INK} opacity={0.6} />
        ))}
        {hiFront && <line x1={370} y1={95} x2={480} y2={250} stroke="#ffbf5e" strokeWidth={12} strokeLinecap="round" opacity={pulse} />}
      </g>
    </svg>
  );
};

/** Kepulan asap yang naik terus-menerus. */
export const Puffs: React.FC<{x: number; y: number; n?: number; spread?: number; size?: number; strength?: number; color?: string}> = ({
  x,
  y,
  n = 8,
  spread = 60,
  size = 1,
  strength = 1,
  color = "#8c8a85",
}) => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
      {Array.from({length: n}, (_, i) => {
        const ph = (f / 70 + i / n) % 1;
        const cx = x + Math.sin(i * 2.3) * spread + Math.sin(f / 20 + i) * 14;
        const cy = y - ph * 260 * size;
        return <circle key={i} cx={cx} cy={cy} r={(26 + ph * 70) * size} fill={color} opacity={(1 - ph) * 0.6 * strength} />;
      })}
    </svg>
  );
};

/** Ledakan: kilatan oranye + asap abu + serpihan (tanpa gore). */
export const Burst: React.FC<{x: number; y: number; at: number; size?: number}> = ({x, y, at, size = 220}) => {
  const t = useT();
  const k = (t - at) / 1.0;
  if (k < 0 || k > 1) return null;
  const e = 1 - Math.pow(1 - k, 2);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
      <circle cx={x} cy={y - e * 70} r={size * 0.7 * (0.6 + e)} fill="#6e6a64" opacity={0.55 * (1 - k)} />
      <circle cx={x} cy={y} r={size * 0.5 * (0.3 + e)} fill={PALETTE.fire} opacity={1 - k} />
      <circle cx={x} cy={y} r={size * 0.28 * (0.3 + e)} fill="#ffe08a" opacity={1 - k} />
      {Array.from({length: 9}, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return <rect key={i} x={x + Math.cos(a) * size * e * 0.9} y={y + Math.sin(a) * size * e * 0.9 - 40 * e} width={16} height={10} fill={INK} opacity={1 - k} transform={`rotate(${i * 40} ${x} ${y})`} />;
      })}
    </svg>
  );
};

/** Peluru (garis kuning) melesat dari kanan ke kiri. */
export const Bullets: React.FC<{y: number; band?: number}> = ({y, band = 120}) => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
      {Array.from({length: 16}, (_, i) => {
        const x = 1300 - ((f * 36 + i * 191) % 1500);
        const yy = y + ((i * 37) % band);
        return <line key={i} x1={x} y1={yy} x2={x + 80} y2={yy} stroke="#ffd98a" strokeWidth={5} strokeLinecap="round" opacity={0.9} />;
      })}
      <circle cx={1040} cy={y + 40} r={26 + (f % 6) * 5} fill="#ffcf6a" opacity={0.55} />
    </svg>
  );
};

/** Termometer vertikal. level 0–1. */
export const Thermo: React.FC<{level: number}> = ({level}) => {
  const fillH = 600 * Math.max(0, Math.min(1, level));
  return (
    <svg width={220} height={900} viewBox="0 0 220 900" style={{overflow: "visible"}}>
      <circle cx={110} cy={780} r={88} fill="#e5392a" stroke={INK} strokeWidth={9} />
      <rect x={62} y={40} width={96} height={700} rx={48} fill={PALETTE.skin} stroke={INK} strokeWidth={9} />
      <rect x={82} y={740 - fillH} width={56} height={fillH + 20} fill="#e5392a" />
      <circle cx={110} cy={780} r={74} fill="#e5392a" />
      {[0.25, 0.5, 0.75, 1].map((m) => (
        <line key={m} x1={158} y1={740 - 600 * m} x2={190} y2={740 - 600 * m} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      ))}
    </svg>
  );
};

/** Teks tebal tengah-horizontal pada posisi x (tengah) dan y (atas). */
export const Tag: React.FC<{text: string; x?: number; y: number; size?: number; color?: string; opacity?: number; scale?: number}> = ({
  text,
  x = 540,
  y,
  size = 80,
  color = "#fff",
  opacity = 1,
  scale = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - 540,
      width: 1080,
      top: y,
      textAlign: "center",
      fontFamily: FONT,
      fontWeight: 900,
      fontSize: size,
      color,
      opacity,
      transform: `scale(${scale})`,
      whiteSpace: "nowrap",
      textShadow: "0 4px 0 rgba(42,29,20,.9), 0 0 18px rgba(0,0,0,.6)",
    }}
  >
    {text}
  </div>
);

export const fadeIn = (t: number, at: number, d = 0.4) => interpolate(t, [at, at + d], [0, 1], clampI);
