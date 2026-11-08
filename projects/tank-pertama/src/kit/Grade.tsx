import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {H, W} from "../config";

/** Color grade hangat: tint sepia, vignette lembut, butiran film tipis. */
export const Grade: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{background: "rgba(255,170,80,.10)", mixBlendMode: "multiply", pointerEvents: "none"}} />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 52%, rgba(20,8,0,.55) 100%)",
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill style={{mixBlendMode: "overlay", opacity: 0.1, pointerEvents: "none"}}>
        <svg width={W} height={H}>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 7} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width={W} height={H} filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </>
  );
};
