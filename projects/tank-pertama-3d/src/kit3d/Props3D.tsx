import React from "react";
import * as THREE from "three";
import "@react-three/fiber";
import {PALETTE} from "../config";
import {INK, Part, toonGradient, usePaint} from "./toon";

type V3 = [number, number, number];

/** Tanah luas bertekstur cat lukis; memudar ke kabut di kejauhan. */
export const Ground: React.FC<{color?: string; seed?: string}> = ({color = "#8a6a45", seed = "ground"}) => {
  const tex = usePaint(seed, color, ["#6e5234", "#a3825a", "#5a4229", "#b79a6e"], 16, 160);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <circleGeometry args={[90, 40]} />
      <meshToonMaterial color="#ffffff" map={tex} gradientMap={toonGradient()} />
    </mesh>
  );
};

/** Tiang kayu dengan kawat berduri (tiga duri runcing di ujung). */
export const Post: React.FC<{position?: V3; rotY?: number; scale?: number; lean?: number}> = ({position = [0, 0, 0], rotY = 0, scale = 1, lean = 0}) => (
  <group position={position} rotation={[0, rotY, lean]} scale={scale}>
    <Part color={PALETTE.brown} position={[0, 1.5, 0]} outline={1.1}>
      <cylinderGeometry args={[0.3, 0.38, 3, 12]} />
    </Part>
    {[-0.22, 0, 0.22].map((x, i) => (
      <Part key={i} color="#d9c98a" position={[x, 3.5 + (i === 1 ? 0.25 : 0), 0]} rotation={[0, 0, x * -1.2]} outline={1.12}>
        <coneGeometry args={[0.12, 1.0 + (i === 1 ? 0.3 : 0), 6]} />
      </Part>
    ))}
  </group>
);

/** Deretan karung pasir (bola gepeng) sepanjang sumbu x. */
export const Sandbags: React.FC<{position?: V3; count?: number; rotY?: number}> = ({position = [0, 0, 0], count = 8, rotY = 0}) => (
  <group position={position} rotation={[0, rotY, 0]}>
    {Array.from({length: count}, (_, i) => (
      <Part key={i} color={i % 2 ? "#d9c9a3" : "#cdbb92"} position={[i * 1.05, 0.28 + (i % 3 === 1 ? 0.04 : 0), 0]} scale={[0.62, 0.34, 0.42]} outline={1.1}>
        <sphereGeometry args={[1, 14, 10]} />
      </Part>
    ))}
  </group>
);

/** Parit: lubang gelap + dinding papan kayu + karung pasir di bibirnya. */
export const Trench: React.FC<{position?: V3; length?: number}> = ({position = [0, 0, 0], length = 14}) => (
  <group position={position}>
    <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[length, 2.6]} />
      <meshBasicMaterial color="#1c120b" />
    </mesh>
    {Array.from({length: Math.round(length / 0.6)}, (_, i) => (
      <Part key={i} color={i % 2 ? "#8a6a45" : "#7a5c3a"} position={[-length / 2 + 0.3 + i * 0.6, 0.35, 1.35]} outline={1.12}>
        <boxGeometry args={[0.52, 0.7, 0.08]} />
      </Part>
    ))}
    <Sandbags position={[-length / 2 + 0.5, 0, 1.75]} count={Math.round(length / 1.05) - 1} />
    <Sandbags position={[-length / 2 + 0.5, 0, -1.75]} count={Math.round(length / 1.05) - 1} />
  </group>
);

/** Termometer besar (untuk menunjukkan suhu). `level` 0..1 = tinggi cairan merah. */
export const Thermometer: React.FC<{position?: V3; level?: number; scale?: number}> = ({position = [0, 0, 0], level = 0.8, scale = 1}) => {
  const h = 3.2;
  return (
    <group position={position} scale={scale}>
      <Part color="#f4efe4" position={[0, h / 2 + 0.3, 0]} outline={1.12}>
        <capsuleGeometry args={[0.2, h - 0.4, 6, 12]} />
      </Part>
      <Part color="#d63a2b" position={[0, 0.3, 0]} outline={1.1}>
        <sphereGeometry args={[0.4, 16, 12]} />
      </Part>
      <Part color="#d63a2b" position={[0, 0.3 + (h * level) / 2, 0.04]} outline={0}>
        <cylinderGeometry args={[0.1, 0.1, h * level, 10]} />
      </Part>
    </group>
  );
};

/**
 * Ruang potongan (diorama cutaway): lantai, dinding belakang dan kiri dengan paku keling,
 * lampu gantung, kotak P3K. Pusat lantai di (0,0,0); dinding belakang di z=-2.6.
 */
export const Room3D: React.FC<{width?: number; depth?: number; height?: number}> = ({width = 7.5, depth = 5.2, height = 3.6}) => {
  const wall = usePaint("room-wall", "#cdb98a", ["#b7a273", "#dccb9e", "#a48d5e"], 1.4, 60);
  const floor = usePaint("room-floor", "#6f5a41", ["#5a4630", "#83694a", "#4b3a28"], 2.2, 60);
  const rivets: V3[] = [];
  for (let x = -width / 2 + 0.5; x < width / 2; x += 0.9) for (const y of [0.4, height - 0.4]) rivets.push([x, y, -depth / 2 + 0.13]);
  return (
    <group>
      <Part color="#ffffff" map={floor} position={[0, -0.15, 0]} outline={1.02}>
        <boxGeometry args={[width, 0.3, depth]} />
      </Part>
      <Part color="#ffffff" map={wall} position={[0, height / 2, -depth / 2]} outline={1.015}>
        <boxGeometry args={[width, height, 0.25]} />
      </Part>
      <Part color="#ffffff" map={wall} position={[-width / 2, height / 2, 0]} outline={1.015}>
        <boxGeometry args={[0.25, height, depth]} />
      </Part>
      {rivets.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshToonMaterial color="#7a6a48" gradientMap={toonGradient()} />
        </mesh>
      ))}
      {/* lampu gantung */}
      <mesh position={[0.6, height - 0.45, -depth / 2 + 1.1]}>
        <cylinderGeometry args={[0.015, 0.015, 0.9, 6]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      <Part color="#ffe9a8" position={[0.6, height - 1.05, -depth / 2 + 1.1]} outline={1.1}>
        <sphereGeometry args={[0.28, 14, 10]} />
      </Part>
      <pointLight position={[0.6, height - 1.1, -depth / 2 + 1.1]} color="#ffd28a" intensity={9} distance={9} decay={1.6} />
      {/* kotak P3K */}
      <Part color="#f1ece0" position={[-width / 2 + 0.35, 2.3, -0.8]} outline={1.1}>
        <boxGeometry args={[0.18, 0.55, 0.55]} />
      </Part>
      <mesh position={[-width / 2 + 0.46, 2.3, -0.8]}>
        <planeGeometry args={[0.02, 0.3]} />
        <meshBasicMaterial color="#c8352b" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
