import React, {useMemo} from "react";
import * as THREE from "three";
import "@react-three/fiber";
import {random} from "remotion";

/** Warna garis tepi tebal, sama di semua objek (konsistensi gaya). */
export const INK = "#2a1d14";

let _grad: THREE.DataTexture | null = null;
/** Gradasi 4 tingkat → bayangan bergaya kartun (toon) pada MeshToonMaterial. */
export const toonGradient = () => {
  if (!_grad) {
    const d = new Uint8Array([70, 140, 210, 255]);
    const t = new THREE.DataTexture(d, d.length, 1, THREE.RedFormat);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    _grad = t;
  }
  return _grad;
};

/**
 * Tekstur "cat lukis" prosedural: warna dasar + noda bulat berulang, bisa diulang mulus.
 * Deterministik (memakai random(seed) milik Remotion) supaya semua frame/tab render sama.
 */
export const makePaint = (seed: string, base: string, tones: string[], blotches = 70, size = 256) => {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < blotches; i++) {
    const x = random(`${seed}x${i}`) * size;
    const y = random(`${seed}y${i}`) * size;
    const r = 5 + random(`${seed}r${i}`) * size * 0.11;
    g.globalAlpha = 0.1 + random(`${seed}a${i}`) * 0.22;
    g.fillStyle = tones[i % tones.length];
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        g.beginPath();
        g.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

export const usePaint = (seed: string, base: string, tones: string[], repeat = 1, blotches = 70) =>
  useMemo(() => {
    const t = makePaint(seed, base, tones, blotches);
    t.repeat.set(repeat, repeat);
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, base, repeat]);

let _soft: THREE.CanvasTexture | null = null;
/** Lingkaran lembut (asap, debu, bayangan semu). */
export const softCircle = () => {
  if (!_soft) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.5, "rgba(255,255,255,0.55)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    _soft = new THREE.CanvasTexture(c);
    _soft.colorSpace = THREE.SRGBColorSpace;
  }
  return _soft;
};

type V3 = [number, number, number];

/**
 * Satu bagian model: mesh toon + garis tepi tebal (teknik inverted hull).
 * `children` = elemen geometri, mis. <sphereGeometry args={[1, 32, 24]} />.
 * `outline` = pengali skala garis tepi (1.05 = tipis, 1.12 = tebal); 0 = tanpa garis.
 */
export const Part: React.FC<{
  color?: string;
  map?: THREE.Texture | null;
  position?: V3;
  rotation?: V3;
  scale?: V3 | number;
  outline?: number;
  children: React.ReactNode;
}> = ({color = "#ffffff", map, position, rotation, scale, outline = 1.06, children}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh>
      {children}
      <meshToonMaterial color={color} map={map ?? undefined} gradientMap={toonGradient()} />
    </mesh>
    {outline > 0 && (
      <mesh scale={outline}>
        {children}
        <meshBasicMaterial color={INK} side={THREE.BackSide} />
      </mesh>
    )}
  </group>
);

/** Bayangan semu bulat di tanah (membuat objek terasa menapak). */
export const Blob: React.FC<{position?: V3; size?: [number, number]; opacity?: number}> = ({
  position = [0, 0.03, 0],
  size = [3, 3],
  opacity = 0.4,
}) => (
  <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={size} />
    <meshBasicMaterial map={softCircle()} color="#1a0f08" transparent opacity={opacity} depthWrite={false} />
  </mesh>
);

/** Asap/debu: partikel sprite yang naik dan memudar, murni fungsi dari `frame`. */
export const Smoke: React.FC<{
  frame: number;
  origin?: V3;
  count?: number;
  color?: string;
  rise?: number;
  spread?: number;
  size?: number;
  speed?: number;
  opacity?: number;
  wind?: number;
  seed?: string;
}> = ({frame, origin = [0, 0, 0], count = 10, color = "#4a4038", rise = 2.2, spread = 0.8, size = 0.9, speed = 0.012, opacity = 0.55, wind = -1.2, seed = "smoke"}) => {
  const tex = softCircle();
  return (
    <group position={origin}>
      {Array.from({length: count}, (_, i) => {
        const life = (frame * speed + i / count) % 1;
        const rx = (random(`${seed}x${i}`) - 0.5) * spread * life;
        const rz = (random(`${seed}z${i}`) - 0.5) * spread * life;
        const s = size * (0.5 + life * 1.7) * (0.8 + random(`${seed}s${i}`) * 0.4);
        const op = opacity * (1 - life) * Math.min(1, life * 8);
        return (
          <sprite key={i} position={[wind * life + rx, rise * life, rz]} scale={[s, s, 1]}>
            <spriteMaterial map={tex} color={color} transparent opacity={op} depthWrite={false} />
          </sprite>
        );
      })}
    </group>
  );
};
