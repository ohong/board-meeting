/**
 * The project's model configuration. Every board member declares one of these rather than
 * hardcoding an id, so the whole roster moves together.
 *
 * Board turns run on the cost-efficient tier because latency is what makes the room feel
 * alive: the demo targets a first contribution within 8 seconds and 4 seconds between
 * turns. The secretary runs a tier up — it is called twice per meeting and its output is
 * the artefact the user keeps.
 */
export const BOARD_MODEL = "openai/gpt-5.6-luna";
export const SECRETARY_MODEL = "openai/gpt-5.6-terra";
