import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {LE, LS, PALETTE} from "./config";
import {Bullets, Burst, Ground, Puffs, Steel, Tag, Tank, Thermo, clampI, fadeIn} from "./art";
import {Camera} from "./kit/Camera";
import {Character} from "./kit/Character";
import {useScene, useT} from "./kit/Scene";

/**
 * ISI CERITA — "Kenapa tank pertama berbentuk belah ketupat?"
 * Tiap scene menunjuk rentang kalimat [dari, sampai] (indeks 0 = baris pertama
 * di tools/script_lines.txt). Semua efek memakai LS(i)/LE(i), bukan detik mutlak.
 */
export type SceneDef = {lines: [number, number]; el: React.ReactNode; fade?: number};

const Abs: React.FC<{left: number; top: number; children: React.ReactNode}> = ({left, top, children}) => (
  <div style={{position: "absolute", left, top}}>{children}</div>
);

/* 0–1  Hook: tank belah ketupat melintas, kamera mendekat */
const SceneHook: React.FC = () => {
  const t = useT();
  const x = interpolate(t, [0, LE(1)], [40, 110], clampI);
  return (
    <Camera from={{zoom: 1}} to={{zoom: 1.2, y: -20}} shake={1}>
      <Ground horizon={1100} />
      <Abs left={x} top={700}>
        <Tank width={820} moving />
      </Abs>
      <Puffs x={x + 70} y={1060} n={7} />
    </Camera>
  );
};

/* 2–3  Parit lumpur + peluru */
const SceneTrench: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const mood = t < LS(3) ? "calm" : "shock";
  return (
    <Camera from={{x: 20, zoom: 1.05}} to={{x: -30, zoom: 1.15}} shake={2}>
      <Ground horizon={880} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: "absolute", left: 0, top: 0}}>
        <rect x={120} y={880} width={840} height={520} fill="#4a3522" stroke={PALETTE.ink} strokeWidth={9} />
        {Array.from({length: 9}, (_, i) => (
          <line key={i} x1={120 + i * 105} y1={880} x2={120 + i * 105} y2={1400} stroke="#35261a" strokeWidth={6} />
        ))}
        <rect x={120} y={1340} width={840} height={60} fill="#6b5236" stroke={PALETTE.ink} strokeWidth={7} />
        {Array.from({length: 7}, (_, i) => (
          <ellipse key={i} cx={170 + i * 120} cy={872} rx={64} ry={26} fill="#b69a62" stroke={PALETTE.ink} strokeWidth={6} />
        ))}
      </svg>
      <Abs left={310} top={960}>
        <Character size={250} hat="helmet" hatColor={PALETTE.steel} outfit={PALETTE.steel} mood={mood} lookX={1} />
      </Abs>
      <Abs left={580} top={955}>
        <Character size={250} hat="cap" mood={mood} lookX={1} />
      </Abs>
      <Bullets y={730} band={110} />
    </Camera>
  );
};

/* 4  Sketsa rancangan di meja */
const SceneBlueprint: React.FC = () => {
  const t = useT();
  const p = interpolate(t, [LS(4), LE(4)], [0, 1], clampI);
  return (
    <Camera from={{zoom: 1.1, y: 10}} to={{zoom: 1, y: -10}}>
      <AbsoluteFill style={{background: `linear-gradient(${PALETTE.wall}, ${PALETTE.ochre})`}} />
      <Abs left={80} top={520}>
        <Character size={330} hat="officer" hatColor={PALETTE.khaki} mustache lookX={0.6} />
      </Abs>
      <Abs left={590} top={540}>
        <Character size={330} hat="cap" lookX={-0.6} />
      </Abs>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: "absolute", left: 0, top: 0}}>
        <rect x={0} y={980} width={1080} height={940} fill="#7a5632" stroke={PALETTE.ink} strokeWidth={9} />
        <g transform="rotate(-3 540 1230)">
          <rect x={170} y={1030} width={740} height={420} fill="#efe3c2" stroke={PALETTE.ink} strokeWidth={7} />
          <polygon
            points="260,1390 380,1130 700,1130 830,1390"
            fill="none"
            stroke="#2b4a7a"
            strokeWidth={9}
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - p}
          />
          <line x1={240} y1={1415} x2={850} y2={1415} stroke="#2b4a7a" strokeWidth={4} opacity={p} />
        </g>
      </svg>
    </Camera>
  );
};

