import React from "react";
import * as THREE from "three";
import "@react-three/fiber";
import {ThreeCanvas} from "@remotion/three";
import {AbsoluteFill} from "remotion";
import {H, W} from "../config";
import type {Cam} from "./math";

export type Sky = {top: string; mid: string; bottom: string; fog: string; hills?: string};

export const SKY_DAY: Sky = {top: "#8f8978", mid: "#cdb48a", bottom: "#dcc79f", fog: "#cdb48a", hills: "#a58d66"};
export const SKY_DUSK: Sky = {top: "#4a3b3a", mid: "#b5744a", bottom: "#d99a62", fog: "#b5744a", hills: "#6d4a38"};
export const SKY_INDOOR: Sky = {top: "#3a2c20", mid: "#5a4430", bottom: "#6b5239", fog: "#4a3828"};

/** Latar langit 2.5D: gradasi + bukit siluet yang bergeser pelan mengikuti putaran kamera (parallax). */
export const Backdrop: React.FC<{sky: Sky; yaw?: number}> = ({sky, yaw = 0}) => (
  <AbsoluteFill style={{background: `linear-gradient(${sky.top} 0%, ${sky.mid} 46%, ${sky.bottom} 62%)`}}>
    {sky.hills && (
      <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, transform: `translateX(${-yaw * 520}px)`}}>
        <path
          d={`M-400 ${H * 0.5} Q 100 ${H * 0.43} 420 ${H * 0.48} T 980 ${H * 0.46} T 1500 ${H * 0.49} L 1500 ${H * 0.62} L -400 ${H * 0.62} Z`}
          fill={sky.hills}
          opacity={0.55}
        />
      </svg>
    )}
  </AbsoluteFill>
);

/**
 * Panggung 3D: kamera tetap, DUNIA yang digeser/diputar sesuai `cam`
 * (z>0 = mendekat/push-in, yaw = memutar mengelilingi pusat, pitch = menunduk).
 * Titik fokus adegan sebaiknya berada di dekat (0,0,0).
 * PENTING: anak-anak di dalam <Stage3D> hanya boleh memakai props (frame dikirim lewat props),
 * jangan memakai hook/context kustom di dalamnya.
 */
export const Stage3D: React.FC<{
  cam: Cam;
  fog?: string;
  fogRange?: [number, number];
  key1?: string;
  children: React.ReactNode;
}> = ({cam, fog = "#cdb48a", fogRange = [16, 70], key1 = "#ffd9a0", children}) => (
  <ThreeCanvas width={W} height={H} style={{position: "absolute", inset: 0}} camera={{position: [0, 0, 12], fov: 38, near: 0.1, far: 400}}>
    <fog attach="fog" args={[fog, fogRange[0], fogRange[1]]} />
    <ambientLight intensity={1.15} color="#d8c0a0" />
    <directionalLight position={[5, 9, 7]} intensity={2.3} color={key1} />
    <directionalLight position={[-7, 3, -3]} intensity={0.7} color="#8aa4c8" />
    <group position={[cam.x, cam.y, cam.z]} rotation={[cam.pitch, cam.yaw, 0]}>
      {children}
    </group>
  </ThreeCanvas>
);

// Dipakai agar impor THREE tidak dibuang oleh bundler saat tree-shaking JSX intrinsics.
export const _three = THREE.REVISION;
