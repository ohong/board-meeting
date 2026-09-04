"use client";

/**
 * WebMCP dev harness — OWNED BY THE WEBMCP WORKSTREAM.
 *
 * Seeds a MeetingSession from the deterministic discussion fixture, mounts the real
 * <WebMCPTools/> against it, and lets you invoke the SAME handler functions that get
 * registered with the browser — with editable JSON inputs and the character length of
 * every result, so the 1,450-character output budget is verifiable without an agent.
 *
 * Because React runs child effects before parent effects, the <WebMCPTools/> mounted
 * here (not the one in app/layout.tsx) owns the eight tool names on this route, so
 * anything a real agent calls here also hits the fixture session.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { MeetingProvider, useMeetingState, useSession } from "@/lib/meeting/context";
import { MeetingSession } from "@/lib/meeting/session";
import { FIXTURES, FIXTURE_PERSONAS, type FixtureName } from "@/lib/meeting/fixtures";
import { WEBMCP_TOOL_NAMES, type WebMcpToolName } from "@/lib/meeting/types";
import { createBoardTools, MAX_OUTPUT_CHARACTERS, WebMCPTools } from "@/components/webmcp/webmcp-tools";
import { InvitePanel } from "@/components/webmcp/invite-panel";

const DEFAULT_INPUTS: Record<WebMcpToolName, string> = {
  list_board_advisers: `{}`,
  launch_board_meeting: `{ "advisers": ["daniel-ek", "david-heinemeier-hansson", "lulu-cheng-meservey"], "briefing": "Should our collaboration product replace its permanent free tier with a 14-day trial?" }`,
  inspect_board_meeting: `{ "transcript_limit": 6, "transcript_offset": 0, "include_briefing": true }`,
  join_board_meeting: `{ "display_name": "Harness Agent" }`,
  contribute_to_board_meeting: `{ "text": "Context the board does not have: our five largest customers each expanded only after a second team was invited into their workspace; median time from first invite to paid was 41 days." }`,
  address_board_member: `{ "member": "Daniel", "text": "Does the invite-to-paid evidence change your view of the free tier?" }`,
  request_board_synthesis: `{ "wait_seconds": 0 }`,
  get_board_meeting_readout: `{ "section": "all" }`,
};

const FIXTURE_NAMES: FixtureName[] = ["discussion", "guest", "forming", "readout", "briefing", "selecting"];

export default function WebMCPDevPage() {
  const [fixture, setFixture] = useState<FixtureName>("discussion");
  // Remounting on fixture change gives a genuinely fresh session + registration.
  return (
    <div className="min-h-screen bg-[#121212] px-6 py-6 text-[#e8e8e8]">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">WebMCP dev harness</h1>
        <label className="text-xs text-[#9e9e9e]">
          fixture{" "}
          <select
            value={fixture}
            onChange={(e) => setFixture(e.target.value as FixtureName)}
            className="rounded border border-[#3a3a3a]/60 bg-[#1c1c1c] px-2 py-1 text-xs text-[#e8e8e8]"
          >
            {FIXTURE_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </header>
      <Harness key={fixture} fixture={fixture} />
    </div>
  );
}

function Harness({ fixture }: { fixture: FixtureName }) {
  const [session] = useState(() => {
    const value = new MeetingSession(FIXTURES[fixture]());
    value.setCatalog(FIXTURE_PERSONAS);
    return value;
  });
  return (
    <MeetingProvider session={session}>
      <WebMCPTools />
      <HarnessBody />
    </MeetingProvider>
  );
}

function HarnessBody() {
  const session = useSession();
  const tools = useMemo(() => createBoardTools(() => session), [session]);
  const [inputs, setInputs] = useState<Record<string, string>>({ ...DEFAULT_INPUTS });
  const [results, setResults] = useState<Record<string, { text: string; length: number }>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [support, setSupport] = useState("checking…");
  const [registered, setRegistered] = useState<string[]>([]);
  const [showInvite, setShowInvite] = useState(false);

  const refreshSupport = useCallback(async () => {
    const mc = document.modelContext ?? navigator.modelContext;
    const ok = typeof mc?.registerTool === "function";
    const surface = document.modelContext ? "document.modelContext" : navigator.modelContext ? "navigator.modelContext" : "none";
    setSupport(
      `${ok ? "supported" : "unsupported"} · surface: ${surface} · data-webmcp=${
        document.documentElement.dataset.webmcp ?? "(unset)"
      } · window flag: ${JSON.stringify(window.__boardMeetingWebMCP ?? null)}`,
    );
    if (ok && mc && typeof mc.getTools === "function") {
      try {
        const list = await mc.getTools();
        setRegistered(list.map((t) => t.name));
      } catch (error) {
        setRegistered([`getTools() failed: ${String(error)}`]);
      }
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void refreshSupport(), 400);
    return () => window.clearTimeout(id);
  }, [refreshSupport]);

  const run = useCallback(
    async (name: WebMcpToolName) => {
      setRunning(name);
      let parsed: Record<string, unknown> = {};
      const raw = (inputs[name] ?? "").trim();
      if (raw) {
        try {
          parsed = JSON.parse(raw) as Record<string, unknown>;
        } catch (error) {
          setResults((r) => ({ ...r, [name]: { text: `Invalid JSON input: ${String(error)}`, length: 0 } }));
          setRunning(null);
          return;
        }
      }
      const result = await tools[name].execute(parsed);
      const serialized = JSON.stringify(result);
      setResults((r) => ({
        ...r,
        [name]: { text: JSON.stringify(result, null, 2), length: serialized?.length ?? 0 },
      }));
      setRunning(null);
    },
    [inputs, tools],
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-4">
        <section className="rounded-lg border border-[#3a3a3a]/50 bg-[#1a1a1a] p-3 text-xs">
          <div className="flex items-center justify-between gap-3">
            <strong className="text-[#f2f2f2]">Browser site-tool status</strong>
            <button
              type="button"
              onClick={() => void refreshSupport()}
              className="rounded border border-[#8a8a8a]/60 px-2 py-0.5 text-[12px] text-[#ededed]"
            >
              refresh
            </button>
          </div>
          <p className="mt-1 break-all text-[#b0b0b0]">{support}</p>
          <p className="mt-1 text-[#b0b0b0]">
            getTools(): {registered.length ? registered.join(", ") : "(none / unsupported)"}
          </p>
          <p className="mt-1 text-[#8a8a8a]">Output budget: {MAX_OUTPUT_CHARACTERS} JSON characters per result.</p>
        </section>

        {WEBMCP_TOOL_NAMES.map((name) => {
          const tool = tools[name];
          const result = results[name];
          const over = (result?.length ?? 0) > MAX_OUTPUT_CHARACTERS;
          return (
            <section key={name} className="rounded-lg border border-[#3a3a3a]/50 bg-[#1a1a1a] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <code className="text-[13px] font-semibold text-[#f2f2f2]">{name}</code>
                <span className="text-[12px] uppercase tracking-wider text-[#8a8a8a]">
                  {tool.annotations.readOnlyHint ? "read-only" : "mutating"}
                </span>
                <span className="text-[12px] text-[#8a8a8a]">description: {tool.description.length} chars</span>
                <button
                  type="button"
                  disabled={running === name}
                  onClick={() => void run(name)}
                  className="ml-auto rounded border border-[#8a8a8a]/70 bg-[#2a2a2a] px-3 py-1 text-xs text-[#ededed] disabled:opacity-50"
                >
                  {running === name ? "running…" : "run"}
                </button>
              </div>
              <textarea
                value={inputs[name] ?? ""}
                onChange={(e) => setInputs((v) => ({ ...v, [name]: e.target.value }))}
                spellCheck={false}
                rows={2}
                className="mt-2 w-full rounded border border-[#3a3a3a]/40 bg-[#141414] p-2 font-mono text-[12px] text-[#e0e0e0]"
              />
              {result ? (
                <>
                  <p className={`mt-2 text-[12px] ${over ? "text-[#e08b80]" : "text-[#7fbf95]"}`}>
                    result length: {result.length} chars {over ? "— OVER BUDGET" : "— within budget"}
                  </p>
                  <pre className="mt-1 max-h-72 overflow-auto rounded border border-[#3a3a3a]/30 bg-[#0f0f0f] p-2 font-mono text-[12px] leading-relaxed text-[#cfcfcf]">
                    {result.text}
                  </pre>
                </>
              ) : null}
            </section>
          );
        })}
      </div>

      <aside className="space-y-3">
        <button
          type="button"
          onClick={() => setShowInvite((v) => !v)}
          className="w-full rounded border border-[#8a8a8a]/60 bg-[#2a2a2a] px-3 py-2 text-xs text-[#ededed]"
        >
          {showInvite ? "Hide invite panel" : "Show invite panel"}
        </button>
        {showInvite ? <InvitePanel onClose={() => setShowInvite(false)} /> : null}
        <TranscriptMirror />
      </aside>
    </div>
  );
}

/** Cheap live view of the shared session so tool side effects are visible here too. */
function TranscriptMirror() {
  const state = useMeetingState();
  return (
    <section className="rounded-lg border border-[#3a3a3a]/50 bg-[#1a1a1a] p-3 text-[12px] text-[#cfcfcf]">
      <p className="mb-2 text-[#f2f2f2]">
        phase: {state.phase} · guest: {state.guest ? `${state.guest.name} (${state.guest.status})` : "empty"} · queue:{" "}
        {state.queue.length}
      </p>
      <div className="max-h-96 space-y-2 overflow-auto">
        {state.transcript.map((entry) => (
          <p key={entry.id}>
            <span className="text-[#8a8a8a]">
              {entry.kind === "message"
                ? entry.speakerName
                : entry.kind === "synthesis"
                  ? "Secretary"
                  : "System"}
              :{" "}
            </span>
            {entry.text}
          </p>
        ))}
      </div>
    </section>
  );
}
