import { defineTool } from "eve/tools";
import { agent } from "eve/workflow";
import { z } from "zod";

import {
  boardWorkflowResultJsonSchema,
  constrainPublicTurn,
  outputJsonSchemaForCapability,
  outputSchemaForCapability,
  routingEnvelopeSchema,
  runtimeCapabilitySchema,
} from "../../lib/runtime/schemas";

const inputSchema = z
  .object({
    capability: runtimeCapabilitySchema,
    target: z.string().min(1).max(200),
    message: z.string().min(1).max(220_000),
  })
  .strict();
type AgentOutputSchema = NonNullable<Parameters<typeof agent>[1]["outputSchema"]>;

export default defineTool({
  description:
    "Route one immutable board capability request to the exact adviser or secretary named by the caller.",
  inputSchema,
  outputSchema: boardWorkflowResultJsonSchema,
  async execute(input, ctx) {
    "use workflow";

    const envelope = routingEnvelopeSchema.parse({ version: 1, ...input });
    const returnsPlainText =
      envelope.capability === "publicTurn" ||
      envelope.capability === "answerDirect" ||
      envelope.capability === "closingComment" ||
      envelope.capability === "synthesis";
    const result = await agent(ctx, {
      key: "board-runtime-delegation",
      target: envelope.target,
      message: envelope.message,
      ...(returnsPlainText
        ? {}
        : {
            outputSchema: outputJsonSchemaForCapability(
              envelope.capability,
            ) as AgentOutputSchema,
          }),
    });

    const plainText = typeof result === "string" ? result.trim() : "";
    const validatedResult =
      envelope.capability === "publicTurn" || envelope.capability === "answerDirect"
        ? outputSchemaForCapability(envelope.capability).parse({
            text: constrainPublicTurn(plainText),
          })
        : envelope.capability === "closingComment" || envelope.capability === "synthesis"
          ? outputSchemaForCapability(envelope.capability).parse({ text: plainText })
          : outputSchemaForCapability(envelope.capability).parse(result);

    return {
      capability: envelope.capability,
      target: envelope.target,
      result: validatedResult,
    };
  },
});
