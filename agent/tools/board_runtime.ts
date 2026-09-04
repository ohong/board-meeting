import { Buffer } from "node:buffer";
import { defineTool } from "eve/tools";
import type { agent as AgentFunction } from "eve/workflow";
import { z } from "zod";

import {
  boardWorkflowResultJsonSchema,
  outputJsonSchemaForCapability,
  outputSchemaForCapability,
  routingEnvelopeSchema,
} from "../../lib/runtime/schemas";

const inputSchema = z.object({ routingEnvelope: z.string().min(1) }).strict();
type AgentOutputSchema = NonNullable<Parameters<typeof AgentFunction>[1]["outputSchema"]>;

async function decodeRoutingEnvelope(encoded: string) {
  "use step";

  const decoded = Buffer.from(encoded, "base64url").toString("utf8");
  return routingEnvelopeSchema.parse(JSON.parse(decoded));
}

export default defineTool({
  description:
    "Route one immutable board capability request to the exact adviser or secretary named by the caller.",
  inputSchema,
  outputSchema: boardWorkflowResultJsonSchema,
  async execute({ routingEnvelope }, ctx) {
    "use workflow";

    const envelope = await decodeRoutingEnvelope(routingEnvelope);
    // Eve 0.51's neutral workflow bundler warns on the documented static
    // subpath import even though it deliberately emits that import as an
    // external. Keeping the same public entrypoint computed avoids the false
    // unresolved-import diagnostic without reaching into Eve internals.
    const workflowModule: typeof import("eve/workflow") = await import(
      ["eve", "workflow"].join("/")
    );
    const { agent } = workflowModule;
    const streamsPublicText =
      envelope.capability === "publicTurn" || envelope.capability === "answerDirect";
    const result = await agent(ctx, {
      key: "board-runtime-delegation",
      target: envelope.target,
      message: envelope.message,
      ...(streamsPublicText
        ? {}
        : {
            outputSchema: outputJsonSchemaForCapability(
              envelope.capability,
            ) as AgentOutputSchema,
          }),
    });

    const validatedResult = streamsPublicText
      ? outputSchemaForCapability(envelope.capability).parse({ text: result })
      : outputSchemaForCapability(envelope.capability).parse(result);

    return {
      capability: envelope.capability,
      target: envelope.target,
      result: validatedResult,
    };
  },
});
