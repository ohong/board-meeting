/**
 * Renders the film and normalises its loudness.
 *
 *   node scripts/render.mjs
 *
 * X plays videos back at a normalised level, so a mix that measures quiet does
 * not come out quiet — it comes out fine and then everything around it in the
 * timeline is louder. The two-pass loudnorm below lands the finished file at
 * -14 LUFS with 1.5 dB of true-peak headroom, which is what the platform is
 * expecting. The video stream is copied, not re-encoded, so this costs seconds
 * and changes nothing about the picture.
 */
import { execFile } from "node:child_process";
import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const raw = resolve(ROOT, "out/_raw.mp4");
const final = resolve(ROOT, "out/board-meeting-launch.mp4");

const TARGET = { I: -14, TP: -1.5, LRA: 11 };

const ff = (args) => run("ffmpeg", ["-hide_banner", "-y", ...args], { maxBuffer: 1 << 26 });

console.log("rendering…");
await run("npx", ["remotion", "render", "LaunchVideo", raw, "--codec=h264", "--crf=17"], {
  cwd: ROOT,
  maxBuffer: 1 << 26,
});

console.log("measuring loudness…");
const measure = await ff([
  "-i", raw,
  "-af", `loudnorm=I=${TARGET.I}:TP=${TARGET.TP}:LRA=${TARGET.LRA}:print_format=json`,
  "-f", "null", "-",
]).catch((e) => e);
const json = JSON.parse(String(measure.stderr).slice(String(measure.stderr).lastIndexOf("{")).match(/\{[\s\S]*\}/)[0]);

console.log("normalising…");
await ff([
  "-i", raw,
  "-c:v", "copy",
  "-af",
  `loudnorm=I=${TARGET.I}:TP=${TARGET.TP}:LRA=${TARGET.LRA}` +
    `:measured_I=${json.input_i}:measured_TP=${json.input_tp}` +
    `:measured_LRA=${json.input_lra}:measured_thresh=${json.input_thresh}` +
    `:offset=${json.target_offset}:linear=true`,
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
  "-movflags", "+faststart",
  final,
]);

await rm(raw, { force: true });
console.log(`\n→ ${final}`);
