import {Config} from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);
// Diperlukan agar WebGL (three.js) tampil benar saat render headless.
// Studio otomatis memakai --gl=swangle di server tanpa GPU.
Config.setChromiumOpenGlRenderer("angle");
