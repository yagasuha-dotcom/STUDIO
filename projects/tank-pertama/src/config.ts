import timing from "./timing.json";

// ───────── FORMAT TIKTOK / REELS / SHORTS ─────────
export const W = 1080;
export const H = 1920;
export const FPS = 30;

// Safe zone TikTok: atas 0–190 (tab), kanan 940–1080 (ikon), bawah 1500–1920 (caption).
// Semua objek penting harus berada di dalam SAFE.
export const SAFE = {left: 60, right: 940, top: 190, bottom: 1500};
export const SAFE_W = SAFE.right - SAFE.left;
export const SUB_BOTTOM = 1490; // dasar area subtitle (px dari atas)

// ───────── TIMING NARASI (ditulis otomatis oleh tools/tts.py) ─────────
export const LINES = timing.lines as {text: string; start: number; end: number}[];
export const LS = (i: number) => LINES[i].start; // detik mulai kalimat i
export const LE = (i: number) => LINES[i].end; // detik selesai kalimat i
export const sf = (sec: number) => Math.round(sec * FPS);

// Narasi dibagi dua file (voice_1.mp3, voice_2.mp3)
export const PART2_START = Math.ceil(timing.part1 * FPS);
export const VOICE2_FRAMES = Math.ceil(timing.part2 * FPS);
export const TOTAL_FRAMES = PART2_START + VOICE2_FRAMES + 45;

// Palet "diorama hangat" (lihat references/style-bible.md)
export const PALETTE = {
  ink: "#2a1d14", // garis tepi tebal
  skin: "#fffdf7", // kepala putih
  khaki: "#b9a35a",
  brown: "#8a5a2b",
  steel: "#6f8faf",
  ochre: "#c9a25f",
  wall: "#d9c9a3",
  floor: "#7a6044",
  sky: "#d8b98a",
  fire: "#ff9a3c",
};

// Kata yang disorot warna aksen di subtitle (kosongkan untuk gaya polos)
export const EMPHASIS: string[] = [];
