// Fails the deploy if a secret would ship inside the Worker bundle.
//
// OpenNext inlines every .env* file it finds into .open-next/cloudflare/next-env.mjs, which
// is uploaded with the Worker. The API key therefore belongs in .dev.vars (local) and in
// `wrangler secret put` (production) — never in .env, .env.local, or .env.production.
// This has regressed twice, so the check is wired into `bun run deploy`.

import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BUNDLE = path.join(ROOT, ".open-next");

// Values that must never appear in the bundle: everything assigned in a local env file.
async function secretsFromEnvFiles() {
  const names = (await fs.readdir(ROOT)).filter((f) => f.startsWith(".env") || f === ".dev.vars");
  const values = new Map();
  for (const name of names) {
    if (name === ".env.example") continue;
    const text = await fs.readFile(path.join(ROOT, name), "utf8").catch(() => "");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (!m) continue;
      const [, key, raw] = m;
      const value = raw.replace(/^["']|["']$/g, "");
      // Short or obviously non-secret values (NEXTJS_ENV=production) are not worth matching.
      if (value.length < 20) continue;
      values.set(value, `${key} (from ${name})`);
    }
  }
  return values;
}

async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const secrets = await secretsFromEnvFiles();
const findings = [];

for await (const file of walk(BUNDLE)) {
  let text;
  try {
    text = await fs.readFile(file, "utf8");
  } catch {
    continue; // binary asset
  }
  const rel = path.relative(ROOT, file);
  for (const [value, label] of secrets) {
    if (text.includes(value)) findings.push(`${rel}: contains ${label}`);
  }
  // Generic provider-key shapes, in case the value never passed through an env file.
  for (const m of text.matchAll(/\b(sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})/g)) {
    findings.push(`${rel}: contains a key-shaped string (${m[1].slice(0, 8)}…)`);
  }
}

if (findings.length > 0) {
  console.error("\nSecret found in the deploy bundle — refusing to deploy:\n");
  for (const f of [...new Set(findings)]) console.error(`  ${f}`);
  console.error(`
Cause: OpenNext inlines .env* files into the bundle.
Fix:   remove the key from every .env* file. Put it in .dev.vars for local runs
       (it feeds both \`next dev\` and \`bun run preview\`) and use
       \`bunx wrangler secret put OPENAI_API_KEY\` for production.
       See docs/deployment.md > Secrets.
`);
  process.exit(1);
}

console.log(`check-no-secrets: clean (${secrets.size} local secret value(s) checked)`);
