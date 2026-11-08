#!/usr/bin/env python3
"""
Studio: pembantu render proyek Remotion apa saja tanpa ganti-ganti file.

  python3 tools/studio.py detect <folder-proyek> [composition]
      Baca proyek: ID composition, perlu 3D atau tidak, dan mode suara.
      Hasil ditulis ke $GITHUB_OUTPUT (comp, comps, uses3d, mode).

  python3 tools/studio.py overlay-tts <folder-proyek> <folder-keluaran>
      Buat suara dari narration.txt milik proyek -> voice.mp3 + voice_timing.json
      Format narration.txt: satu kalimat per baris. Awali dengan [ardi] atau [gadis]
      (atau nama suara lengkap, mis. [en-US-AriaNeural]) untuk ganti suara per kalimat.

  python3 tools/studio.py mix <video.mp4> <voice.mp3> <hasil.mp4>
      Tempel voice ke video (suara bawaan video tetap ada).

Mode suara hasil `detect`:
  template  proyek punya tools/tts.py + src/timing.json (seperti Carnian): proyek
            menjalankan TTS-nya sendiri dan animasi ikut sinkron.
  overlay   proyek punya narration.txt: suara ditempel ke video setelah render.
  none      tidak ada narasi.
"""
import asyncio
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

SR = 44100
VOICE_ALIAS = {"ardi": "id-ID-ArdiNeural", "gadis": "id-ID-GadisNeural"}
ENGINE = os.environ.get("TTS_ENGINE", "edge")  # edge | fake (uji tanpa internet)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("Perintah gagal: " + " ".join(map(str, cmd)) + "\n" + r.stderr[-1500:])
    return r


def duration(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(path)])
    return float(r.stdout.strip())


def set_output(key, value):
    line = f"{key}={value}"
    print(line)
    gh = os.environ.get("GITHUB_OUTPUT")
    if gh:
        with open(gh, "a") as f:
            f.write(line + "\n")


# ───────────────────────── detect ─────────────────────────
def detect(proj, wanted=""):
    proj = Path(proj)
    if not (proj / "package.json").exists():
        sys.exit(f"package.json tidak ditemukan di {proj}. Pastikan isi zip adalah proyek Remotion.")
    pkg = json.loads((proj / "package.json").read_text(encoding="utf-8"))
    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    if "remotion" not in deps:
        print("PERINGATAN: paket 'remotion' tidak ada di package.json")

    uses3d = any(k in deps for k in ("three", "@react-three/fiber", "@remotion/three"))

    ids = []
    for pat in ("*.tsx", "*.jsx", "*.ts", "*.js"):
        for f in sorted(proj.glob(f"src/**/{pat}")):
            try:
                text = f.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            for m in re.finditer(r"<Composition\b[\s\S]{0,400}?\bid=[\"']([^\"']+)[\"']", text):
                if m.group(1) not in ids:
                    ids.append(m.group(1))

    comp = wanted.strip() or (ids[0] if ids else "")
    if not comp:
        sys.exit("Composition tidak ditemukan. Isi input 'composition' secara manual.")
    if wanted.strip() and ids and wanted.strip() not in ids:
        print(f"PERINGATAN: '{wanted}' tidak ada di daftar composition yang terbaca: {ids}")

    if (proj / "tools" / "tts.py").exists() and (proj / "src" / "timing.json").exists():
        mode = "template"
    elif (proj / "narration.txt").exists():
        mode = "overlay"
    else:
        mode = "none"

    set_output("comp", comp)
    set_output("comps", ",".join(ids))
    set_output("uses3d", "true" if uses3d else "false")
    set_output("mode", mode)


# ───────────────────────── overlay-tts ─────────────────────────
def parse_narration(path):
    default = os.environ.get("TTS_VOICE", "id-ID-ArdiNeural")
    items = []
    for raw in Path(path).read_text(encoding="utf-8").splitlines():
        raw = raw.strip()
        if not raw:
            continue
        voice, text = default, raw
        m = re.match(r"^\[([^\]]+)\]\s*(.+)$", raw)
        if m:
            tag = m.group(1).strip()
            voice = VOICE_ALIAS.get(tag.lower(), tag)
            text = m.group(2).strip()
        items.append((voice, text))
    return items


def pause_after(text):
    t = text.rstrip()
    if t.endswith("..."):
        return 0.70
    if t.endswith("?"):
        return 0.50
    if t.endswith((".", "!")):
        return 0.38
    return 0.30


