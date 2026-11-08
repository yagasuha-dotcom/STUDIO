# Studio

Render proyek Remotion apa saja dari HP, tanpa ganti-ganti file.

Struktur: tiap proyek ada di `projects/<nama>/`. Workflow `render.yml` membaca proyeknya
sendiri (composition, perlu 3D atau tidak, ada naskah atau tidak), lalu merender.

## Mode suara (otomatis)
- `template`: proyek punya `tools/tts.py` + `src/timing.json` (seperti Carnian). Suara dibuat,
  animasi dan subtitle ikut sinkron.
- `overlay`: proyek punya `narration.txt`. Suara ditempel ke video setelah render.
  Ganti suara per kalimat dengan awalan `[ardi]`, `[gadis]`, atau nama suara lengkap `[en-US-AriaNeural]`.
- `none`: tanpa narasi, video dirender apa adanya.

## Perintah (Termux)
    vidio add /sdcard/Download/proyek.zip nama
    vidio run nama only_voice=true
    vidio run nama frames=0-450 scale=0.5
    vidio run nama
    vidio run nama voice=id-ID-GadisNeural rate=-8%
