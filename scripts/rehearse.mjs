/**
 * Rehearses the exact two-minute demo script against a running dev server, five times in a
 * row, each in a genuinely fresh browser context. Every step of the golden path is asserted,
 * including the WebMCP sequence, which it drives by registering a stand-in `document.modelContext`
 * and calling the site tools the page registers — the same handlers a real agent would call.
 *
 *   bun dev                       # in one terminal
 *   bunx playwright install chromium   # once
 *   bun run rehearse              # in another
 *
 * Set BOARD_URL to point at a deployment instead of localhost.
 */
import { chromium } from "playwright";

const CODEX_CONTEXT =
  "Seven of our last ten enterprise wins first entered through a free workspace shared by an existing user. Those accounts now represent 22% of ARR.";

const BASE_URL = process.env.BOARD_URL ?? "http://localhost:3000";
const RUNS = Number(process.env.REHEARSALS ?? 5);
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
let failures = 0;

for (let run = 1; run <= RUNS; run += 1) {
  // A genuinely fresh session: new context, new page, nothing carried over.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.addInitScript(() => {
    window.__tools = new Map();
    document.modelContext = { registerTool(t) { window.__tools.set(t.name, t); } };
    window.__call = async (n, a = {}) => (await window.__tools.get(n).execute(a)).content[0].text;
  });

  const checks = [];
  const check = (label, ok) => { checks.push(`${ok ? "ok  " : "FAIL"} ${label}`); if (!ok) failures += 1; };
  const t0 = Date.now();

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  check("opens on board selection", (await page.locator("h1").first().innerText()).includes("Who do you want in the room"));

  for (const q of ["Ek", "DHH", "Lulu"]) {
    await page.fill('input[placeholder*="Find a founder"]', q);
    await page.waitForTimeout(120);
    await page.locator("button[aria-pressed]").first().click();
  }
  await page.fill('input[placeholder*="Find a founder"]', "");
  await page.waitForTimeout(150);
  check("three advisers seated", (await page.locator('button[aria-pressed="true"]').count()) === 3);

  await page.getByRole("button", { name: "Brief your board" }).click();
  await page.getByRole("button", { name: "Use the pricing decision" }).click();
  await page.getByRole("button", { name: "Start board meeting" }).click();

  await page.waitForSelector("text=Add context or call on someone", { timeout: 45000 });
  const opened = (Date.now() - t0) / 1000;

  await page.waitForFunction(() => document.querySelectorAll("article.minutes-entry").length >= 3, { timeout: 60000 });
  const minutes = await page.locator("section[aria-label='Minutes']").innerText();
  check("all three advisers spoke", ["Daniel Ek", "David Heinemeier Hansson", "Lulu Cheng Meservey"].every((n) => minutes.includes(n)));
  check("a rebuttal is addressed to someone", minutes.includes("to Daniel Ek") || minutes.includes("to Lulu Cheng Meservey"));
  check("a reaction is visible", /Pushes back|Agrees|Reconsidering/i.test(minutes));

  const composer = page.locator('textarea[placeholder*="Add context or call on someone"]');
  await composer.fill("@Lulu how do we explain a free-tier change without losing user trust?");
  await composer.press("Enter");
  await page.waitForFunction(() => {
    const rows = [...document.querySelectorAll(".minutes-entry")].map((d) => d.textContent || "");
    const chair = rows.findIndex((t) => t.includes("@Lulu how do we explain"));
    return chair > -1 && rows.slice(chair + 1).some((t) => t.includes("Lulu Cheng Meservey"));
  }, { timeout: 45000 });
  check("the named adviser answered the mention", true);

  const tools = await page.evaluate(() => [...window.__tools.keys()]);
  check("six site tools registered", tools.length === 6);

  const joined = JSON.parse(await page.evaluate(() => window.__call("join_board_meeting", { name: "Codex" })));
  check("guest joined under its own name", joined.ok === true);
  await page.waitForTimeout(1000);
  check("guest seat activated", (await page.locator("text=Guest agent · WebMCP").count()) >= 1);

  const contributed = JSON.parse(await page.evaluate((t) => window.__call("contribute_to_board_meeting", { text: t }), CODEX_CONTEXT));
  check("guest contributed context", contributed.ok === true);

  const addressed = JSON.parse(await page.evaluate(() =>
    window.__call("address_board_member", { member: "Daniel Ek", text: "Does that change your view of killing the free tier?" })));
  check("addressed adviser answered", addressed.ok === true && addressed.message.length > 80);

  const synthesis = JSON.parse(await page.evaluate(() => window.__call("request_board_synthesis")));
  check("interim synthesis returned", synthesis.ok === true);
  check("synthesis did not end the meeting", (await page.getByRole("button", { name: "End meeting" }).count()) === 1);

  const early = JSON.parse(await page.evaluate(() => window.__call("get_board_meeting_readout")));
  check("readout refused before the chair ends it", early.ready === false);

  await page.getByRole("button", { name: "End meeting" }).click();
  await page.waitForSelector("text=Board readout", { timeout: 60000 });
  const readoutText = await page.locator("main").innerText();
  const SECTIONS = ["Options considered", "Key tradeoffs", "Important assumptions", "Open questions",
    "Recommended next actions", "Closing comments"];
  check("readout has every section", SECTIONS.every((s) => readoutText.toLowerCase().includes(s.toLowerCase())));
  check("the decision and recommendation lead the page", readoutText.includes("free tier") && readoutText.includes("Board readout"));
  check("dissent preserved", readoutText.includes("The board remains divided"));
  check("every adviser has a closing comment", ["Daniel Ek", "David Heinemeier Hansson", "Lulu Cheng Meservey"].every((n) => readoutText.includes(n)));

  const memo = await page.evaluate(() => window.__call("get_board_meeting_readout"));
  check("guest retrieved the memo", memo.includes("BOARD RECOMMENDATION"));
  await page.waitForTimeout(300);
  check("retrieval confirmed on screen", (await page.locator("text=Retrieved by Codex").count()) === 1);

  await page.reload({ waitUntil: "networkidle" });
  check("refresh starts a new meeting", (await page.locator("h1").first().innerText()).includes("Who do you want in the room"));
  check("no page errors", errors.length === 0);

  const total = ((Date.now() - t0) / 1000).toFixed(1);
  const bad = checks.filter((c) => c.startsWith("FAIL"));
  console.log(`run ${run}: ${bad.length ? bad.join(" | ") : `all ${checks.length} checks passed`}  (positions closed +${opened.toFixed(1)}s, full script ${total}s)`);
  if (errors.length) console.log("  errors:", errors);
  await context.close();
}

await browser.close();
console.log(failures === 0 ? `\n${RUNS} consecutive fresh-session rehearsals passed.` : `\n${failures} checks failed.`);
process.exit(failures === 0 ? 0 : 1);
