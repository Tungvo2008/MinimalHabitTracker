import { createHabit, deleteHabit, listHabits, updateHabit } from "../../../server/sqlite";

export async function GET(request: Request) {
  const month = new URL(request.url).searchParams.get("month") ?? "";
  return Response.json({ habits: listHabits(month) });
}
export async function POST(request: Request) {
  const body = await request.json() as { name?: string; emoji?: string; color?: string; frequencyType?: string; frequencyDays?: number[]; frequencyCount?: number; startDate?: string };
  const name = body.name?.trim();
  if (!name) return Response.json({ error: "name is required" }, { status: 400 });
  return Response.json({ habit: createHabit(name, body.emoji ?? "✨", body.color ?? "mint", body.frequencyType ?? "daily", body.frequencyDays ?? [], body.frequencyCount ?? 1, body.startDate ?? "") }, { status: 201 });
}
export async function PATCH(request: Request) {
  const body = await request.json() as { id?: number; name?: string; emoji?: string; color?: string; frequencyType?: string; frequencyDays?: number[]; frequencyCount?: number; startDate?: string; archived?: boolean };
  const name = body.name?.trim();
  if (!body.id || !name) return Response.json({ error: "id and name are required" }, { status: 400 });
  return Response.json({ habit: updateHabit(body.id, name, body.emoji ?? "✨", body.color ?? "mint", body.frequencyType ?? "daily", body.frequencyDays ?? [], body.frequencyCount ?? 1, body.startDate ?? "", Boolean(body.archived)) });
}
export async function DELETE(request: Request) {
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  deleteHabit(id);
  return Response.json({ ok: true });
}
