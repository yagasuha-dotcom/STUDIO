import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {FPS, LS} from "./config";
import {Character3D} from "./kit3d/Character3D";
import {Ground, Post, Room3D, Sandbags, Thermometer, Trench} from "./kit3d/Props3D";
import {Backdrop, SKY_DAY, SKY_DUSK, SKY_INDOOR, Sky, Stage3D} from "./kit3d/Stage";
import {Tank3D} from "./kit3d/Tank3D";
import {Smoke} from "./kit3d/toon";
import {Cam, ease, mixCam} from "./kit3d/math";
import {useScene} from "./kit/Scene";

/**
 * ISI CERITA — satu-satunya file yang diubah per video.
 * Tiap scene menunjuk rentang kalimat narasi [dari, sampai] (indeks mulai 0, sesuai urutan
 * baris di tools/script_lines.txt). Rentang HARUS berurutan, tanpa celah, dan scene terakhir
 * berakhir di kalimat terakhir. Pakai LS(i)/LE(i) untuk sinkron, jangan detik mutlak.
 */
export type SceneDef = {lines: [number, number]; el: React.ReactNode; fade?: number};

type Tick = {fa: number; t: number; lf: number; k: number}; // frame absolut, detik absolut, frame lokal, progres 0..1

/**
 * Satu bidikan: langit 2.5D + panggung 3D + gerak kamera dari `from` ke `to` selama scene.
 * Cam: z>0 mendekat, yaw memutar, pitch menunduk, y/x menggeser. Fokus adegan di sekitar (0,0,0).
 */
const Shot: React.FC<{
  from?: Partial<Cam>;
  to?: Partial<Cam>;
  sky?: Sky;
  fogRange?: [number, number];
  shake?: number;
  children: (s: Tick) => React.ReactNode;
}> = ({from = {}, to, sky = SKY_DAY, fogRange = [16, 70], shake = 0, children}) => {
  const lf = useCurrentFrame();
  const {from: start, dur} = useScene();
  const k = ease(lf / dur);
  const c = mixCam(from, to ?? from, k);
  const cam = {...c, x: c.x + (shake ? Math.sin(lf * 0.9) * shake : 0), y: c.y + (shake ? Math.cos(lf * 1.3) * shake : 0)};
  const fa = lf + start;
  return (
    <AbsoluteFill>
      <Backdrop sky={sky} yaw={cam.yaw} />
      <Stage3D cam={cam} fog={sky.fog} fogRange={fogRange}>
        {children({fa, t: fa / FPS, lf, k})}
      </Stage3D>
    </AbsoluteFill>
  );
};

const SPEED = 0.06; // laju tank (unit dunia per frame)

/* 0 — close-up: suhu di dalam tank */
const Hook: React.FC = () => (
  <Shot sky={SKY_INDOOR} fogRange={[18, 60]} from={{y: -1.5, z: 3.5, yaw: -0.3, pitch: 0.05}} to={{y: -1.7, z: 5.5, yaw: 0.12}} shake={0.01}>
    {({fa, t}) => (
      <>
        <Room3D />
        <Character3D frame={fa} position={[0.4, 0, 0.2]} hat="officer" hatColor="#b9a35a" mustache mood={t < LS(0) + 2.2 ? "calm" : "shock"} />
        <Thermometer position={[-2.0, 0, 0.6]} level={Math.min(0.95, 0.3 + (t - LS(0)) * 0.16)} />
      </>
    )}
  </Shot>
);

/* 1 — diorama potongan: delapan orang di dalam */
const Cutaway: React.FC = () => (
  <Shot sky={SKY_INDOOR} fogRange={[18, 60]} from={{y: -1.2, z: -3, yaw: -0.5, pitch: 0.42}} to={{y: -1.2, z: -1, yaw: 0.2, pitch: 0.36}}>
    {({fa}) => (
      <>
        <Room3D />
        <Character3D frame={fa} position={[-1.8, 0, -1.2]} hat="officer" hatColor="#b9a35a" mustache sit hold />
        <Character3D frame={fa + 20} position={[0.2, 0, -1.2]} hat="cap" sit hold />
        <Character3D frame={fa + 40} position={[2.1, 0, -0.6]} hat="helmet" hatColor="#6f8faf" outfit="#6f8faf" sit />
        <Character3D frame={fa + 60} position={[-1.2, 0, 0.9]} hat="cap" outfit="#8a5a2b" sit mood="angry" />
        <Character3D frame={fa + 80} position={[1.0, 0, 1.0]} hat="helmet" hatColor="#6f8faf" outfit="#b9a35a" sit />
        <Smoke frame={fa} origin={[-0.5, 2.6, -1.5]} count={8} color="#5a4a3c" rise={1.6} spread={2.4} size={1.6} wind={0.4} opacity={0.3} seed="room" />
      </>
    )}
  </Shot>
);

