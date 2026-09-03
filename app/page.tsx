import { listPersonas } from "@/lib/server/personas";
import { FIXTURE_PERSONAS } from "@/lib/meeting/fixtures";
import { BoardApp } from "@/components/board-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const personas = await listPersonas();
  // Until persona packages land, fall back to fixture metadata so the UI is workable.
  const catalog = personas.length > 0 ? personas : FIXTURE_PERSONAS;
  return <BoardApp catalog={catalog} />;
}
