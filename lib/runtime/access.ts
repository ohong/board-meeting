const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

type RuntimeAccessEnvironment = Readonly<{
  nodeEnv?: string;
  vercel?: string;
}>;

/**
 * The MVP deliberately has no user authentication. Keep server-funded model
 * calls in the development runtime until production has identity and abuse controls.
 */
export function allowsDevelopmentLiveRuntime(
  requestUrl: string,
  environment: RuntimeAccessEnvironment = {
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
  },
): boolean {
  if (environment.vercel === "1") return false;
  const developmentRuntime =
    environment.nodeEnv === "development" || environment.nodeEnv === "test";
  return developmentRuntime && LOOPBACK_HOSTS.has(new URL(requestUrl).hostname);
}