/* 2 — tank muncul dari kabut */
const Reveal: React.FC = () => (
  <Shot from={{y: -1.6, z: -4, yaw: 0.5, pitch: 0.1}} to={{y: -1.6, z: -1, yaw: 0.12, pitch: 0.08}} fogRange={[14, 55]}>
    {({fa, lf}) => (
      <>
        <Ground />
        <Tank3D frame={fa} position={[-5 + lf * SPEED, 0, 0]} distance={lf * SPEED} />
        <Post position={[3.5, 0, 3]} lean={0.05} />
        <Post position={[-7, 0, -4]} rotY={0.4} scale={0.9} lean={-0.04} />
      </>
    )}
  </Shot>
);

/* 3–4 — parit dan jalan buntu */
const Stalemate: React.FC = () => (
  <Shot sky={SKY_DUSK} from={{y: -1.4, z: -3, yaw: -0.35, pitch: 0.12}} to={{y: -1.4, z: -1, yaw: 0.25, pitch: 0.1}} fogRange={[14, 52]}>
    {({fa}) => (
      <>
        <Ground color="#7c5f3d" seed="trench-ground" />
        <Trench position={[0, 0, 0]} length={15} />
        <Character3D frame={fa} position={[-2.5, 0, -2.3]} hat="helmet" hatColor="#6f8faf" outfit="#6f8faf" mood="calm" scale={0.9} />
        <Character3D frame={fa + 30} position={[1.5, 0, -2.3]} hat="helmet" hatColor="#6f8faf" mood="shock" scale={0.9} />
        <Post position={[5, 0, 3]} lean={0.06} />
        <Post position={[-6, 0, 4]} lean={-0.05} scale={1.1} />
        <Smoke frame={fa} origin={[6, 0, -6]} count={9} color="#4a4038" rise={5} spread={3} size={3} wind={1} opacity={0.4} seed="far1" />
      </>
    )}
  </Shot>
);

/* 5–7 — senjata rahasia, disamarkan sebagai "tangki air" */
const Secret: React.FC = () => (
  <Shot sky={SKY_DUSK} from={{y: -1.3, z: -1, yaw: 0.9, pitch: -0.05}} to={{y: -1.3, z: 1, yaw: 0.5, pitch: 0}} fogRange={[12, 48]}>
    {({fa}) => (
      <>
        <Ground color="#7c5f3d" seed="secret-ground" />
        <Tank3D frame={fa} position={[0, 0, 0]} smoke seed="secret" />
        <Post position={[-3, 0, 4]} lean={0.05} />
      </>
    )}
  </Shot>
);

/* 8–9 — bentuk belah ketupat: kamera memutar ke profil samping */
const Shape: React.FC = () => (
  <Shot from={{y: -1.7, z: -3, yaw: 0.95, pitch: 0.12}} to={{y: -1.7, z: -1.5, yaw: 0.05, pitch: 0.06}} fogRange={[14, 55]}>
    {({fa}) => (
      <>
        <Ground />
        <Tank3D frame={fa} position={[0, 0, 0]} smoke={false} seed="shape" />
      </>
    )}
  </Shot>
);

/* 10 — melaju pelan, enam kilometer per jam */
const Slow: React.FC = () => (
  <Shot from={{y: -1.3, z: 1, yaw: 0.3, pitch: 0.06}} to={{y: -1.3, z: -1, yaw: -0.3, pitch: 0.06}} fogRange={[14, 55]}>
    {({fa, lf}) => (
      <>
        <Ground />
        <Tank3D frame={fa} position={[-4 + lf * SPEED, 0, 0]} distance={lf * SPEED} />
        <Sandbags position={[2, 0, -3]} count={6} />
        <Post position={[4, 0, 3]} />
      </>
    )}
  </Shot>
);

