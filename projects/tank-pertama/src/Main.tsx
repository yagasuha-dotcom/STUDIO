import React from "react";
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from "remotion";
import {LE, LS, PART2_START, TOTAL_FRAMES, sf} from "./config";
import {Grade} from "./kit/Grade";
import {Scene} from "./kit/Scene";
import {SCENES} from "./story";
import {Subtitles} from "./Subtitles";

export const Main: React.FC = () => {
  const f = useCurrentFrame();
  const last = SCENES.length - 1;
  return (
    <AbsoluteFill style={{background: "#000"}}>
      {SCENES.map((s, i) => (
        <Scene
          key={i}
          fade={s.fade}
          from={i === 0 ? 0 : sf(LS(s.lines[0])) - 4}
          to={i === last ? TOTAL_FRAMES : sf(LE(s.lines[1])) + 4}
        >
          {s.el}
        </Scene>
      ))}

      <Grade />
      <Subtitles />
      <AbsoluteFill
        style={{
          background: "#000",
          opacity: interpolate(f, [TOTAL_FRAMES - 30, TOTAL_FRAMES - 2], [0, 1], {extrapolateLeft: "clamp"}),
          pointerEvents: "none",
        }}
      />

      {/* Narasi (dua file, dibuat oleh tools/tts.py) */}
      <Sequence from={0} durationInFrames={PART2_START}>
        <Audio src={staticFile("voice_1.mp3")} />
      </Sequence>
      <Sequence from={PART2_START}>
        <Audio src={staticFile("voice_2.mp3")} />
      </Sequence>

      {/* Efek suara: taruh file di public/sfx/ lalu aktifkan, volume 0.1–0.5 (di bawah narasi), contoh:
      <Sequence from={sf(LS(3))} durationInFrames={90}><Audio src={staticFile("sfx/boom.mp3")} volume={0.4} /></Sequence> */}
    </AbsoluteFill>
  );
};
