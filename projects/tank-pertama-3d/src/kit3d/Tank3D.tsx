import React, {useMemo} from "react";
import * as THREE from "three";
import "@react-three/fiber";
import {Blob, INK, Part, Smoke, toonGradient, usePaint} from "./toon";
import {loopLength, platesOnLoop, roundedLoop} from "./math";

type V3 = [number, number, number];

// Profil samping tank Mark I (belah ketupat): x = maju, y = naik. Trek mengelilingi badan.
const LOOP = roundedLoop(
  [
    {x: -2.9, y: 0},
    {x: 2.9, y: 0},
    {x: 1.5, y: 2.5},
    {x: -1.7, y: 2.5},
  ],
  0.45,
  6
);
const LOOP_LEN = loopLength(LOOP);
const PLATES = Math.round(LOOP_LEN / 0.4);

const HULL: [number, number][] = [
  [-2.35, 0.5],
  [2.35, 0.5],
  [1.25, 2.05],
  [-1.35, 2.05],
];

const makeHull = (grow: number, depth: number) => {
  const cx = HULL.reduce((s, p) => s + p[0], 0) / HULL.length;
  const cy = HULL.reduce((s, p) => s + p[1], 0) / HULL.length;
  const sh = new THREE.Shape();
  HULL.forEach(([x, y], i) => {
    const px = cx + (x - cx) * grow;
    const py = cy + (y - cy) * grow;
    if (i === 0) sh.moveTo(px, py);
    else sh.lineTo(px, py);
  });
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, {depth, bevelEnabled: false});
  g.translate(0, 0, -depth / 2);
  return g;
};

/**
 * Tank Mark I 3D (badan belah ketupat, trek berputar, sponson, kupola, asap knalpot).
 * Menghadap +x. `distance` = jarak tempuh (unit dunia) → trek berputar sesuai laju.
 * `rolling=false` menghentikan trek dan asap.
 */
export const Tank3D: React.FC<{
  frame: number;
  position?: V3;
  rotY?: number;
  scale?: number;
  distance?: number;
  tilt?: number; // kemiringan (radian) pada sumbu z, mis. saat memanjat parit
  smoke?: boolean;
  seed?: string;
}> = ({frame, position = [0, 0, 0], rotY = 0, scale = 1, distance = 0, tilt = 0, smoke = true, seed = "tank"}) => {
  const hull = useMemo(() => makeHull(1, 1.5), []);
  const hullOutline = useMemo(() => makeHull(1.045, 1.66), []);
  const paintHull = usePaint(`${seed}-hull`, "#6f7547", ["#566036", "#8a8f5a", "#7b5a36", "#a79d6a"], 0.34, 90);
  const paintBox = usePaint(`${seed}-box`, "#707748", ["#566036", "#8a8f5a", "#7b5a36"], 1, 40);

  const plates = platesOnLoop(LOOP, PLATES, -distance / LOOP_LEN);
  const zs = [-1.1, 1.1];

  return (
    <group position={position} rotation={[0, rotY, tilt]} scale={scale}>
      <Blob size={[8, 4.2]} position={[0, 0.03, 0]} opacity={0.45} />
      {/* badan */}
      <mesh geometry={hullOutline}>
        <meshBasicMaterial color={INK} side={THREE.BackSide} />
      </mesh>
      <mesh geometry={hull}>
        <meshToonMaterial color="#ffffff" map={paintHull} gradientMap={toonGradient()} />
      </mesh>
      {/* trek: pelat bergerak mengelilingi badan */}
      {zs.map((z) =>
        plates.map((p, i) => (
          <mesh key={`${z}-${i}`} position={[p.x, p.y, z]} rotation={[0, 0, p.rot]}>
            <boxGeometry args={[0.38, 0.13, 0.62]} />
            <meshToonMaterial color={i % 2 ? "#3a2f27" : "#51443a"} gradientMap={toonGradient()} />
          </mesh>
        ))
      )}
      {/* kupola komandan + celah intip */}
      <Part color="#707748" map={paintBox} position={[0.0, 2.45, 0]} outline={1.07}>
        <boxGeometry args={[1.5, 0.6, 1.15]} />
      </Part>
      <mesh position={[0.78, 2.5, 0.2]}>
        <boxGeometry args={[0.03, 0.1, 0.35]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      <mesh position={[0.78, 2.5, -0.2]}>
        <boxGeometry args={[0.03, 0.1, 0.35]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      {/* sponson dan meriam di kedua sisi */}
      {zs.map((z) => (
        <group key={`sp${z}`}>
          <Part color="#707748" map={paintBox} position={[0.3, 1.15, z * 0.98]} outline={1.07}>
            <boxGeometry args={[1.7, 1.0, 0.5]} />
          </Part>
          <Part color="#3b3f2a" position={[1.45, 1.2, z * 1.12]} rotation={[0, 0, Math.PI / 2]} outline={1.12}>
            <cylinderGeometry args={[0.1, 0.12, 1.1, 10]} />
          </Part>
        </group>
      ))}
      {/* knalpot + asap */}
      <Part color="#3b3f2a" position={[-1.5, 2.65, 0.3]} outline={1.12}>
        <cylinderGeometry args={[0.14, 0.17, 0.5, 10]} />
      </Part>
      {smoke && <Smoke frame={frame} origin={[-1.5, 2.9, 0.3]} count={12} color="#3a322c" rise={2.6} spread={0.9} size={1.0} wind={-1.4} seed={`${seed}-sm`} />}
    </group>
  );
};
