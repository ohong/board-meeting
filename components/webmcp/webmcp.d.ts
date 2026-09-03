/**
 * Minimal hand-rolled WebMCP typings.
 *
 * WebMCP is not in TypeScript's DOM library yet, and we deliberately avoid the
 * official `webmcp-types` package (no new dependencies + the Devpost rule that a
 * literal `registerTool` implementation must be visible in this repository).
 * Only the surface this app actually uses is typed here.
 *
 * Spec: https://webmachinelearning.github.io/webmcp/
 * `modelContext` moved from `Navigator` to `Document` (webmcp#184, 2026-05-27);
 * the legacy `navigator.modelContext` getter is still probed as a fallback for
 * pre-move Chrome builds (Chrome 149 is the Devpost-stated minimum).
 */

interface WebMCPToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  consequentialHint?: boolean;
}

interface WebMCPToolExecuteOptions {
  signal?: AbortSignal;
}

interface WebMCPToolDescriptor {
  name: string;
  title?: string;
  description: string;
  inputSchema?: object;
  annotations?: WebMCPToolAnnotations;
  execute(input: Record<string, unknown>, options?: WebMCPToolExecuteOptions): Promise<unknown>;
}

interface WebMCPRegisteredTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: object;
  origin?: string;
  annotations?: WebMCPToolAnnotations;
}

interface WebMCPModelContext extends EventTarget {
  registerTool(
    tool: WebMCPToolDescriptor,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ): Promise<void>;
  getTools(options?: { fromOrigins?: string[] }): Promise<WebMCPRegisteredTool[]>;
  executeTool(
    tool: WebMCPRegisteredTool,
    input?: object,
    options?: { signal?: AbortSignal },
  ): Promise<string>;
}

/** Debug flag mirrored onto `window` so the invite panel and manual QA can read it. */
interface BoardMeetingWebMCPDebug {
  supported: boolean;
  tools: string[];
}

declare global {
  interface Document {
    readonly modelContext?: WebMCPModelContext;
  }
  interface Navigator {
    /** Pre-webmcp#184 surface. Probed only as a fallback. */
    readonly modelContext?: WebMCPModelContext;
  }
  interface Window {
    __boardMeetingWebMCP?: BoardMeetingWebMCPDebug;
  }
}

export {};