/* 5–6  Memanjat gundukan, melintasi parit */
const SceneCross: React.FC = () => {
  const t = useT();
  const x = interpolate(t, [LS(5), LE(6)], [-820, 1100], clampI);
  const frontX = x + 700;
  const pitch = interpolate(frontX, [380, 560, 700, 780, 900], [0, 5, -2, -10, 0], clampI);
  const hi = t >= LS(5) && t < LE(5);
  const label = fadeIn(t, LS(6), 0.5);
  return (
    <Camera from={{zoom: 1}} to={{zoom: 1.08}}>
      <Ground horizon={1100} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: "absolute", left: 0, top: 0}}>
        <rect x={400} y={1100} width={300} height={420} fill="#2a1d14" stroke={PALETTE.ink} strokeWidth={9} />
        {Array.from({length: 5}, (_, i) => (
          <line key={i} x1={400} y1={1180 + i * 80} x2={700} y2={1180 + i * 80} stroke="#3f2d1f" strokeWidth={5} />
        ))}
        <g opacity={label}>
          <line x1={400} y1={1330} x2={700} y2={1330} stroke="#ffbf5e" strokeWidth={8} strokeLinecap="round" />
          <polygon points="400,1330 430,1314 430,1346" fill="#ffbf5e" />
          <polygon points="700,1330 670,1314 670,1346" fill="#ffbf5e" />
        </g>
      </svg>
      <Tag text="2+ meter" x={550} y={1360} size={72} color="#ffbf5e" opacity={label} />
      <div style={{position: "absolute", left: x, top: 705, transform: `rotate(${pitch}deg)`, transformOrigin: "50% 90%"}}>
        <Tank width={760} moving hiFront={hi} />
      </div>
    </Camera>
  );
};

/* 7–8  Potongan interior: delapan awak berdesakan */
const SceneCutaway: React.FC = () => {
  const t = useT();
  const crew: {l: number; top: number; s: number; hat: "cap" | "officer" | "helmet"; c: string; o: string; m?: boolean}[] = [
    {l: 150, top: 690, s: 200, hat: "helmet", c: PALETTE.steel, o: PALETTE.steel},
    {l: 360, top: 700, s: 200, hat: "cap", c: PALETTE.brown, o: PALETTE.khaki},
    {l: 580, top: 690, s: 200, hat: "cap", c: PALETTE.brown, o: PALETTE.khaki},
    {l: 790, top: 700, s: 200, hat: "helmet", c: PALETTE.steel, o: PALETTE.steel},
    {l: 90, top: 930, s: 240, hat: "cap", c: PALETTE.brown, o: PALETTE.khaki},
    {l: 330, top: 940, s: 240, hat: "officer", c: PALETTE.khaki, o: PALETTE.khaki, m: true},
    {l: 560, top: 930, s: 240, hat: "helmet", c: PALETTE.steel, o: PALETTE.steel},
    {l: 780, top: 940, s: 240, hat: "cap", c: PALETTE.brown, o: PALETTE.khaki},
  ];
  const mood = t < LS(8) ? "shock" : "calm";
  return (
    <Camera from={{zoom: 1}} to={{zoom: 1.12}} shake={2}>
      <Steel />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: "absolute", left: 0, top: 0}}>
        <rect x={340} y={760} width={400} height={470} rx={26} fill="#59636b" stroke={PALETTE.ink} strokeWidth={9} />
        {Array.from({length: 6}, (_, i) => (
          <line key={i} x1={365} y1={800 + i * 62} x2={715} y2={800 + i * 62} stroke="#3b444a" strokeWidth={8} />
        ))}
        <rect x={500} y={690} width={80} height={80} rx={10} fill="#3b444a" stroke={PALETTE.ink} strokeWidth={7} />
      </svg>
      {crew.map((c, i) => (
        <Abs key={i} left={c.l} top={c.top}>
          <Character size={c.s} hat={c.hat} hatColor={c.c} outfit={c.o} mustache={c.m} mood={mood} lookX={i % 2 ? 0.6 : -0.6} />
        </Abs>
      ))}
      <Tag text="8 AWAK" y={380} size={110} color="#ffbf5e" opacity={fadeIn(t, LS(8), 0.3)} />
    </Camera>
  );
};

/* 9–10  Bising + suhu naik */
const SceneHeat: React.FC = () => {
  const t = useT();
  const f = useCurrentFrame();
  const level = interpolate(t, [LS(10), LE(10)], [0.1, 1], clampI);
  const heat = interpolate(t, [LS(10), LE(10)], [0, 0.35], clampI);
  const loud = t < LS(10);
  return (
    <Camera from={{zoom: 1}} to={{zoom: 1.1}} shake={loud ? 4 : 2}>
      <Steel />
      <Abs left={40} top={560}>
        <Character size={560} hat="helmet" hatColor={PALETTE.steel} outfit={PALETTE.steel} mood={loud ? "angry" : "shock"} armsUp={loud} />
      </Abs>
      <Abs left={780} top={540}>
        <Thermo level={loud ? 0.1 : level} />
      </Abs>
      {loud ? (
        <Tag text="BRRRRRR!" y={380} size={120} color={PALETTE.fire} scale={1 + Math.sin(f / 2) * 0.04} />
      ) : (
        <Tag text={`${Math.round(level * 50)}°C`} x={800} y={400} size={110} color="#ff7a5c" />
      )}
      <AbsoluteFill style={{background: `rgba(255,90,20,${heat})`, mixBlendMode: "multiply", pointerEvents: "none"}} />
    </Camera>
  );
};

