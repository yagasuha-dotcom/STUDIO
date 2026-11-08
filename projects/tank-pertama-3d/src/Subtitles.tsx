import React, {useMemo} from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {EMPHASIS, FPS, LINES, SAFE, SAFE_W, SUB_BOTTOM} from "./config";
import {FONT} from "./fonts";

type Chunk = {text: string; start: number; end: number};

// Gaya referensi: 1–3 kata per kemunculan, ganti cepat (±0,4–0,6 dtk).
const MAX_WORDS = 3;
const MAX_CHARS = 24;

const buildChunks = (): Chunk[] => {
  const out: Chunk[] = [];
  LINES.forEach((ln) => {
    const words = ln.text.split(/\s+/).filter(Boolean);
    const groups: string[][] = [];
    let cur: string[] = [];
    words.forEach((w) => {
      const next = [...cur, w];
      if (cur.length && (next.length > MAX_WORDS || next.join(" ").length > MAX_CHARS)) {
        groups.push(cur);
        cur = [w];
      } else {
        cur = next;
      }
      if (/[,.?!…]$/.test(w)) {
        groups.push(cur);
        cur = [];
      }
    });
    if (cur.length) groups.push(cur);

    const weight = (g: string[]) => g.join(" ").length + 3;
    const total = groups.reduce((s, g) => s + weight(g), 0);
    const a = ln.start + 0.03;
    const b = ln.end - 0.05;
    let t = a;
    groups.forEach((g) => {
      const d = (weight(g) / total) * (b - a);
      out.push({text: g.join(" "), start: t, end: t + d});
      t += d;
    });
  });
  return out;
};

export const Subtitles: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const chunks = useMemo(buildChunks, []);
  const c = chunks.find((x) => t >= x.start && t < x.end);
  if (!c) return null;
  const local = (t - c.start) * FPS;
  const scale = interpolate(local, [0, 3], [0.92, 1], {extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          width: SAFE_W,
          bottom: 1920 - SUB_BOTTOM,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 64,
          lineHeight: 1.15,
          color: "#fff",
          transform: `scale(${scale})`,
          textShadow: "0 3px 14px rgba(0,0,0,.95), 0 0 3px rgba(0,0,0,1), 0 0 22px rgba(0,0,0,.7)",
        }}
      >
        {c.text.split(" ").map((w, i) => {
          const clean = w.replace(/[^\p{L}\d]/gu, "").toLowerCase();
          const hot = EMPHASIS.includes(clean);
          return (
            <span key={i} style={{color: hot ? "#ffbf5e" : "#fff"}}>
              {w}{" "}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
