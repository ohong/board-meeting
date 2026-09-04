import { hasLiveKey } from "@/lib/runtime/live";

export async function GET() {
  const configured = hasLiveKey();
  const vercelDeployment =
    process.env.VERCEL === "1" && process.env.VERCEL_ENV !== "development";
  const localDevelopment =
    process.env.EVE_DEV === "1" ||
    (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "development");
  return Response.json({
    live: configured,
    configured,
    runtime: configured ? "eve" : "mock",
    availability: configured ? "configured-not-probed" : "mock",
    routeAuth: vercelDeployment
      ? "vercel-oidc"
      : localDevelopment
        ? "local-dev"
        : "default-fail-closed",
    message: configured
      ? "The live Eve board runtime is configured. Each capability runs in an isolated Eve session and delegates to an authored adviser or secretary subagent."
      : "OPENAI_API_KEY is not set. The board is running a deterministic mock so you can test the room, orchestration, and WebMCP. Add OPENAI_API_KEY to configure the live Eve board runtime.",
  });
}