/* 11–12 — di dalam: tanpa radio, isyarat tangan, panas dan bising */
const Signals: React.FC = () => (
  <Shot sky={SKY_INDOOR} fogRange={[18, 60]} from={{y: -1.4, z: -1, yaw: 0.35, pitch: 0.3}} to={{y: -1.5, z: 2, yaw: -0.25, pitch: 0.12}} shake={0.015}>
    {({fa}) => (
      <>
        <Room3D />
        <Character3D frame={fa} position={[-1.5, 0, -1.0]} hat="officer" hatColor="#b9a35a" mustache sit armsUp mood="angry" />
        <Character3D frame={fa + 25} position={[0.9, 0, -1.0]} hat="cap" sit hold mood="shock" />
        <Character3D frame={fa + 50} position={[2.3, 0, 0.4]} hat="helmet" hatColor="#6f8faf" outfit="#6f8faf" sit />
        <Smoke frame={fa} origin={[-1.0, 2.2, -1.8]} count={10} color="#3a322c" rise={1.8} spread={3} size={1.8} wind={0.5} opacity={0.35} seed="room2" />
      </>
    )}
  </Shot>
);

/* 13 — awak pingsan */
const Faint: React.FC = () => (
  <Shot sky={SKY_INDOOR} fogRange={[18, 60]} from={{y: -1.6, z: 4, yaw: 0, pitch: 0.1}} to={{y: -1.9, z: 6, yaw: 0.15, pitch: 0.18}} shake={0.02}>
    {({fa}) => (
      <>
        <Room3D />
        <Character3D frame={fa} position={[0, 0, 0.2]} hat="cap" mood="shock" rotY={Math.sin(fa / 18) * 0.18} />
      </>
    )}
  </Shot>
);

/* 14–17 — hari debut: iring-iringan tank menuju kamera */
const Convoy: React.FC = () => (
  <Shot sky={SKY_DUSK} from={{y: -1.2, z: -5, yaw: 0.1, pitch: 0.05}} to={{y: -1.4, z: -3, yaw: -0.15, pitch: 0.08}} fogRange={[16, 70]} shake={0.01}>
    {({fa, lf}) => (
      <>
        <Ground color="#7c5f3d" seed="convoy-ground" />
        {[0, 1, 2].map((i) => (
          <Tank3D key={i} frame={fa + i * 17} position={[(i - 1) * 6, 0, -30 + lf * SPEED * 1.4 + i * 4]} rotY={-Math.PI / 2} distance={lf * SPEED * 1.4} seed={`convoy${i}`} />
        ))}
        <Smoke frame={fa} origin={[-10, 0, -18]} count={10} color="#3a322c" rise={7} spread={4} size={4} wind={1.5} opacity={0.45} seed="b1" />
        <Smoke frame={fa + 9} origin={[11, 0, -26]} count={10} color="#4a4038" rise={7} spread={4} size={4} wind={-1.5} opacity={0.4} seed="b2" />
      </>
    )}
  </Shot>
);

/* 18–20 — melintasi parit, kamera menjauh */
const Crossing: React.FC = () => (
  <Shot from={{y: -1.3, z: -3, yaw: -0.35, pitch: 0.1}} to={{y: -1.5, z: -7, yaw: 0.2, pitch: 0.14}} fogRange={[16, 70]}>
    {({fa, lf, k}) => (
      <>
        <Ground />
        <Trench position={[0, 0, 0]} length={9} />
        <Tank3D frame={fa} position={[-8 + lf * SPEED * 1.3, 0.1 + Math.max(0, Math.sin(k * 3.1)) * 0.5, 0]} distance={lf * SPEED * 1.3} tilt={Math.sin(k * 6.2) * 0.1} />
        <Post position={[5, 0, 3]} lean={0.05} />
      </>
    )}
  </Shot>
);

/* 21 — penutup: pertanyaan untuk penonton */
const Outro: React.FC = () => (
  <Shot sky={SKY_INDOOR} fogRange={[18, 60]} from={{y: -1.5, z: 2, yaw: -0.15, pitch: 0.04}} to={{y: -1.6, z: 4.5, yaw: 0, pitch: 0.06}}>
    {({fa}) => (
      <>
        <Room3D />
        <Character3D frame={fa} position={[0, 0, 0.3]} hat="officer" hatColor="#b9a35a" mustache mood="calm" />
      </>
    )}
  </Shot>
);

export const SCENES: SceneDef[] = [
  {lines: [0, 0], el: <Hook />},
  {lines: [1, 1], el: <Cutaway />},
  {lines: [2, 2], el: <Reveal />},
  {lines: [3, 4], el: <Stalemate />},
  {lines: [5, 7], el: <Secret />},
  {lines: [8, 9], el: <Shape />},
  {lines: [10, 10], el: <Slow />},
  {lines: [11, 12], el: <Signals />},
  {lines: [13, 13], el: <Faint />},
  {lines: [14, 17], el: <Convoy />},
  {lines: [18, 20], el: <Crossing />},
  {lines: [21, 21], el: <Outro />},
];
