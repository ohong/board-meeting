import { z } from "zod";

export const openingPositionSchema = z.object({
  recommendation: z.string(), reasoning: z.string(), concern: z.string(), question: z.string(),
});

export const transcriptLineSchema = z.object({
  speakerId: z.string(), speakerName: z.string(), role: z.enum(["chair", "member", "guest", "system"]),
  text: z.string(), addressedName: z.string().nullable(),
});
const participantSchema = z.object({ id: z.string(), name: z.string(), role: z.enum(["chair", "member", "guest"]), line: z.string() });
export const memberContextSchema = z.object({
  slug: z.string().min(1), briefing: z.string().min(1), phase: z.enum(["selecting", "briefing", "forming", "discussion", "closing", "readout"]),
  transcript: z.array(transcriptLineSchema), position: openingPositionSchema.nullable(), ownStatements: z.array(z.string()), participants: z.array(participantSchema),
});
const directiveSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("open") }), z.object({ type: z.literal("continue") }),
  z.object({ type: z.literal("answer"), fromId: z.string(), fromName: z.string(), question: z.string() }),
  z.object({ type: z.literal("rebut"), targetId: z.string(), targetName: z.string() }),
]);
export const turnSchema = memberContextSchema.extend({ directive: directiveSchema, newContext: z.array(z.string()) });
export const reactMemberSchema = z.object({ slug: z.string().min(1), context: memberContextSchema });
export const reactSchema = z.object({ members: z.array(reactMemberSchema).min(1).max(6), lastSpeakerId: z.string(), lastSpeakerName: z.string(), lastText: z.string() });
export const reactResultSchema = z.object({ reaction: z.enum(["agree", "disagree", "concern", "curious"]).nullable(), urgency: z.number().min(0).max(10), wantsToRebut: z.boolean() });
export const synthesisSchema = z.object({ briefing: z.string(), transcript: z.array(transcriptLineSchema), requestedByName: z.string() });
export const closingCommentSchema = memberContextSchema;
export const closingCommentItemSchema = z.object({ memberId: z.string(), memberName: z.string(), text: z.string(), fallback: z.boolean() });
export const readoutInputSchema = z.object({ briefing: z.string(), transcript: z.array(transcriptLineSchema), members: z.array(z.object({ id: z.string(), name: z.string(), role: z.string() })), closingComments: z.array(closingCommentItemSchema), guestName: z.string().nullable() });
export const readoutSchema = z.object({
  decision: z.string(), recommendation: z.object({ summary: z.string(), divided: z.boolean(), detail: z.string() }),
  options: z.array(z.string()), tradeoffs: z.array(z.string()), assumptions: z.array(z.string()), openQuestions: z.array(z.string()), nextActions: z.array(z.string()),
  closingComments: z.array(closingCommentItemSchema), generatedAt: z.number(), fallback: z.boolean(),
});
