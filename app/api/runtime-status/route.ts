import { hasLiveKey } from "@/lib/runtime/live";
import { allowsDevelopmentLiveRuntime } from "@/lib/runtime/access";

type RuntimeStatusOptions = Readonly<{
  configured?: boolean;
  environment?: Readonly<{
    eveDev?: string;
    nodeEnv?: string;
    vercel?: string;
    vercelEnv?: string;
  }>;
}>;

export function createRuntimeStatus(request: Request, options: RuntimeStatusOptions = {}) {
  const configured = options.configured ?? hasLiveKey();
  const environment = options.environment ?? {
    eveDev: process.env.EVE_DEV,
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV,
  };
  const vercelDeployment =
    environment.vercel === "1" && environment.vercelEnv !== "development";
  const localDevelopment =
    environment.eveDev === "1" ||
    (environment.vercel === "1" && environment.vercelEnv === "development");
  const locallyAllowed = allowsDevelopmentLiveRuntime(request.url, {
    nodeEnv: environment.nodeEnv,
    vercel: environment.vercel,
  });
  const live = configured && locallyAllowed;
  return {
    live,
    configured,
    runtime: live ? "eve" : "mock",
    availability: live
      ? "configured-not-probed"
      : configured
        ? "public-live-disabled"
        : "mock",
    routeAuth: vercelDeployment
      ? "vercel-oidc"
      : localDevelopment
        ? "local-dev"
        : "default-fail-closed",
    message: live
      ? "The live Eve board runtime is configured. Each capability runs in an isolated Eve session and delegates to an authored adviser or secretary subagent."
      : configured
        ? "The OpenAI key is configured, but this unauthenticated MVP permits server-funded model calls only from a local demo. This deployment remains in deterministic mock mode."
      : "OPENAI_API_KEY is not set. The board is running a deterministic mock so you can test the room, orchestration, and WebMCP. Add OPENAI_API_KEY to configure the live Eve board runtime.",
  };
}

export async function GET(request: Request) {
  return Response.json(createRuntimeStatus(request));
}
