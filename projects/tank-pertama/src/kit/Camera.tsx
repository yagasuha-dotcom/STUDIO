import React from "react";
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from "remotion";
import {useScene} from "./Scene";

type Pose = {x?: number; y?: number; zoom?: number; rot?: number};

/**
 * Kamera sinematik untuk satu scene: bergerak dari pose `from` ke pose `to`
 * sepanjang scene (dolly / push-in / pan), plus guncangan halus opsional.
 *   <Camera from={{zoom: 1}} to={{zoom: 1.25, y: -40}} shake={3}> ... </Camera>
 */
export const Camera: React.FC<{from?: Pose; to?: Pose; shake?: number; children: React.ReactNode}> = ({
  from = {},
  to = {},
  shake = 0,
  children,
}) => {
  const f = useCurrentFrame();
  const {dur} = useScene();
  const ease = {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad)} as const;
  const p = (k: keyof Pose, d: number) => interpolate(f, [0, dur], [from[k] ?? d, to[k] ?? from[k] ?? d], ease);
  const sx = shake ? Math.sin(f * 0.9) * shake : 0;
  const sy = shake ? Math.cos(f * 1.3) * shake : 0;
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${p("x", 0) + sx}px, ${p("y", 0) + sy}px) scale(${p("zoom", 1)}) rotate(${p("rot", 0)}deg)`,
        transformOrigin: "50% 50%",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
