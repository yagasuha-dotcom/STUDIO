import React from "react";
import {AbsoluteFill, random, useCurrentFrame} from "remotion";
import {H, W} from "../config";

/**
 * Lapisan akhir "2.5D lukisan" di atas render 3D:
 * tint hangat, vignette, serat kertas tak bergerak, butiran film, dan debu melayang.
 */
export const Grade: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{background: "rgba(255,170,80,.10)", mixBlendMode: "multiply", pointerEvents: "none"}} />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 50%, rgba(25,10,0,.6) 100%)",
          pointerEvents: "none",
        }}
      />
      {/* serat kertas (statis) */}
      <AbsoluteFill style={{mixBlendMode: "multiply", opacity: 0.22, pointerEvents: "none"}}>
        <svg width={W} height={H}>
          <filter id="paper">
            <feTurbulence type="fractalNoise" baseFrequency="0.04 0.9" numOctaves={3} seed={3} stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.6  0 0 0 0 0.5  0 0 0 0 0.35  0 0 0 0.9 0" />
          </filter>
          <rect width={W} height={H} filter="url(#paper)" />
        </svg>
      </AbsoluteFill>
      {/* butiran film (bergerak tiap frame) */}
      <AbsoluteFill style={{mixBlendMode: "overlay", opacity: 0.1, pointerEvents: "none"}}>
        <svg width={W} height={H}>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 7} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width={W} height={H} filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
      {/* debu melayang */}
      <AbsoluteFill style={{pointerEvents: "none"}}>
        {Array.from({length: 26}, (_, i) => {
          const sp = 0.25 + random(`dsp${i}`) * 0.6;
          const x = (random(`dx${i}`) * (W + 200) + f * sp * 2.2) % (W + 200) - 100;
          const y = (random(`dy${i}`) * H + Math.sin(f / 40 + i) * 30 - f * sp * 0.6 + H * 4) % H;
          const r = 2 + random(`dr${i}`) * 4;
          return <div key={i} style={{position: "absolute", left: x, top: y, width: r, height: r, borderRadius: "50%", background: "rgba(255,236,200,.35)"}} />;
        })}
      </AbsoluteFill>
    </>
  );
};
