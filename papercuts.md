# Papercuts

2026-09-04T03:14:40.758Z — gpt-5.6-sol — ohong

Sites vinext HMR during repeated live UI edits → emitted 'Detected multiple renderers concurrently rendering the same context provider'; a fresh reload and production build stayed clean.

2026-09-04T07:57:59.203Z — gpt-5.6-sol — ohong

creating a YouTube-ready waveform video → Homebrew FFmpeg 8.1.2 lacks the drawtext filter; workaround is a pre-rendered title card or text-free waveform

2026-09-04T09:10:35.739Z — gpt-5.6-sol — ohong

capturing a browser walkthrough via the installed agent-browser skill → the documented agent-browser executable is not on PATH; trying the npx package as the skill's runtime fallback

2026-09-04T21:02:28.063Z — gpt-6-astra — ohong

Inspecting local reference-video sound → uncompressed WAV exceeded tool output limits; use compressed audio transport or local transcription plus explicit listening limitations.

2026-09-04T21:17:05.193Z — gpt-5 — ohong

Whisper word_timestamps with --device mps failed on local M5: timing.py DTW requests float64 MPS tensor; workaround was segment timestamps without word timestamps.

2026-09-04T21:24:39.605Z — gpt-6-astra — ohong

Validating the new motion-video skill → bundled Python lacks PyYAML required by skill-creator quick_validate.py; trying an isolated uv environment from cached packages.