async def synth_edge(items, folder, rate):
    try:
        import edge_tts
    except ImportError:
        sys.exit("Paket edge-tts belum terpasang. Jalankan: pip install edge-tts")
    sem = asyncio.Semaphore(4)

    async def one(i, voice, text):
        path = folder / f"raw_{i:03d}.mp3"
        async with sem:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(text, voice, rate=rate).save(str(path))
                    if path.exists() and path.stat().st_size > 1000:
                        return path
                except Exception as e:
                    print(f"  kalimat {i}: percobaan {attempt + 1} gagal ({e})")
                await asyncio.sleep(2 * (attempt + 1))
        sys.exit(f"Gagal membuat suara untuk kalimat {i} (suara {voice}): {text[:60]}")

    return await asyncio.gather(*[one(i, v, t) for i, (v, t) in enumerate(items)])


def synth_fake(items, folder):
    out = []
    for i, (_, text) in enumerate(items):
        path = folder / f"raw_{i:03d}.mp3"
        run(["ffmpeg", "-y", "-f", "lavfi", "-i",
             f"sine=frequency={200 + (i % 5) * 40}:duration={max(1.0, len(text) / 14.0):.3f}", str(path)])
        out.append(path)
    return out


def overlay_tts(proj, outdir):
    proj, outdir = Path(proj), Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    items = parse_narration(proj / "narration.txt")
    rate = os.environ.get("TTS_RATE", "+0%")
    print(f"{len(items)} kalimat | engine={ENGINE} rate={rate}")

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        raws = synth_fake(items, tmp) if ENGINE == "fake" else asyncio.run(synth_edge(items, tmp, rate))

        trim = ("silenceremove=start_periods=1:start_silence=0.04:start_threshold=-50dB,areverse,"
                "silenceremove=start_periods=1:start_silence=0.04:start_threshold=-50dB,areverse")
        listing, timing, t = [], [], 0.0
        sil_cache = {}
        for i, (raw, (voice, text)) in enumerate(zip(raws, items)):
            w = tmp / f"l_{i:03d}.wav"
            run(["ffmpeg", "-y", "-i", str(raw), "-ar", str(SR), "-ac", "1", "-af", trim, str(w)])
            d = duration(w)
            p = pause_after(text) if i < len(items) - 1 else 0.8
            if p not in sil_cache:
                sp = tmp / f"sil_{int(p * 1000)}.wav"
                run(["ffmpeg", "-y", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono", "-t", f"{p:.3f}", str(sp)])
                sil_cache[p] = sp
            listing += [w, sil_cache[p]]
            timing.append({"text": text, "voice": voice, "start": round(t, 2), "end": round(t + d + p, 2)})
            t += d + p

        lst = tmp / "list.txt"
        lst.write_text("".join(f"file '{p}'\n" for p in listing))
        run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
             "-c:a", "libmp3lame", "-b:a", "192k", str(outdir / "voice.mp3")])

    total = duration(outdir / "voice.mp3")
    (outdir / "voice_timing.json").write_text(
        json.dumps({"total": round(total, 3), "lines": timing}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Selesai. voice.mp3 = {total:.1f}s")


# ───────────────────────── mix ─────────────────────────
def mix(video, voice, out):
    vd, ad = duration(video), duration(voice)
    if ad > vd + 0.5:
        print(f"PERINGATAN: voice ({ad:.1f}s) lebih panjang dari video ({vd:.1f}s), sisa suara akan terpotong.")
    has_audio = bool(run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries",
                          "stream=index", "-of", "csv=p=0", str(video)]).stdout.strip())
    if has_audio:
        fc = "[0:a][1:a]amix=inputs=2:duration=first:normalize=0[a]"
        cmd = ["ffmpeg", "-y", "-i", str(video), "-i", str(voice), "-filter_complex", fc,
               "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
               "-t", f"{vd:.3f}", str(out)]
    else:
        cmd = ["ffmpeg", "-y", "-i", str(video), "-i", str(voice), "-map", "0:v", "-map", "1:a",
               "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{vd:.3f}", str(out)]
    run(cmd)
    print(f"Hasil: {out}")


def main():
    a = sys.argv[1:]
    if len(a) >= 2 and a[0] == "detect":
        detect(a[1], a[2] if len(a) > 2 else "")
    elif len(a) >= 3 and a[0] == "overlay-tts":
        overlay_tts(a[1], a[2])
    elif len(a) >= 4 and a[0] == "mix":
        mix(a[1], a[2], a[3])
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
