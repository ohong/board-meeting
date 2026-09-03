"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/meeting/context";
import { createEngine } from "@/lib/meeting/engine";
import { createRuntime } from "@/lib/meeting/runtime";

/** Binds the orchestration engine to the page's session for the life of the page. */
export function EngineBinding() {
  const session = useSession();
  useEffect(() => {
    const engine = createEngine(session, createRuntime());
    return () => engine.dispose();
  }, [session]);
  return null;
}
