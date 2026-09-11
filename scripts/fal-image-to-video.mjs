#!/usr/bin/env bun

import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";

const API_ORIGIN = "https://queue.fal.run";
const MODEL_PATH = "/minimax/h3-max/image-to-video";
const DEFAULT_TIMEOUT_MS = 240_000;
const API_REQUEST_TIMEOUT_MS = 30_000;
const DOWNLOAD_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 2_000;
const IMAGE_TYPES = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".avif", "image/avif"],
]);

const HELP = `Generate a video with fal.ai MiniMax H3 Max.

Usage:
  bun run video:generate -- --image <path-or-https-url> --prompt <text> [options]
  bun run video:generate -- --request-id <id> [--output <path>]

Required for a new request:
  --image <value>       Local PNG, JPG, JPEG, WEBP, GIF, or AVIF; or a public HTTPS URL
  --prompt <text>       Motion prompt (1-50000 characters)

Options:
  --end-image <value>   Optional final keyframe, using the same formats as --image
  --duration <seconds>  Integer from 5 through 15 (default: 5)
  --resolution <value>  480P or 768P (default: 768P)
  --output <path>       MP4 destination (default: exports/fal-video/<request-id>.mp4)
  --request-id <id>     Resume polling and retrieval without submitting again
  --dry-run             Validate locally and print a redacted request summary
  --help                Show this help

Set FAL_KEY in the repository-root .env.local file before a live request.`;

const defaultRuntime = {
  access,
  fetch: globalThis.fetch,
  mkdir,
  now: Date.now,
  readFile,
  sleep: (milliseconds, signal) =>
    new Promise((resolveSleep, reject) => {
      const onAbort = () => {
        clearTimeout(timer);
        reject(signal.reason ?? new Error("Request aborted"));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolveSleep();
      }, milliseconds);
      if (signal.aborted) return onAbort();
      signal.addEventListener("abort", onAbort, { once: true });
    }),
  stat,
  writeFile,
};

function parseArgs(argv) {
  const values = new Map();
  let dryRun = false;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      help = true;
      continue;
    }
    if (!argument.startsWith("--")) {
      throw new Error(`Unexpected argument: ${argument}`);
    }

    const name = argument.slice(2);
    if (!["image", "prompt", "end-image", "duration", "resolution", "output", "request-id"].includes(name)) {
      throw new Error(`Unknown option: ${argument}`);
    }
    if (values.has(name)) {
      throw new Error(`Option ${argument} may only be provided once`);
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Option ${argument} requires a value`);
    }
    values.set(name, value);
    index += 1;
  }

  return { values, dryRun, help };
}

function validateOptions(parsed, cwd) {
  if (parsed.help) return { help: true };

  const requestId = parsed.values.get("request-id");
  const outputValue = parsed.values.get("output");
  const output = outputValue ? resolve(cwd, outputValue) : undefined;
  if (output && extname(output).toLowerCase() !== ".mp4") {
    throw new Error("--output must end in .mp4");
  }

  if (requestId) {
    const generationOptions = ["image", "prompt", "end-image", "duration", "resolution"].filter((name) =>
      parsed.values.has(name),
    );
    if (generationOptions.length > 0) {
      throw new Error(`--request-id cannot be combined with --${generationOptions[0]}`);
    }
    validateRequestId(requestId);
    return { dryRun: parsed.dryRun, help: false, output, requestId };
  }

  const image = parsed.values.get("image");
  const prompt = parsed.values.get("prompt");
  if (!image) throw new Error("--image is required for a new request");
  if (!prompt) throw new Error("--prompt is required for a new request");
  if (prompt.trim().length === 0 || prompt.length > 50_000) {
    throw new Error("--prompt must contain 1 to 50000 characters");
  }

  const durationValue = parsed.values.get("duration") ?? "5";
  if (!/^\d+$/.test(durationValue)) {
    throw new Error("--duration must be an integer from 5 through 15");
  }
  const duration = Number(durationValue);
  if (duration < 5 || duration > 15) {
    throw new Error("--duration must be an integer from 5 through 15");
  }

  const resolution = parsed.values.get("resolution") ?? "768P";
  if (resolution !== "480P" && resolution !== "768P") {
    throw new Error("--resolution must be 480P or 768P");
  }

  return {
    dryRun: parsed.dryRun,
    duration,
    endImage: parsed.values.get("end-image"),
    help: false,
    image,
    output,
    prompt,
    resolution,
  };
}

function validateRequestId(requestId) {
  if (typeof requestId !== "string" || !/^[A-Za-z0-9_-]+$/.test(requestId)) {
    throw new Error("request_id may contain only letters, numbers, hyphens, and underscores");
  }
  return requestId;
}

function parseHttpsUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a local image file or public HTTPS URL`);
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(`${label} URL must use HTTPS and must not contain credentials`);
  }
  return url.toString();
}

