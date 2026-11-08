import React from "react";
import * as THREE from "three";
import "@react-three/fiber";
import {PALETTE} from "../config";
import {Blob, INK, Part} from "./toon";

export type Mood = "calm" | "angry" | "shock" | "smile";
export type Hat = "none" | "cap" | "officer" | "helmet";
type V3 = [number, number, number];

/** Batang tipis (lengan/kaki) dari titik a ke titik b. */
const Limb: React.FC<{a: V3; b: V3; r?: number; color?: string}> = ({a, b, r = 0.085, color = INK}) => {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  return (
    <Part color={color} position={[mid.x, mid.y, mid.z]} rotation={[e.x, e.y, e.z]} outline={0}>
      <cylinderGeometry args={[r, r, len, 8]} />
    </Part>
  );
};

const Eye: React.FC<{side: 1 | -1; mood: Mood; lookX: number; blink: boolean}> = ({side, mood, lookX, blink}) => {
  const z = 0.9;
  const px = lookX * 0.07;
  return (
    <group position={[side * 0.37, 0.1, z]} rotation={[0, side * 0.38, 0]}>
      {mood === "shock" ? (
        <>
          <mesh position={[0, 0, -0.01]}>
            <circleGeometry args={[0.2, 20]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh>
            <ringGeometry args={[0.17, 0.23, 24]} />
            <meshBasicMaterial color={INK} />
          </mesh>
          <mesh position={[px, 0, 0.01]}>
            <circleGeometry args={[0.07, 12]} />
            <meshBasicMaterial color={INK} />
          </mesh>
        </>
      ) : mood === "smile" || blink ? (
        <mesh position={[0, -0.04, 0]} rotation={[0, 0, mood === "smile" ? 0 : Math.PI]}>
          <torusGeometry args={[0.15, 0.035, 8, 16, Math.PI]} />
          <meshBasicMaterial color={INK} />
        </mesh>
      ) : (
        <>
          <mesh position={[px, -0.03, 0]}>
            <circleGeometry args={[0.1, 16]} />
            <meshBasicMaterial color={INK} />
          </mesh>
          {/* kelopak berat: garis tebal di atas mata (ekspresi datar khas gaya referensi) */}
          <mesh position={[0, 0.06, 0.01]} rotation={[0, 0, mood === "angry" ? side * 0.4 : -side * 0.06]}>
            <planeGeometry args={[0.46, 0.08]} />
            <meshBasicMaterial color={INK} />
          </mesh>
        </>
      )}
    </group>
  );
};

const HatEl: React.FC<{hat: Hat; color: string}> = ({hat, color}) => {
  if (hat === "none") return null;
  if (hat === "cap")
    return (
      <group position={[0, 0.1, 0]}>
        <Part color={color} outline={1.05}>
          <sphereGeometry args={[1.0, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
        </Part>
        <Part color={color} position={[0, 0.27, 0]} outline={1.08}>
          <cylinderGeometry args={[1.08, 1.08, 0.08, 28]} />
        </Part>
      </group>
    );
  if (hat === "officer")
    return (
      <group position={[0, 0.12, 0]}>
        <Part color={color} outline={1.05} position={[0, 0.02, 0]}>
          <sphereGeometry args={[1.02, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.36]} />
        </Part>
        <Part color={PALETTE.brown} position={[0, 0.33, 0]} outline={1.06}>
          <cylinderGeometry args={[1.0, 1.0, 0.14, 28]} />
        </Part>
        <Part color={color} position={[0, 0.4, 0.15]} outline={1.06}>
          <cylinderGeometry args={[1.28, 1.28, 0.07, 28]} />
        </Part>
        <Part color="#e0b84a" position={[0, 0.34, 1.0]} outline={1.1}>
          <sphereGeometry args={[0.09, 10, 8]} />
        </Part>
      </group>
    );
  return (
    <group position={[0, 0.08, 0]}>
      <Part color={color} outline={1.05}>
        <sphereGeometry args={[1.06, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      </Part>
      <Part color={color} position={[0, 0.02, 0]} outline={1.06}>
        <cylinderGeometry args={[1.2, 1.2, 0.09, 28]} />
      </Part>
    </group>
  );
};

/**
 * Karakter 3D bergaya kartun: kepala bulat putih besar, garis tepi tebal, mata berkelopak berat,
 * badan kecil, tangan-kaki kurus. Tinggi ±3.9 unit. Semua animasi murni dari props (`frame`).
 * Gunakan hanya di dalam <Stage3D>.
 */
export const Character3D: React.FC<{
  frame: number;
  position?: V3;
  rotY?: number;
  scale?: number;
  outfit?: string;
  hat?: Hat;
  hatColor?: string;
  mustache?: boolean;
  mood?: Mood;
  lookX?: number;
  armsUp?: boolean;
  hold?: boolean; // tangan di depan (mengoperasikan tuas)
  sit?: boolean;
  idle?: boolean;
}> = ({frame, position = [0, 0, 0], rotY = 0, scale = 1, outfit = PALETTE.khaki, hat = "cap", hatColor = PALETTE.brown, mustache = false, mood = "calm", lookX = 0, armsUp = false, hold = false, sit = false, idle = true}) => {
  const bob = idle ? Math.sin(frame / 14) * 0.04 : 0;
  const blink = idle && frame % 96 > 92;
  const drop = sit ? 0.55 : 0;
  const shoulderY = 2.0 - drop;
  const hands: {l: V3; r: V3} = armsUp
    ? {l: [-1.0, 3.05 - drop, 0.1], r: [1.0, 3.05 - drop, 0.1]}
    : hold
    ? {l: [-0.45, 1.65 - drop, 0.95], r: [0.45, 1.65 - drop, 0.95]}
    : {l: [-0.78, 1.15 - drop, 0.1], r: [0.78, 1.15 - drop, 0.1]};

  return (
    <group position={position} rotation={[0, rotY, 0]} scale={scale}>
      <Blob size={[2.6, 2.0]} opacity={0.35} />
      <group position={[0, bob, 0]}>
        {/* kaki */}
        {sit ? (
          <>
            <Limb a={[-0.28, 0.95 - drop, 0]} b={[-0.28, 0.95 - drop, 0.95]} />
            <Limb a={[0.28, 0.95 - drop, 0]} b={[0.28, 0.95 - drop, 0.95]} />
            <Limb a={[-0.28, 0.95 - drop, 0.95]} b={[-0.28, 0.12, 1.0]} />
            <Limb a={[0.28, 0.95 - drop, 0.95]} b={[0.28, 0.12, 1.0]} />
          </>
        ) : (
          <>
            <Limb a={[-0.28, 0.95, 0]} b={[-0.34, 0.14, 0.05]} />
            <Limb a={[0.28, 0.95, 0]} b={[0.34, 0.14, 0.05]} />
          </>
        )}
        <Part color={PALETTE.brown} position={[-0.34, 0.1, sit ? 1.1 : 0.2]} scale={[0.3, 0.14, 0.42]} outline={1.12}>
          <sphereGeometry args={[1, 12, 8]} />
        </Part>
        <Part color={PALETTE.brown} position={[0.34, 0.1, sit ? 1.1 : 0.2]} scale={[0.3, 0.14, 0.42]} outline={1.12}>
          <sphereGeometry args={[1, 12, 8]} />
        </Part>
        {/* badan */}
        <Part color={outfit} position={[0, 1.55 - drop, 0]} outline={1.1}>
          <capsuleGeometry args={[0.5, 0.8, 6, 16]} />
        </Part>
        {/* lengan dan tangan */}
        <Limb a={[-0.52, shoulderY, 0]} b={hands.l} />
        <Limb a={[0.52, shoulderY, 0]} b={hands.r} />
        <Part color={PALETTE.brown} position={hands.l} outline={1.14}>
          <sphereGeometry args={[0.16, 12, 10]} />
        </Part>
        <Part color={PALETTE.brown} position={hands.r} outline={1.14}>
          <sphereGeometry args={[0.16, 12, 10]} />
        </Part>
        {/* kepala */}
        <group position={[0, 2.95 - drop, 0]} rotation={[0, lookX * 0.25, 0]}>
          <Part color={PALETTE.skin} outline={1.045}>
            <sphereGeometry args={[0.95, 32, 24]} />
          </Part>
          <Eye side={-1} mood={mood} lookX={lookX} blink={blink} />
          <Eye side={1} mood={mood} lookX={lookX} blink={blink} />
          {mustache && (
            <>
              <Part color={PALETTE.brown} position={[-0.2, -0.3, 0.88]} rotation={[0, 0, Math.PI / 2 + 0.28]} outline={1.1}>
                <capsuleGeometry args={[0.08, 0.3, 4, 8]} />
              </Part>
              <Part color={PALETTE.brown} position={[0.2, -0.3, 0.88]} rotation={[0, 0, Math.PI / 2 - 0.28]} outline={1.1}>
                <capsuleGeometry args={[0.08, 0.3, 4, 8]} />
              </Part>
            </>
          )}
          {mood === "shock" && (
            <mesh position={[0, -0.5, 0.86]} scale={[0.75, 1, 1]}>
              <circleGeometry args={[0.16, 16]} />
              <meshBasicMaterial color={INK} />
            </mesh>
          )}
          {mood === "smile" && (
            <mesh position={[0, -0.38, 0.88]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.2, 0.035, 8, 16, Math.PI]} />
              <meshBasicMaterial color={INK} />
            </mesh>
          )}
          {mood === "angry" && !mustache && (
            <mesh position={[0, -0.5, 0.86]}>
              <planeGeometry args={[0.34, 0.06]} />
              <meshBasicMaterial color={INK} />
            </mesh>
          )}
          <HatEl hat={hat} color={hatColor} />
        </group>
      </group>
    </group>
  );
};
