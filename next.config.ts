import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Persona packages are read from disk at runtime by route handlers and the catalog page.
  outputFileTracingIncludes: {
    "/**": ["./agent/**/*"],
  },
};

export default nextConfig;
