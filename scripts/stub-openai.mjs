/**
 * A stand-in OpenAI Responses API that speaks like a board.
 *
 * It exists so the entire live path can be exercised without a key: the API route's SSE
 * encoding, the browser runtime's event-stream reader, the provider, the streaming
 * transport and the parsing. The deterministic mock runtime bypasses all of that, so
 * without this the code the demo actually runs on is never executed end to end.
 *
 *   node scripts/stub-openai.mjs --port 8787
 *   OPENAI_API_KEY=stub OPENAI_BASE_URL=http://127.0.0.1:8787 bun dev
 *   BOARD_URL=http://localhost:3000 bun run rehearse
 */
import { createServer } from "node:http";

const port = Number(process.argv[process.argv.indexOf("--port") + 1] || 8787);

const TURNS = {
  "Daniel Ek": [
    "[to: -; reaction: concern; next: David Heinemeier Hansson]\nI would not run this as a binary kill. Measure whether shared workspaces convert differently from solo ones before you close the front door. A trial is cleaner to operate and it can amputate the discovery loop that produced a third of your customers.",
    "[to: David Heinemeier Hansson; reaction: concern; next: -]\nDavid, I will give you the support number. But you are pricing the funnel at zero and it produced the customers you now want to protect. Narrow it to invite-only and you keep the loop without the crowd.",
  ],
  "David Heinemeier Hansson": [
    "[to: Daniel Ek; reaction: disagree; next: Lulu Cheng Meservey]\nDaniel, a leaky funnel is not a strategy. You are eighteen people hosting six thousand tourists who file thirty-eight percent of the tickets. Charge. Fourteen days is generous.",
    "[to: -; reaction: disagree; next: -]\nInvite-only free is still free with paperwork. Someone has to build it, gate it and support it. Ship the trial and spend the week you get back on the customers you already have.",
  ],
  "Lulu Cheng Meservey": [
    "[to: You; reaction: agree; next: -]\nYou can kill free and still lose. The move is not the price, it is the sentence people repeat on Monday. Say you are done hosting work you cannot stand behind and that reads as adult.",
    "[to: You; reaction: agree; next: -]\nThen say exactly that, and say it to the six thousand before it leaks from the four hundred and twenty. Grandfather anyone with real work in a workspace.",
  ],
};

const CLOSING = {
  "Daniel Ek": "Measure the shared-workspace path before you burn it. You can always close the door later; you cannot reopen word of mouth.",
  "David Heinemeier Hansson": "Kill free. Charge. Fourteen days. Stop hosting six thousand people who are not the business.",
  "Lulu Cheng Meservey": "Write the sentence first and send it to your best customer before you send it to everyone.",
};

const spoken = new Map();

/**
 * Only the speaking member's own package is in the system prompt, and every package opens
 * with "# <Name>". Matching that heading is exact — matching a bare name is not, because
 * every turn prompt also lists the rest of the table.
 */
function memberFrom(body) {
  for (const name of Object.keys(TURNS)) if (body.includes(`# ${name}`)) return name;
  return null;
}

function reply(body) {
  if (body.includes("Form your private opening position")) {
    // Opening positions run before any turn, so this is a fresh meeting: hand every script back.
    spoken.clear();
    return JSON.stringify({
      recommendation: "Do not touch it until the discovery path is measured.",
      reasoning: "The numbers cut both ways and nobody has separated them yet.",
      concern: "Closing the front door on the channel that produced the customers.",
      question: "Do shared workspaces convert differently from solo ones?",
    });
  }
  if (body.includes("Write the executive readout")) {
    return JSON.stringify({
      decision: "Whether to eliminate the free tier and replace it with a 14-day trial.",
      recommendation:
        "The board is divided. David Heinemeier Hansson would eliminate the free tier now. Daniel Ek would not touch it until shared-workspace discovery is measured. Lulu Cheng Meservey treats the announcement, not the pricing, as the binding constraint.",
      divided: true,
      options: [
        "Eliminate the free tier now and replace it with a 14-day trial",
        "Keep a narrowed, invite-only free workspace",
        "Grandfather existing free workspaces and trial every new one",
      ],
      tradeoffs: [
        "Support load against top-of-funnel discovery",
        "Faster paid conversion against the word of mouth that produced 34% of customers",
      ],
      assumptions: ["Free is a material source of discovery", "Free is a material source of support cost"],
      openQuestions: ["Do shared free workspaces convert differently from solo ones?"],
      nextActions: [
        "Tag the last ten enterprise wins by how the first workspace was created",
        "Draft and pressure-test the announcement before touching billing",
      ],
    });
  }

  const member = memberFrom(body);
  if (body.includes("closing comment")) {
    return CLOSING[member] ?? "Run the smallest reversible version of this and decide what would stop you.";
  }
  if (body.includes("interim synthesis")) {
    return "Agreement: the free tier as it stands is operationally expensive. Disagreement: Ek treats it as a discovery engine worth measuring, DHH as a crowd you should stop hosting. Unresolved: what the change costs in trust.";
  }

  const script = TURNS[member];
  if (!script) return "[to: -; reaction: none; next: -]\nI would test the load-bearing assumption before committing to either path.";
  const index = spoken.get(member) ?? 0;
  spoken.set(member, index + 1);
  // Answering a direct question always earns a reply; otherwise pass once the script runs out.
  if (index >= script.length) return body.includes("addressed directly") ? script[script.length - 1] : "[pass]";
  return script[index];
}

const message = (text) => ({
  type: "message",
  id: "msg_1",
  role: "assistant",
  status: "completed",
  content: [{ type: "output_text", text, annotations: [] }],
});

const envelope = (text, status) => ({
  id: "resp_1",
  object: "response",
  created_at: 1,
  status,
  model: "stub",
  output: status === "completed" ? [message(text)] : [],
  usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
  incomplete_details: null,
});

createServer((request, response) => {
  let body = "";
  request.on("data", (chunk) => {
    body += chunk;
  });
  request.on("end", () => {
    const streaming = body.includes('"stream":true');
    const text = reply(body);

    if (!streaming) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(envelope(text, "completed")));
      return;
    }

    response.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });
    const send = (event) => response.write(`data: ${JSON.stringify(event)}\n\n`);
    send({ type: "response.created", response: envelope("", "in_progress") });
    send({
      type: "response.output_item.added",
      output_index: 0,
      item: { type: "message", id: "msg_1", role: "assistant", status: "in_progress", content: [] },
    });
    let index = 0;
    // Streamed in small pieces at a human pace, so timing and boundaries are realistic.
    const tick = setInterval(() => {
      if (index >= text.length) {
        clearInterval(tick);
        send({ type: "response.output_text.done", item_id: "msg_1", output_index: 0, content_index: 0, text });
        send({ type: "response.output_item.done", output_index: 0, item: message(text) });
        send({ type: "response.completed", response: envelope(text, "completed") });
        response.end();
        return;
      }
      send({
        type: "response.output_text.delta",
        item_id: "msg_1",
        output_index: 0,
        content_index: 0,
        delta: text.slice(index, index + 12),
      });
      index += 12;
    }, 12);
  });
}).listen(port, "127.0.0.1", () => {
  console.log(`stub OpenAI Responses API on http://127.0.0.1:${port}`);
});
