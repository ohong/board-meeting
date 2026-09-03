# Board-member agents

Each directory under `subagents/` is one board member, laid out as a Vercel eve declared subagent
(`agent.ts` + `instructions.md`). The web app loads `instructions.md` and `persona.json` directly
through `lib/server/personas.ts`; the `agent.ts` files let `eve` discover the same agents unchanged.

See `docs/persona-package.md` for the package contract.
