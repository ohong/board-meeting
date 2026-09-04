import { z } from "zod";

import { CATALOG } from "../catalog";

export const ADVISER_COUNT = 36;
export const ADVISER_SLUGS = CATALOG.map(({ slug }) => slug);
const adviserSlugSet = new Set(ADVISER_SLUGS);

if (CATALOG.length !== ADVISER_COUNT || adviserSlugSet.size !== ADVISER_COUNT) {
  throw new Error(
    `The board runtime requires exactly ${ADVISER_COUNT} unique declared advisers; found ${CATALOG.length} catalog rows and ${adviserSlugSet.size} unique slugs.`,
  );
}

export const adviserSlugSchema = z
  .string()
  .refine((slug) => adviserSlugSet.has(slug), "Unknown adviser slug.");

export const memberCapabilitySchema = z.enum([
  "formOpeningPosition",
  "publicTurn",
  "answerDirect",
  "closingComment",
]);
export const secretaryCapabilitySchema = z.enum(["synthesis", "readout"]);
export const runtimeCapabilitySchema = z.union([
  memberCapabilitySchema,
  secretaryCapabilitySchema,
]);

export const transcriptEventSchema = z
  .object({
    id: z.string().min(1).max(200),
    kind: z.enum(["message", "system", "reaction"]),
    speakerId: z.string().min(1).max(200),
    speakerName: z.string().min(1).max(200),
    text: z.string().max(20_000),
    addressedTo: z.string().max(200).optional(),
    reaction: z.enum(["agree", "concern", "disagree", "want_to_respond"]).optional(),
    createdAt: z.number().finite(),
  })
  .strict();

export const openingPositionSchema = z
  .object({
    memberId: adviserSlugSchema,
    recommendation: z.string().min(1).max(4_000),
    reasoning: z.string().min(1).max(4_000),
    concern: z.string().min(1).max(4_000),
    question: z.string().min(1).max(4_000),
  })
  .strict();

export const memberTurnSchema = z
  .object({
    text: z
      .string()
      .min(1)
      .max(4_000)
      .refine(
        (text) => text.trim().split(/\s+/u).length <= 90,
        "Public turns must not exceed 90 words.",
      ),
    addressedTo: z.string().max(200).optional(),
    reaction: z.enum(["agree", "concern", "disagree", "want_to_respond"]).optional(),
    reactionFrom: z.string().max(200).optional(),
    wantsToRespond: z.string().max(200).optional(),
  })
  .strict();

export const textResultSchema = z.object({ text: z.string().min(1).max(12_000) }).strict();

export const closingCommentSchema = z
  .object({
    memberId: adviserSlugSchema,
    name: z.string().min(1).max(200),
    comment: z.string().min(1).max(4_000),
  })
  .strict();

export const executiveReadoutCoreSchema = z
  .object({
    decision: z.string().min(1).max(8_000),
    recommendation: z.string().min(1).max(8_000),
    divided: z.boolean(),
    options: z.array(z.string().max(4_000)).max(50),
    tradeoffs: z.array(z.string().max(4_000)).max(50),
    assumptions: z.array(z.string().max(4_000)).max(50),
    openQuestions: z.array(z.string().max(4_000)).max(50),
    nextActions: z.array(z.string().max(4_000)).max(50),
  })
  .strict();

const phaseSchema = z.enum(["idle", "opening", "discussion", "ending", "closed"]);
const boardNamesSchema = z.array(z.string().min(1).max(200)).min(1).max(6);
const sharedTurnFields = {
  briefing: z.string().min(1).max(40_000),
  phase: phaseSchema,
  transcript: z.array(transcriptEventSchema).max(500),
  ownPriorStatements: z.array(z.string().max(4_000)).max(100),
  boardNames: boardNamesSchema,
};

function memberInputSchema<TCapability extends z.infer<typeof memberCapabilitySchema>>(
  capability: TCapability,
) {
  return z
    .object({
      ...sharedTurnFields,
      capability: z.literal(capability),
      memberId: adviserSlugSchema,
      memberName: z.string().min(1).max(200),
      privatePosition: openingPositionSchema.optional(),
      addressedTo: z.string().max(4_000).optional(),
      prompt: z.string().max(20_000).optional(),
    })
    .strict();
}

export const synthesisInputSchema = z
  .object({ ...sharedTurnFields, capability: z.literal("synthesis") })
  .strict();

export const readoutInputSchema = z
  .object({
    briefing: z.string().min(1).max(40_000),
    transcript: z.array(transcriptEventSchema).max(500),
    closingComments: z.array(closingCommentSchema).min(1).max(6),
    boardNames: boardNamesSchema,
  })
  .strict();

export const memberTurnRequestSchema = z.discriminatedUnion("capability", [
  z.object({ capability: z.literal("formOpeningPosition"), input: memberInputSchema("formOpeningPosition") }).strict(),
  z.object({ capability: z.literal("publicTurn"), input: memberInputSchema("publicTurn") }).strict(),
  z.object({ capability: z.literal("answerDirect"), input: memberInputSchema("answerDirect") }).strict(),
  z.object({ capability: z.literal("closingComment"), input: memberInputSchema("closingComment") }).strict(),
]);

export const secretaryTurnRequestSchema = z.discriminatedUnion("capability", [
  z.object({ capability: z.literal("synthesis"), input: synthesisInputSchema }).strict(),
  z.object({ capability: z.literal("readout"), input: readoutInputSchema }).strict(),
]);

export const memberTurnApiRequestSchema = z.union([
  memberTurnRequestSchema,
  secretaryTurnRequestSchema,
]);

export const routingEnvelopeSchema = z
  .object({
    version: z.literal(1),
    capability: runtimeCapabilitySchema,
    target: z.union([adviserSlugSchema, z.literal("secretary")]),
    message: z.string().min(1).max(220_000),
  })
  .strict()
  .superRefine((value, ctx) => {
    const expectedTarget = secretaryCapabilitySchema.safeParse(value.capability).success
      ? "secretary"
      : value.target;
    if (secretaryCapabilitySchema.safeParse(value.capability).success && value.target !== expectedTarget) {
      ctx.addIssue({ code: "custom", message: "Secretary capabilities must target secretary.", path: ["target"] });
    }
    if (memberCapabilitySchema.safeParse(value.capability).success && value.target === "secretary") {
      ctx.addIssue({ code: "custom", message: "Member capabilities must target an adviser.", path: ["target"] });
    }
  });

export const boardWorkflowResultSchema = z
  .object({
    capability: runtimeCapabilitySchema,
    target: z.union([adviserSlugSchema, z.literal("secretary")]),
    result: z.unknown(),
  })
  .strict();

export function outputSchemaForCapability(capability: z.infer<typeof runtimeCapabilitySchema>) {
  switch (capability) {
    case "formOpeningPosition":
      return openingPositionSchema;
    case "publicTurn":
    case "answerDirect":
      return memberTurnSchema;
    case "closingComment":
    case "synthesis":
      return textResultSchema;
    case "readout":
      return executiveReadoutCoreSchema;
  }
}

export function outputJsonSchemaForCapability(capability: z.infer<typeof runtimeCapabilitySchema>) {
  return z.toJSONSchema(outputSchemaForCapability(capability));
}

export const boardWorkflowResultJsonSchema = z.toJSONSchema(boardWorkflowResultSchema);