async function prepareImage(value, label, runtime, cwd, encode) {
  if (/^[A-Za-z][A-Za-z\d+.-]*:\/\//.test(value)) {
    const url = parseHttpsUrl(value, label);
    return { apiValue: url, summary: { source: "url", url } };
  }

  const path = resolve(cwd, value);
  const type = IMAGE_TYPES.get(extname(path).toLowerCase());
  if (!type) {
    throw new Error(`${label} local file must be PNG, JPG, JPEG, WEBP, GIF, or AVIF`);
  }
  let details;
  try {
    details = await runtime.stat(path);
  } catch {
    throw new Error(`${label} local file does not exist: ${path}`);
  }
  if (!details.isFile()) {
    throw new Error(`${label} local path is not a file: ${path}`);
  }

  const summary = { bytes: details.size, contentType: type, path, source: "local-file" };
  if (!encode) return { summary };
  const contents = await runtime.readFile(path);
  return { apiValue: `data:${type};base64,${contents.toString("base64")}`, summary };
}

function requestUrls(requestId) {
  const base = `${API_ORIGIN}${MODEL_PATH}/requests/${encodeURIComponent(requestId)}`;
  return { responseUrl: base, statusUrl: `${base}/status` };
}

function validateApiUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`fal returned an invalid ${label}`);
  }
  if (url.origin !== API_ORIGIN || url.username || url.password || url.hash) {
    throw new Error(`Refusing to send FAL_KEY outside ${API_ORIGIN}`);
  }
  return url.toString();
}

function signalFor(overallSignal, timeoutMs) {
  return AbortSignal.any([overallSignal, AbortSignal.timeout(timeoutMs)]);
}

async function responseError(response) {
  const text = (await response.text()).trim().slice(0, 1_000);
  return text ? `: ${text}` : "";
}

