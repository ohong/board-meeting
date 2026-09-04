"use client";

import { useEffect, useState } from "react";
import { isAbortError, registerBoardTools } from "@/lib/webmcp";
import type { BoardToolReceipt } from "@/lib/webmcp";
import type { MeetingSession } from "@/lib/session";

export function WebMcpReceiptView({ receipt }: { receipt: BoardToolReceipt }) {
  return (
    <output
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 left-1/2 z-50 max-w-[min(90vw,44rem)] -translate-x-1/2 border border-[var(--rule)] bg-[var(--paper)] px-4 py-2 text-center text-sm text-[var(--paper-ink)] shadow-lg"
    >
      Site tool {receipt.toolName} {receipt.outcome}: {receipt.message}
    </output>
  );
}

export function WebMcpBridge({ session }: { session: MeetingSession }) {
  const [visibleReceipt, setVisibleReceipt] = useState<{
    sequence: number;
    receipt: BoardToolReceipt;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void registerBoardTools(session, {
      signal: controller.signal,
      onReceipt(receipt) {
        if (controller.signal.aborted) return;
        setVisibleReceipt((current) => ({
          sequence: (current?.sequence ?? 0) + 1,
          receipt,
        }));
      },
    }).catch((error: unknown) => {
      controller.abort();
      if (!isAbortError(error)) console.error("Could not register board site tools.", error);
    });
    return () => {
      controller.abort();
    };
  }, [session]);

  return visibleReceipt ? (
    <WebMcpReceiptView key={visibleReceipt.sequence} receipt={visibleReceipt.receipt} />
  ) : null;
}
