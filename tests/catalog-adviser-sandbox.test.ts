import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CATALOG } from "../lib/catalog";

const MODEL_FACING_DEFAULT_TOOLS = [
  "bash",
  "read_file",
  "write_file",
  "web_fetch",
  "web_search",
  "todo",
  "ask_question",
] as const;
const repositoryRoot = process.cwd();
const disableImport = /import\s*\{\s*disableTool\s*\}\s*from\s*["']eve\/tools["']\s*;/;
const disableExport = /export\s+default\s+disableTool\(\)\s*;/;
const gatewayModel = /model\s*:\s*["'][^"']+\/[^"']+["']/;

describe("catalog adviser sandbox", () => {
  it("disables every model-facing default tool for every catalog adviser", () => {
    const missingFiles: string[] = [];
    const invalidFiles: string[] = [];
    const gatewayModels: string[] = [];

    for (const { slug } of CATALOG) {
      const packageRoot = path.join(repositoryRoot, "agent", "subagents", slug);
      const agentSource = readFileSync(path.join(packageRoot, "agent.ts"), "utf8");
      if (gatewayModel.test(agentSource)) gatewayModels.push(slug + "/agent.ts");

      for (const tool of MODEL_FACING_DEFAULT_TOOLS) {
        const relativePath = ["agent", "subagents", slug, "tools", tool + ".ts"].join("/");
        const toolPath = path.join(repositoryRoot, relativePath);
        if (!existsSync(toolPath)) {
          missingFiles.push(relativePath);
          continue;
        }

        const source = readFileSync(toolPath, "utf8");
        if (!disableImport.test(source) || !disableExport.test(source)) {
          invalidFiles.push(relativePath);
        }
      }
    }

    expect(CATALOG).toHaveLength(36);
    expect(missingFiles).toEqual([]);
    expect(invalidFiles).toEqual([]);
    expect(gatewayModels).toEqual([]);
  });
});
