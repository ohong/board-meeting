# Live fal verification

- Final deliverable: `boardroom-pov-bw-10s.mp4`.
- Authenticated request: `01a06e57-3de1-7463-b661-bbb3300efffb` to `minimax/h3-max/image-to-video`.
- One paid generation was submitted, with duration 10 and resolution 768P. The API key was loaded from the ignored repository-root `.env.local`; it is absent from these artifacts.
- fal returned COMPLETED and the MP4 downloaded successfully. `boardroom-pov-10s.fal.json` preserves request parameters, URLs, timestamps, and response metadata.
- The built-in imagegen tool composed the five supplied headshots into `starting-frame.png`. Exact image and motion prompts are recorded in `prompts.md`.
- The original API output is `boardroom-pov-10s.mp4` (10.144 seconds including audio). The final export trims to exactly 10 seconds and removes the small residual chroma with FFmpeg `hue=s=0`, encoding H.264 at CRF 18 and AAC at 160 kbps, with faststart enabled. No extra model request was needed.
- FFprobe confirms the final file is 1344 x 768, 24 fps, with exactly 10.000 seconds for video, audio, and container; file size 4,628,198 bytes.
- Full-file FFmpeg decoding completed without error. Signalstats reports maximum saturation 0 across all 240 final video frames.
- Six visual samples at 0, 2, 4, 6, 8, and approximately 9.96 seconds show all five people, the seated first-person composition, and natural changes in gesture and gaze. `contact-sheet.jpg` shows these samples from the initial trimmed export. Continuous playback and listening were not used for this verification.
- CLI verification: 82 tests passed, focused ESLint passed, package-command dry-run passed, and `git diff --check` passed. The separate repository-wide typecheck still reports errors in the isolated `site/` project; no fal paths were reported.
