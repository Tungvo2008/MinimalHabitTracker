import { setCompletion } from "../../../server/sqlite";
export async function PUT(request: Request) {
  const body = await request.json() as { habitId?:number; date?:string; completed?:boolean };
  if (!body.habitId || !body.date) return Response.json({ error: "habitId and date are required" }, { status: 400 });
  setCompletion(body.habitId, body.date, Boolean(body.completed));
  return Response.json({ ok:true });
}
