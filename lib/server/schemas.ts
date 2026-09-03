import { z } from "zod";

const short = z.string().max(600);
export const openingPositionSchema = z.object({
  recommendation: short, reasoning: short, concern: short, question: short,
});

export const transcriptLineSchema = z.object({
  speakerId: z.string().max(80), speakerName: z.string().max(80), role: z.enum(["chair", "member", "guest", "system"]),
  text: z.string().max(2000), addressedName: z.string().max(80).nullable(),
});
const participantSchema = z.object({ id: z.string().max(80), name: z.string().max(80), role: z.enum(["chair", "member", "guest"]), line: z.string().max(200) });
export const memberContextSchema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/), briefing: z.string().min(1).max(6000), phase: z.enum(["selecting", "briefing", "forming", "discussion", "closing", "readout"]),
  transcript: z.array(transcriptLineSchema).max(120), position: openingPositionSchema.nullable(), ownStatements: z.array(z.string().max(2000)).max(40), participants: z.array(participantSchema).max(10),
});
const directiveSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("open") }), z.object({ type: z.literal("continue") }),
  z.object({ type: z.literal("answer"), fromId: z.string().max(80), fromName: z.string().max(80), question: z.string().max(2000) }),
  z.object({ type: z.literal("rebut"), targetId: z.string().max(80), targetName: z.string().max(80) }),
]);
export const turnSchema = memberContextSchema.extend({ directive: directiveSchema, newContext: z.array(z.string().max(2000)).max(12) });
export const reactMemberSchema = z.object({ slug: z.string().min(1), context: memberContextSchema });
export const reactSchema = z.object({ members: z.array(reactMemberSchema).min(1).max(6), lastSpeakerId: z.string().max(80), lastSpeakerName: z.string().max(80), lastText: z.string().max(2000) });
export const reactResultSchema = z.object({ reaction: z.enum(["agree", "disagree", "concern", "curious"]).nullable(), urgency: z.number().min(0).max(10), wantsToRebut: z.boolean() });
export const synthesisSchema = z.object({ briefing: z.string().max(6000), transcript: z.array(transcriptLineSchema).max(120), requestedByName: z.string().max(80) });
export const closingCommentSchema = memberContextSchema;
export const closingCommentItemSchema = z.object({ memberId: z.string().max(80), memberName: z.string().max(80), text: z.string().max(2000), fallback: z.boolean() });
export const readoutInputSchema = z.object({ briefing: z.string().max(6000), transcript: z.array(transcriptLineSchema).max(120), members: z.array(z.object({ id: z.string().max(80), name: z.string().max(80), role: z.string().max(200) })).max(6), closingComments: z.array(closingCommentItemSchema).max(6), guestName: z.string().max(80).nullable() });
export const readoutSchema = z.object({
  decision: z.string(), recommendation: z.object({ summary: z.string(), divided: z.boolean(), detail: z.string() }),
  options: z.array(z.string()), tradeoffs: z.array(z.string()), assumptions: z.array(z.string()), openQuestions: z.array(z.string()), nextActions: z.array(z.string()),
  closingComments: z.array(closingCommentItemSchema), generatedAt: z.number(), fallback: z.boolean(),
});
