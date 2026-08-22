import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const file = resolve(process.env.HABIT_DB_PATH ?? "./data/habits.db");
mkdirSync(dirname(file), { recursive: true });
const db = new DatabaseSync(file);
db.exec(`PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS habits (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, emoji TEXT NOT NULL DEFAULT '✨', color TEXT NOT NULL DEFAULT 'mint', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS habit_completions (habit_id INTEGER NOT NULL, date TEXT NOT NULL, PRIMARY KEY (habit_id, date), FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE);`);
const columns = db.prepare("PRAGMA table_info(habits)").all() as Array<{ name:string }>;
if (!columns.some((column) => column.name === "frequency_type")) db.exec("ALTER TABLE habits ADD COLUMN frequency_type TEXT NOT NULL DEFAULT 'daily'");
if (!columns.some((column) => column.name === "frequency_days")) db.exec("ALTER TABLE habits ADD COLUMN frequency_days TEXT NOT NULL DEFAULT '[]'");
if (!columns.some((column) => column.name === "frequency_count")) db.exec("ALTER TABLE habits ADD COLUMN frequency_count INTEGER NOT NULL DEFAULT 1");
if (!columns.some((column) => column.name === "start_date")) db.exec("ALTER TABLE habits ADD COLUMN start_date TEXT NOT NULL DEFAULT ''");
if (!columns.some((column) => column.name === "archived")) db.exec("ALTER TABLE habits ADD COLUMN archived INTEGER NOT NULL DEFAULT 0");

export function listHabits(month: string) {
  const rows = db.prepare("SELECT id, name, emoji, color, frequency_type, frequency_days, frequency_count, start_date, archived FROM habits ORDER BY created_at DESC, id DESC").all() as Array<{id:number;name:string;emoji:string;color:string;frequency_type:string;frequency_days:string;frequency_count:number;start_date:string;archived:number}>;
  const checks = db.prepare("SELECT habit_id, date FROM habit_completions WHERE date LIKE ?").all(`${month}-%`) as Array<{habit_id:number;date:string}>;
  const seen = new Set<string>();
  return rows.filter((habit) => { const key = habit.name.trim().toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }).map((habit) => ({ id:habit.id,name:habit.name,emoji:habit.emoji,color:habit.color,frequencyType:habit.frequency_type,frequencyDays:JSON.parse(habit.frequency_days||"[]"),frequencyCount:habit.frequency_count,startDate:habit.start_date,archived:Boolean(habit.archived),days:checks.filter((check) => check.habit_id === habit.id).map((check) => Number(check.date.slice(-2))) }));
}
export function createHabit(name:string, emoji:string, color:string, frequencyType:string, frequencyDays:number[], frequencyCount:number, startDate:string){
  const existing = db.prepare("SELECT id, name, emoji, color, frequency_type, frequency_days, frequency_count, start_date, archived FROM habits WHERE lower(name)=lower(?) LIMIT 1").get(name) as {id:number;name:string;emoji:string;color:string;frequency_type:string;frequency_days:string;frequency_count:number;start_date:string;archived:number}|undefined;
  if (existing) return { id:existing.id,name:existing.name,emoji:existing.emoji,color:existing.color,frequencyType:existing.frequency_type,frequencyDays:JSON.parse(existing.frequency_days||"[]"),frequencyCount:existing.frequency_count,startDate:existing.start_date,archived:Boolean(existing.archived),days:[] };
  const result=db.prepare("INSERT INTO habits (name, emoji, color, frequency_type, frequency_days, frequency_count, start_date) VALUES (?,?,?,?,?,?,?)").run(name,emoji,color,frequencyType,JSON.stringify(frequencyDays),frequencyCount,startDate);
  return {id:Number(result.lastInsertRowid),name,emoji,color,frequencyType,frequencyDays,frequencyCount,startDate,archived:false,days:[]};
}
export function updateHabit(id:number,name:string,emoji:string,color:string,frequencyType:string,frequencyDays:number[],frequencyCount:number,startDate:string,archived:boolean){db.prepare("UPDATE habits SET name=?, emoji=?, color=?, frequency_type=?, frequency_days=?, frequency_count=?, start_date=?, archived=? WHERE id=?").run(name,emoji,color,frequencyType,JSON.stringify(frequencyDays),frequencyCount,startDate,archived?1:0,id);return {id,name,emoji,color,frequencyType,frequencyDays,frequencyCount,startDate,archived};}
export function deleteHabit(id:number){db.prepare("DELETE FROM habits WHERE id=?").run(id);db.prepare("DELETE FROM habit_completions WHERE habit_id=?").run(id);}
export function setCompletion(habitId:number,date:string,completed:boolean){if(completed)db.prepare("INSERT OR IGNORE INTO habit_completions (habit_id,date) VALUES (?,?)").run(habitId,date);else db.prepare("DELETE FROM habit_completions WHERE habit_id=? AND date=?").run(habitId,date);}
