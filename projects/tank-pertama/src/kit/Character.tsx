import React from "react";
import {useCurrentFrame} from "remotion";
import {PALETTE} from "../config";

export type Mood = "calm" | "angry" | "shock" | "smile";
export type Hat = "none" | "cap" | "officer" | "helmet";

const INK = PALETTE.ink;
const SW = 9; // ketebalan garis tepi (konsisten di semua karakter)

/**
 * Karakter "kepala bulat putih" bergaya stickman: kepala besar, garis tepi tebal,
 * mata berkelopak berat (calm) atau mata lebar (shock), badan kecil, tangan-kaki kurus.
 * Ukuran dasar 400x640; atur dengan `size` (lebar px).
 */
export const Character: React.FC<{
  outfit?: string;
  hat?: Hat;
  hatColor?: string;
  mustache?: boolean;
  mood?: Mood;
  lookX?: number; // -1 kiri … 1 kanan
  size?: number;
  armsUp?: boolean;
  idle?: boolean;
}> = ({outfit = PALETTE.khaki, hat = "cap", hatColor = PALETTE.brown, mustache = false, mood = "calm", lookX = 0, size = 400, armsUp = false, idle = true}) => {
  const f = useCurrentFrame();
  const bob = idle ? Math.sin(f / 14) * 4 : 0;
  const blink = idle && f % 96 > 92;
  const px = lookX * 12;

  const eye = (cx: number) => {
    if (mood === "shock")
      return (
        <g>
          <circle cx={cx} cy={185} r={26} fill="#fff" stroke={INK} strokeWidth={6} />
          <circle cx={cx + px} cy={185} r={8} fill={INK} />
        </g>
      );
    if (blink || mood === "smile")
      return <path d={`M${cx - 22} 188 Q${cx} ${mood === "smile" ? 170 : 192} ${cx + 22} 188`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />;
    return (
      <g>
        <circle cx={cx + px} cy={190} r={9} fill={INK} />
        {/* kelopak berat = ekspresi datar khas gaya referensi */}
        <path d={`M${cx - 26} 184 L${cx + 26} 178`} stroke={INK} strokeWidth={7} strokeLinecap="round" />
        {mood === "angry" && <path d={`M${cx - 30} 160 L${cx + 26} 176`} stroke={INK} strokeWidth={8} strokeLinecap="round" />}
      </g>
    );
  };

  const hatEl = () => {
    if (hat === "cap")
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M92 138 Q200 40 308 138 Z" fill={hatColor} />
          <path d="M92 138 L330 138" fill="none" />
        </g>
      );
    if (hat === "officer")
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M82 140 Q200 56 318 140 Z" fill={hatColor} />
          <rect x={92} y={132} width={216} height={22} rx={8} fill={PALETTE.brown} />
          <path d="M70 154 L330 154" fill="none" />
        </g>
      );
    if (hat === "helmet")
      return (
        <g stroke={INK} strokeWidth={SW} strokeLinejoin="round">
          <path d="M84 150 Q84 40 200 40 Q316 40 316 150 Z" fill={hatColor} />
          <path d="M70 150 L330 150" fill="none" />
        </g>
      );
    return null;
  };

  return (
    <svg width={size} height={(size * 640) / 400} viewBox="0 0 400 640" style={{overflow: "visible"}}>
      <g transform={`translate(0 ${bob})`}>
        {/* kaki */}
        <g stroke={INK} strokeWidth={SW} strokeLinecap="round" fill="none">
          <path d="M165 450 L150 590" />
          <path d="M235 450 L250 590" />
        </g>
        <ellipse cx={140} cy={600} rx={32} ry={16} fill={PALETTE.brown} stroke={INK} strokeWidth={SW} />
        <ellipse cx={260} cy={600} rx={32} ry={16} fill={PALETTE.brown} stroke={INK} strokeWidth={SW} />
        {/* badan */}
        <rect x={125} y={330} width={150} height={150} rx={46} fill={outfit} stroke={INK} strokeWidth={SW} />
        {/* lengan */}
        <g stroke={INK} strokeWidth={SW} strokeLinecap="round" fill="none">
          <path d={armsUp ? "M130 360 L70 270" : "M130 360 L80 440"} />
          <path d={armsUp ? "M270 360 L330 270" : "M270 360 L320 440"} />
        </g>
        <circle cx={armsUp ? 66 : 78} cy={armsUp ? 262 : 448} r={15} fill={PALETTE.brown} stroke={INK} strokeWidth={6} />
        <circle cx={armsUp ? 334 : 322} cy={armsUp ? 262 : 448} r={15} fill={PALETTE.brown} stroke={INK} strokeWidth={6} />
        {/* kepala */}
        <circle cx={200} cy={190} r={118} fill={PALETTE.skin} stroke={INK} strokeWidth={SW} />
        {eye(160)}
        {eye(240)}
        {mustache && <path d="M150 248 Q200 226 250 248 Q200 262 150 248 Z" fill={PALETTE.brown} stroke={INK} strokeWidth={5} />}
        {mood === "shock" && <ellipse cx={200} cy={282} rx={16} ry={20} fill={INK} />}
        {mood === "angry" && !mustache && <path d="M170 280 Q200 266 230 280" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />}
        {mood === "smile" && <path d="M165 268 Q200 296 235 268" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />}
        {hatEl()}
      </g>
    </svg>
  );
};