async function fetchJson(runtime, url, key, init, overallSignal) {
  const safeUrl = validateApiUrl(url, "queue URL");
  const response = await runtime.fetch(safeUrl, {
    ...init,
    headers: {
      Authorization: `Key ${key}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    redirect: "manual",
    signal: signalFor(overallSignal, API_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`fal API returned HTTP ${response.status}${await responseError(response)}`);
  }
  return response.json();
}

async function pathExists(runtime, path) {
  try {
    await runtime.access(path);
    return true;
  } catch {
    return false;
  }
}

function metadataPath(output) {
  return output.replace(/\.mp4$/i, ".fal.json");
}

async function saveMetadata(runtime, path, metadata, create) {
  await runtime.mkdir(dirname(path), { recursive: true });
  await runtime.writeFile(path, `${JSON.stringify(metadata, null, 2)}\n`, {
    encoding: "utf8",
    flag: create ? "wx" : "w",
  });
}

function timestamp(runtime) {
  return new Date(runtime.now()).toISOString();
}

function resumeCommand(requestId, output) {
  // POSIX single-quote escaping keeps copy-pasted paths inert in zsh/bash.
  const quote = (value) => `'${value.replaceAll("'", `'"'"'`)}'`;
  const outputOption = output ? ` --output ${quote(output)}` : "";
  return `bun run video:generate -- --request-id ${requestId}${outputOption}`;
}

async function loadMetadata(runtime, path, requestId) {
  let existing;
  try {
    existing = JSON.parse((await runtime.readFile(path)).toString("utf8"));
  } catch (error) {
    throw new Error(`Could not read existing fal metadata: ${path}`, { cause: error });
  }
  if (existing?.requestId !== requestId) {
    throw new Error(`Existing fal metadata does not match request_id ${requestId}: ${path}`);
  }
  return existing;
}

async function pollForCompletion(runtime, statusUrl, key, overallSignal, deadline, log) {
  let priorStatus;
  while (runtime.now() < deadline) {
    const status = await fetchJson(runtime, statusUrl, key, { method: "GET" }, overallSignal);
    if (status.status !== priorStatus) {
      const position = status.status === "IN_QUEUE" && Number.isInteger(status.queue_position)
        ? ` (position ${status.queue_position})`
        : "";
      log(`fal status: ${status.status}${position}`);
      priorStatus = status.status;
    }
    if (status.status === "COMPLETED") {
      if (status.error) throw new Error(`fal generation failed: ${status.error}`);
      return status;
    }
    if (status.status !== "IN_QUEUE" && status.status !== "IN_PROGRESS") {
      throw new Error(`fal returned an unknown queue status: ${String(status.status)}`);
    }
    await runtime.sleep(POLL_INTERVAL_MS, overallSignal);
  }
  throw new Error("Timed out waiting for fal after 240 seconds");
}

async function downloadVideo(runtime, videoUrl, output, overallSignal) {
  const url = parseHttpsUrl(videoUrl, "Generated video");
  const response = await runtime.fetch(url, {
    redirect: "follow",
    signal: signalFor(overallSignal, DOWNLOAD_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Video download returned HTTP ${response.status}${await responseError(response)}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await runtime.mkdir(dirname(output), { recursive: true });
  await runtime.writeFile(output, bytes, { flag: "wx" });
  return bytes.length;
}

export async function run(argv, options = {}) {
  const runtime = { ...defaultRuntime, ...options.runtime };
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const log = options.log ?? console.log;
  const parsed = parseArgs(argv);
  const config = validateOptions(parsed, cwd);

  if (config.help) {
    log(HELP);
    return { help: true };
  }

  let image;
  let endImage;
  if (!config.requestId) {
    image = await prepareImage(config.image, "--image", runtime, cwd, !config.dryRun);
    endImage = config.endImage
      ? await prepareImage(config.endImage, "--end-image", runtime, cwd, !config.dryRun)
      : undefined;
  }

  if (config.dryRun) {
    const summary = config.requestId
      ? { mode: "resume", requestId: config.requestId, ...requestUrls(config.requestId), output: config.output }
      : {
          mode: "submit",
          model: MODEL_PATH.slice(1),
          image: image.summary,
          endImage: endImage?.summary,
          prompt: config.prompt,
          duration: config.duration,
          resolution: config.resolution,
          promptExpansionMode: "balanced",
          safetyChecker: true,
          output: config.output,
        };
    log(JSON.stringify(summary, null, 2));
    return { dryRun: true, summary };
  }

  const key = env.FAL_KEY?.trim();
  if (!key) {
    throw new Error(`FAL_KEY is missing. Add it to ${resolve(cwd, ".env.local")}`);
  }

  if (config.output && (await pathExists(runtime, config.output))) {
    throw new Error(`Refusing to overwrite existing output: ${config.output}`);
  }
  if (!config.requestId && config.output && (await pathExists(runtime, metadataPath(config.output)))) {
    throw new Error(`Refusing to overwrite existing metadata: ${metadataPath(config.output)}`);
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new Error(`Command timed out after ${Math.round(timeoutMs / 1_000)} seconds`)),
    timeoutMs,
  );
  const deadline = runtime.now() + timeoutMs;
  let requestId = config.requestId;
  let output;

  try {
    let statusUrl;
    let responseUrl;
    let createMetadata = false;
    let existingMetadata;

    if (requestId) {
      const fallback = requestUrls(requestId);
      statusUrl = fallback.statusUrl;
      responseUrl = fallback.responseUrl;
    } else {
      const body = {
        prompt: config.prompt,
        duration: config.duration,
        resolution: config.resolution,
        enable_safety_checker: true,
        prompt_expansion_mode: "balanced",
        image_url: image.apiValue,
        ...(endImage ? { end_image_url: endImage.apiValue } : {}),
      };
      const submitted = await fetchJson(
        runtime,
        `${API_ORIGIN}${MODEL_PATH}`,
        key,
        { body: JSON.stringify(body), method: "POST" },
        controller.signal,
      );
      if (typeof submitted.request_id !== "string" || submitted.request_id.length === 0) {
        throw new Error("fal submit response did not include request_id");
      }
      requestId = validateRequestId(submitted.request_id);
      const fallback = requestUrls(requestId);
      statusUrl = validateApiUrl(submitted.status_url ?? fallback.statusUrl, "status_url");
      responseUrl = validateApiUrl(submitted.response_url ?? fallback.responseUrl, "response_url");
      createMetadata = true;
      log(`fal request_id: ${requestId}`);
    }

    output = config.output ?? resolve(cwd, "exports", "fal-video", `${requestId}.mp4`);
    const metadataFile = metadataPath(output);
    if (await pathExists(runtime, output)) {
      throw new Error(`Refusing to overwrite existing output: ${output}`);
    }
    if (createMetadata && (await pathExists(runtime, metadataFile))) {
      throw new Error(`Refusing to overwrite existing metadata: ${metadataFile}`);
    }
    if (config.requestId && (await pathExists(runtime, metadataFile))) {
      existingMetadata = await loadMetadata(runtime, metadataFile, requestId);
      statusUrl = validateApiUrl(existingMetadata.statusUrl ?? statusUrl, "saved statusUrl");
      responseUrl = validateApiUrl(existingMetadata.responseUrl ?? responseUrl, "saved responseUrl");
    }

    const metadata = {
      ...existingMetadata,
      requestId,
      model: MODEL_PATH.slice(1),
      status: config.requestId ? "RESUMED" : "SUBMITTED",
      statusUrl,
      responseUrl,
      output,
      ...(config.requestId ? { resumedAt: timestamp(runtime) } : { submittedAt: timestamp(runtime) }),
      ...(config.requestId
        ? {}
        : {
            input: {
              image: image.summary,
              endImage: endImage?.summary,
              prompt: config.prompt,
              duration: config.duration,
              resolution: config.resolution,
              promptExpansionMode: "balanced",
              safetyChecker: true,
            },
          }),
    };
    await saveMetadata(runtime, metadataFile, metadata, createMetadata);
    log(`fal metadata: ${metadataFile}`);

    await pollForCompletion(runtime, statusUrl, key, controller.signal, deadline, log);
    const result = await fetchJson(runtime, responseUrl, key, { method: "GET" }, controller.signal);
    if (typeof result?.video?.url !== "string" || result.video.url.length === 0) {
      throw new Error("fal result did not include video.url");
    }

    const bytes = await downloadVideo(runtime, result.video.url, output, controller.signal);
    await saveMetadata(runtime, metadataFile, {
      ...metadata,
      status: "COMPLETED",
      completedAt: timestamp(runtime),
      bytes,
      video: result.video,
      expandedPrompt: result.expanded_prompt ?? null,
      timings: result.timings ?? null,
    }, false);
    log(`Saved video: ${output}`);
    return { bytes, metadataFile, output, requestId };
  } catch (error) {
    if (requestId) {
      log(`Resume without resubmitting: ${resumeCommand(requestId, output ?? config.output)}`);
    }
    if (controller.signal.aborted) {
      throw controller.signal.reason;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function main(argv = process.argv.slice(2)) {
  try {
    await run(argv);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  await main();
}
