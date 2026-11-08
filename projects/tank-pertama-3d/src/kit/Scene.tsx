import React, {createContext, useContext} from "react";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from "remotion";
import {FPS} from "../config";

type Ctx = {from: number; dur: number};
const SceneCtx = createContext<Ctx>({from: 0, dur: 1});

/** Info scene aktif: frame awal (absolut) dan durasi (frame). */
export const useScene = () => useContext(SceneCtx);
/** Waktu absolut (detik) – sinkron dengan narasi dan LS()/LE(). */
export const useT = () => {
  const f = useCurrentFrame();
  const {from} = useScene();
  return (f + from) / FPS;
};

const FadeIn: React.FC<{fade: number; children: React.ReactNode}> = ({fade, children}) => {
  const f = useCurrentFrame();
  const o = fade > 0 ? interpolate(f, [0, fade], [0, 1], {extrapolateRight: "clamp"}) : 1;
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

/** Pembungkus scene: potong keras (fade=0) atau dissolve singkat. */
export const Scene: React.FC<{from: number; to: number; fade?: number; children: React.ReactNode}> = ({
  from,
  to,
  fade = 6,
  children,
}) => {
  const dur = Math.max(1, to - from);
  return (
    <Sequence from={from} durationInFrames={dur}>
      <SceneCtx.Provider value={{from, dur}}>
        <FadeIn fade={from === 0 ? 0 : fade}>{children}</FadeIn>
      </SceneCtx.Provider>
    </Sequence>
  );
};
