import { BoardApp } from "@/components/board-app";
import { FIXTURE_PERSONAS } from "@/lib/meeting/fixtures";
import { listPersonas } from "@/lib/server/personas";

export const dynamic = "force-dynamic";

export default async function SharedMeetingPage() {
  const personas = await listPersonas();
  const catalog = personas.length > 0 ? personas : FIXTURE_PERSONAS;
  return <BoardApp catalog={catalog} />;
}
