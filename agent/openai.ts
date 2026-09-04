import { createOpenAI } from "@ai-sdk/openai";
import {
  Agent,
  fetch as undiciFetch,
  type RequestInfo,
  type RequestInit,
} from "undici";

// Eve runs concurrent agents in one process. Keeping those requests on HTTP/1.1
// prevents one failed shared HTTP/2 session from poisoning unrelated turns.
const openAIDispatcher = new Agent({ allowH2: false });

const fetchOverHttp1: typeof globalThis.fetch = async (input, init) => {
  const response = await undiciFetch(input as unknown as RequestInfo, {
    ...(init as unknown as RequestInit),
    dispatcher: openAIDispatcher,
  });

  return response as unknown as Response;
};

export const openai = createOpenAI({ fetch: fetchOverHttp1 });