/* 11  Asap knalpot */
const SceneFumes: React.FC = () => {
  const f = useCurrentFrame();
  const {dur} = useScene();
  const k = interpolate(f, [0, dur], [0.3, 1], clampI);
  return (
    <Camera from={{zoom: 1, rot: -3}} to={{zoom: 1.12, rot: 3}}>
      <Steel />
      <Abs left={240} top={460}>
        <Character size={600} hat="helmet" hatColor={PALETTE.steel} outfit={PALETTE.steel} mood="shock" lookX={Math.sin(f / 6)} />
      </Abs>
      <Puffs x={540} y={1500} n={16} spread={420} size={1.6} strength={k} color="#7f827a" />
    </Camera>
  );
};

/* 12–14  Maju ke medan perang */
const SceneBattle: React.FC = () => {
  const t = useT();
  const x = interpolate(t, [LS(12), LE(14)], [-700, 220], clampI);
  const label = fadeIn(t, LS(12), 0.4) * (1 - fadeIn(t, LE(12) + 0.6, 0.5));
  const smoke = fadeIn(t, LS(13), 0.8);
  const run = Math.max(0, t - LS(14));
  const mood = t < LS(14) ? "calm" : "shock";
  const enemy = (base: number, i: number) => (
    <Abs left={base + run * (260 + i * 40)} top={770 - Math.abs(Math.sin(run * 7 + i)) * (run > 0 ? 22 : 0)}>
      <Character size={200} hat="helmet" hatColor="#5e6554" outfit="#7c8274" mood={mood} lookX={run > 0 ? 1 : -1} armsUp={run > 0} idle={run === 0} />
    </Abs>
  );
  return (
    <Camera from={{zoom: 1}} to={{zoom: 1.1}} shake={2}>
      <Ground horizon={1080} />
      <Abs left={20} top={800}>
        <Tank width={380} />
      </Abs>
      <Puffs x={210} y={840} n={8} spread={50} strength={smoke} color="#5d5b57" />
      <Abs left={x} top={705}>
        <Tank width={700} moving />
      </Abs>
      {enemy(640, 0)}
      {enemy(760, 1)}
      {enemy(520, 2)}
      <Burst x={720} y={960} at={LS(12) + 1.0} />
      <Burst x={420} y={900} at={LS(12) + 2.4} size={180} />
      <Burst x={820} y={880} at={LS(14) + 0.3} size={240} />
      <Tag text="15 SEPTEMBER 1916" y={290} size={72} color="#ffbf5e" opacity={label} />
    </Camera>
  );
};

/* 15–16  Penutup: tank di bawah sorotan, pertanyaan */
const SceneEnd: React.FC = () => {
  const t = useT();
  const f = useCurrentFrame();
  const q = fadeIn(t, LS(16), 0.5);
  return (
    <Camera from={{zoom: 1.25}} to={{zoom: 1}}>
      <Ground horizon={1150} />
      <AbsoluteFill style={{background: "radial-gradient(ellipse at 50% 55%, rgba(255,226,160,.55) 0%, rgba(255,226,160,0) 60%)"}} />
      <Abs left={90} top={740}>
        <Tank width={900} />
      </Abs>
      <Abs left={70} top={1010}>
        <Character size={200} hat="cap" lookX={1} mood="shock" />
      </Abs>
      <Abs left={790} top={1010}>
        <Character size={200} hat="helmet" hatColor={PALETTE.steel} outfit={PALETTE.steel} lookX={-1} />
      </Abs>
      <Tag text="?" y={330} size={360} color="#ffbf5e" opacity={q} scale={1 + Math.sin(f / 5) * 0.05} />
    </Camera>
  );
};

export const SCENES: SceneDef[] = [
  {lines: [0, 1], el: <SceneHook />},
  {lines: [2, 3], el: <SceneTrench />},
  {lines: [4, 4], el: <SceneBlueprint />},
  {lines: [5, 6], el: <SceneCross />},
  {lines: [7, 8], el: <SceneCutaway />},
  {lines: [9, 10], el: <SceneHeat />},
  {lines: [11, 11], el: <SceneFumes />},
  {lines: [12, 14], el: <SceneBattle />},
  {lines: [15, 16], el: <SceneEnd />},
];
