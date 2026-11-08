// Fungsi matematika murni (tanpa three.js / react) — mudah diuji dan aman dipakai di mana saja.

export type V2 = {x: number; y: number};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
/** Easing masuk-keluar halus untuk gerak kamera. */
export const ease = (t: number) => {
  const k = clamp01(t);
  return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
};

/** Pose kamera: dunia digeser/diputar terhadap kamera tetap (lihat Stage3D). */
export type Cam = {x: number; y: number; z: number; yaw: number; pitch: number};
export const mixCam = (a: Partial<Cam>, b: Partial<Cam>, t: number): Cam => {
  const g = (k: keyof Cam) => lerp(a[k] ?? 0, b[k] ?? a[k] ?? 0, t);
  return {x: g("x"), y: g("y"), z: g("z"), yaw: g("yaw"), pitch: g("pitch")};
};

/** Poligon tertutup -> garis putus-putus rapat dengan sudut membulat (radius r). */
export const roundedLoop = (pts: V2[], r: number, seg = 6): V2[] => {
  const out: V2[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[(i + n - 1) % n];
    const c = pts[i];
    const q = pts[(i + 1) % n];
    const d1 = Math.hypot(c.x - p.x, c.y - p.y);
    const d2 = Math.hypot(q.x - c.x, q.y - c.y);
    const k1 = Math.min(r, d1 / 2) / d1;
    const k2 = Math.min(r, d2 / 2) / d2;
    const a = {x: c.x + (p.x - c.x) * k1, y: c.y + (p.y - c.y) * k1};
    const b = {x: c.x + (q.x - c.x) * k2, y: c.y + (q.y - c.y) * k2};
    for (let s = 0; s <= seg; s++) {
      const u = s / seg;
      const w0 = (1 - u) * (1 - u);
      const w1 = 2 * u * (1 - u);
      const w2 = u * u;
      out.push({x: w0 * a.x + w1 * c.x + w2 * b.x, y: w0 * a.y + w1 * c.y + w2 * b.y});
    }
  }
  return out;
};

export const loopLength = (loop: V2[]) => {
  let L = 0;
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i];
    const b = loop[(i + 1) % loop.length];
    L += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return L;
};

/** Taruh n pelat berjarak sama di sepanjang loop; offset (0..1 putaran) menggeser semuanya (trek berputar). */
export const platesOnLoop = (loop: V2[], n: number, offset: number): {x: number; y: number; rot: number}[] => {
  const cum: number[] = [0];
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i];
    const b = loop[(i + 1) % loop.length];
    cum.push(cum[i] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const L = cum[cum.length - 1];
  const res: {x: number; y: number; rot: number}[] = [];
  for (let k = 0; k < n; k++) {
    let u = (k / n + offset) % 1;
    if (u < 0) u += 1;
    const s = u * L;
    let i = 0;
    while (i < loop.length - 1 && cum[i + 1] < s) i++;
    const a = loop[i];
    const b = loop[(i + 1) % loop.length];
    const seg = cum[i + 1] - cum[i] || 1;
    const f = (s - cum[i]) / seg;
    res.push({x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), rot: Math.atan2(b.y - a.y, b.x - a.x)});
  }
  return res;
};
