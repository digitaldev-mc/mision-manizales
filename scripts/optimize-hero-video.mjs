/**
 * Optimiza public/assets/donaciones.mov → MP4 + poster JPG para el hero.
 * Requiere: npm install --no-save ffmpeg-static
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const input = join(root, "public/assets/donaciones.mov");
const mp4 = join(root, "public/assets/donaciones-hero.mp4");
const poster = join(root, "public/assets/donaciones-hero-poster.jpg");

let ffmpegPath;
try {
  ffmpegPath = (await import("ffmpeg-static")).default;
} catch {
  console.error("Instala ffmpeg-static: npm install --no-save ffmpeg-static");
  process.exit(1);
}

if (!ffmpegPath || !existsSync(input)) {
  console.error("Falta ffmpeg o el archivo", input);
  process.exit(1);
}

function run(args) {
  const r = spawnSync(ffmpegPath, args, { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run([
  "-i",
  input,
  "-an",
  "-vf",
  "scale=1280:-2",
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  "28",
  "-movflags",
  "+faststart",
  "-pix_fmt",
  "yuv420p",
  mp4,
  "-y",
]);

run(["-i", mp4, "-ss", "00:00:03", "-vframes", "1", "-update", "1", "-q:v", "2", poster, "-y"]);

console.log("Listo:", mp4, poster);
