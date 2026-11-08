#!/usr/bin/env python3
"""
Text-to-speech untuk Carnian Pluvial.

Membaca tools/script_lines.txt (satu kalimat per baris), membuat suara per kalimat,
menyambungnya jadi public/voice_1.mp3 + public/voice_2.mp3, lalu menulis
src/timing.json supaya subtitle dan animasi otomatis sinkron dengan suara baru.

Pakai:
  pip install edge-tts
  python3 tools/tts.py

Pengaturan lewat environment variable:
  TTS_VOICE   id-ID-ArdiNeural (default, pria) | id-ID-GadisNeural (wanita)
  TTS_RATE    kecepatan bicara, contoh "+0%" (default), "-8%", "+10%"
  TTS_ENGINE  edge (default) | fake (nada tes, untuk uji alur tanpa internet)
"""
import asyncio
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "tools" / "script_lines.txt"
OUT_TIMING = ROOT / "src" / "timing.json"
OUT_V1 = ROOT / "public" / "voice_1.mp3"
OUT_V2 = ROOT / "public" / "voice_2.mp3"

VOICE = os.environ.get("TTS_VOICE", "id-ID-ArdiNeural")
RATE = os.environ.get("TTS_RATE", "+0%")
ENGINE = os.environ.get("TTS_ENGINE", "edge")

SR = 44100
SPLIT_AT = 0.285  # voice dibagi dua file; titik potong ≈ 28,5% durasi (sama seperti versi awal)
END_TAIL = 0.8    # jeda setelah kalimat terakhir


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("Perintah gagal: " + " ".join(cmd) + "\n" + r.stderr[-1500:])
    return r


def duration(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(path)])
    return float(r.stdout.strip())


def pause_after(text):
    t = text.rstrip()
    if t.endswith("..."):
        return 0.70
    if t.endswith("?"):
        return 0.50
    if t.endswith((".", "!")):
        return 0.38
    return 0.30


async def synth_edge(texts, folder):
    try:
        import edge_tts
    except ImportError:
        sys.exit("Paket edge-tts belum terpasang. Jalankan: pip install edge-tts")

    sem = asyncio.Semaphore(4)

    async def one(i, text):
        path = folder / f"raw_{i:02d}.mp3"
        async with sem:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(path))
                    if path.exists() and path.stat().st_size > 1000:
                        return path
                except Exception as e:  # jaringan / layanan sibuk
                    print(f"  kalimat {i}: percobaan {attempt + 1} gagal ({e})")
                await asyncio.sleep(2 * (attempt + 1))
        sys.exit(f"Gagal membuat suara untuk kalimat {i}: {text[:60]}")

    return await asyncio.gather(*[one(i, t) for i, t in enumerate(texts)])


def synth_fake(texts, folder):
    out = []
    for i, text in enumerate(texts):
        path = folder / f"raw_{i:02d}.mp3"
        d = max(1.0, len(text) / 14.0)
        run(["ffmpeg", "-y", "-f", "lavfi", "-i", f"sine=frequency={200 + (i % 5) * 40}:duration={d:.3f}",
             str(path)])
        out.append(path)
    return out


def to_wav(src, dst):
    # mono 44,1 kHz + buang hening di awal/akhir supaya tempo rapat
    trim = ("silenceremove=start_periods=1:start_silence=0.04:start_threshold=-50dB,"
            "areverse,"
            "silenceremove=start_periods=1:start_silence=0.04:start_threshold=-50dB,"
            "areverse")
    run(["ffmpeg", "-y", "-i", str(src), "-ar", str(SR), "-ac", "1", "-af", trim, str(dst)])


def silence(seconds, dst):
    run(["ffmpeg", "-y", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono",
         "-t", f"{seconds:.3f}", str(dst)])


def build_part(items, list_path, out_mp3):
    """items: daftar path wav (kalimat + jeda) yang disambung berurutan."""
    with open(list_path, "w") as f:
        for p in items:
            f.write(f"file '{p}'\n")
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(list_path),
         "-c:a", "libmp3lame", "-b:a", "192k", str(out_mp3)])


def main():
    lines = [l.strip() for l in SCRIPT.read_text(encoding="utf-8").splitlines() if l.strip()]
    print(f"{len(lines)} kalimat | engine={ENGINE} voice={VOICE} rate={RATE}")

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        if ENGINE == "fake":
            raws = synth_fake(lines, tmp)
        else:
            raws = asyncio.run(synth_edge(lines, tmp))

        wavs, durs, pauses, pause_files = [], [], [], {}
        for i, raw in enumerate(raws):
            w = tmp / f"line_{i:02d}.wav"
            to_wav(raw, w)
            wavs.append(w)
            durs.append(duration(w))
            pauses.append(pause_after(lines[i]) if i < len(lines) - 1 else END_TAIL)

        # waktu lokal (detik) tiap kalimat, dihitung dari awal seluruh narasi
        starts, ends, t = [], [], 0.0
        for d, p in zip(durs, pauses):
            starts.append(t)
            t += d + p
            ends.append(t)
        total = t

        # titik potong dua file voice
        target = SPLIT_AT * total
        k = min(range(len(lines) - 1), key=lambda i: abs(ends[i] - target))

        def seq(a, b):
            items = []
            for i in range(a, b):
                items.append(wavs[i])
                p = pauses[i]
                key = round(p, 3)
                if key not in pause_files:
                    sp = tmp / f"sil_{int(key * 1000)}.wav"
                    silence(p, sp)
                    pause_files[key] = sp
                items.append(pause_files[key])
            return items

        OUT_V1.parent.mkdir(parents=True, exist_ok=True)
        build_part(seq(0, k + 1), tmp / "p1.txt", OUT_V1)
        build_part(seq(k + 1, len(lines)), tmp / "p2.txt", OUT_V2)

        d1 = duration(OUT_V1)
        d2 = duration(OUT_V2)

        local_shift = ends[k]  # awal part 2 dalam waktu lokal
        out_lines = []
        for i, text in enumerate(lines):
            if i <= k:
                s, e = starts[i], ends[i]
            else:
                s = d1 + (starts[i] - local_shift)
                e = d1 + (ends[i] - local_shift)
            out_lines.append({"text": text, "start": round(s, 2), "end": round(e, 2)})

        data = {"part1": round(d1, 6), "part2": round(d2, 6), "total": round(d1 + d2, 6), "lines": out_lines}
        OUT_TIMING.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"Selesai. voice_1 = {d1:.1f}s, voice_2 = {d2:.1f}s, total = {d1 + d2:.1f}s (potong setelah kalimat {k})")
    for i, l in enumerate(out_lines):
        print(f"{i:2d} {l['start']:7.2f} {l['end']:7.2f}  {l['text'][:50]}")


if __name__ == "__main__":
    main()
