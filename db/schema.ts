import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
export const habits = sqliteTable("habits", { id: integer("id").primaryKey({ autoIncrement: true }), name: text("name").notNull(), emoji: text("emoji").notNull().default("✨"), color: text("color").notNull().default("yellow"), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`) });
export const completions = sqliteTable("habit_completions", { habitId: integer("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }), date: text("date").notNull() }, (table) => ({ pk: primaryKey({ columns: [table.habitId, table.date] }) }));
