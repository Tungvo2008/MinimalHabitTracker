"use client";
import { useEffect, useState } from "react";
import "./manage.css";
import "./frequency.css";
import "./attributes.css";
import "./pastels.css";
import "./modal-nav.css";
import "./calendar-extra.css";
import "./view-toggle.css";
import "./selected-day.css";

type F = "daily" | "specific" | "weekly";
type View = "month" | "week";
type Habit = {
  id: number;
  name: string;
  emoji: string;
  color: string;
  days: number[];
  frequencyType: F;
  frequencyDays: number[];
  frequencyCount: number;
  startDate: string;
  archived: boolean;
};

const wd = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const colors = [
  "rose", "coral", "peach", "apricot", "sun", "lemon", "mint", "sage",
  "teal", "aqua", "sky", "blue", "periwinkle", "lavender", "lilac",
  "plum", "blush", "cream", "sand", "powder"
];
const key = (d: Date) => d.toISOString().slice(0, 7);
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function Home() {
  const today = new Date();
  const [m, setM] = useState(today);
  const [selected, setSelected] = useState(today);
  const [view, setView] = useState<View>("month");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [color, setColor] = useState("mint");
  const [editId, setEditId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [manage, setManage] = useState(false);
  const [backManage, setBackManage] = useState(false);
  const [deleteHabit, setDeleteHabit] = useState<Habit | null>(null);
  const [freq, setFreq] = useState<F>("daily");
  const [freqDays, setFreqDays] = useState<number[]>([]);
  const [freqCount, setFreqCount] = useState(3);
  const [start, setStart] = useState("");
  const [archived, setArchived] = useState(false);
  const [saving, setSaving] = useState(false);

  const title = view === "month"
    ? m.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : `Week of ${m.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const months = [
    new Date(m.getFullYear(), m.getMonth() - 1, 1),
    new Date(m.getFullYear(), m.getMonth(), 1),
    new Date(m.getFullYear(), m.getMonth() + 1, 1)
  ];

  const load = async () => {
    const result = await Promise.all(
      months.map(x =>
        fetch(`/api/habits?month=${key(x)}`)
          .then(r => r.json())
          .catch(() => ({ habits: [] }))
      )
    );
    const map = new Map<number, Habit>();
    result.forEach((data, i) =>
      data.habits?.forEach((h: Habit) => {
        const dates = (h.days || []).map(day =>
          iso(new Date(months[i].getFullYear(), months[i].getMonth(), day))
        );
        const old = map.get(h.id);
        const previous = (old as Habit & { completedDates?: string[] })?.completedDates || [];
        map.set(h.id, { ...h, days: [], completedDates: [...previous, ...dates] } as Habit);
      })
    );
    setHabits([...map.values()]);
  };

  useEffect(() => {
    void load();
    const refresh = () => {
      if (document.visibilityState === "visible") void load();
    };
    const timer = window.setInterval(refresh, 5000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [m.getFullYear(), m.getMonth()]);

  const monday = new Date(m);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const first = (new Date(m.getFullYear(), m.getMonth(), 1).getDay() + 6) % 7;
  const total = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const prevTotal = new Date(m.getFullYear(), m.getMonth(), 0).getDate();

  const cells = view === "week"
    ? Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i))
    : Array.from({ length: 42 }, (_, i) => {
        const n = i - first + 1;
        return n < 1
          ? new Date(m.getFullYear(), m.getMonth() - 1, prevTotal + n)
          : n > total
          ? new Date(m.getFullYear(), m.getMonth() + 1, n - total)
          : new Date(m.getFullYear(), m.getMonth(), n);
      });

  const completed = (h: Habit, d: Date) =>
    ((h as Habit & { completedDates?: string[] }).completedDates || []).includes(iso(d));

  const appears = (h: Habit, d: Date) => {
    if (h.archived || iso(d) < (h.startDate || "0000-00-00")) return false;
    if (h.frequencyType !== "specific") return true;
    return h.frequencyDays.includes((d.getDay() + 6) % 7);
  };

  const toggle = async (h: Habit, d: Date) => {
    const done = completed(h, d);
    setHabits(a =>
      a.map(x =>
        x.id === h.id
          ? ({
              ...x,
              completedDates: done
                ? ((x as Habit & { completedDates?: string[] }).completedDates || []).filter(v => v !== iso(d))
                : [...((x as Habit & { completedDates?: string[] }).completedDates || []), iso(d)]
            } as Habit)
          : x
      )
    );
    await fetch("/api/completions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId: h.id, date: iso(d), completed: !done })
    });
  };

  const reset = () => {
    setName("");
    setEmoji("✨");
    setColor("mint");
    setFreq("daily");
    setFreqDays([]);
    setFreqCount(3);
    setStart(iso(new Date()));
    setArchived(false);
  };

  const save = async () => {
    if (!name.trim() || saving) return;
    const fromManage = backManage;
    setSaving(true);
    try {
      await fetch("/api/habits", {
        method: editId === null ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editId === null ? {} : { id: editId }),
          name,
          emoji,
          color,
          frequencyType: freq,
          frequencyDays: freq === "specific" ? freqDays : [],
          frequencyCount: freq === "weekly" ? freqCount : 1,
          startDate: start,
          archived
        })
      });
      reset();
      setEditId(null);
      setAdding(false);
      setManage(fromManage);
      setBackManage(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async (id: number) => {
    setDeleteHabit(null);
    await fetch(`/api/habits?id=${id}`, { method: "DELETE" });
    load();
  };

  const edit = (h: Habit) => {
    setEditId(h.id);
    setName(h.name);
    setEmoji(h.emoji);
    setColor(h.color);
    setFreq(h.frequencyType || "daily");
    setFreqDays(h.frequencyDays || []);
    setFreqCount(h.frequencyCount || 3);
    setStart(h.startDate || "");
    setArchived(h.archived);
    setBackManage(true);
    setManage(false);
  };

  const close = () => {
    setAdding(false);
    setEditId(null);
    setManage(false);
    setBackManage(false);
    setDeleteHabit(null);
  };

  const back = () => (backManage ? (setEditId(null), setManage(true)) : close());
  const move = (direction: number) =>
    view === "month"
      ? setM(new Date(m.getFullYear(), m.getMonth() + direction, 1))
      : setM(new Date(m.getFullYear(), m.getMonth(), m.getDate() + direction * 7));

  const selectedHabits = habits.filter(h => appears(h, selected));

  return (
    <main className="simple-app">
      <header className="simple-header">
        <div className="logo">
          <span>✦</span> little steps
        </div>
        <div className="header-actions">
          <button
            className="manage-button icon-header-btn"
            title="Manage habits"
            aria-label="Manage habits"
            onClick={() => setManage(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
          <button
            className="add-button icon-header-btn"
            title="Add habit"
            aria-label="Add habit"
            onClick={() => {
              reset();
              setAdding(true);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      <section className="calendar">
        <div className="calendar-title">
          <button onClick={() => move(-1)}>‹</button>
          <h1>{title}</h1>
          <button onClick={() => move(1)}>›</button>
        </div>

        <div className="view-toggle">
          <button className={view === "month" ? "active-view" : ""} onClick={() => setView("month")}>
            Month
          </button>
          <button className={view === "week" ? "active-view" : ""} onClick={() => setView("week")}>
            Week
          </button>
        </div>

        <div className="weekdays">
          {wd.map(x => (
            <span key={x}>{x}</span>
          ))}
        </div>

        <div className={`date-grid ${view === "week" ? "week-view" : ""}`}>
          {cells.map((d, i) => {
            const current = d.getMonth() === m.getMonth();
            const selectedDay = iso(d) === iso(selected);
            return (
              <div
                className={`day-cell ${current || view === "week" ? "" : "adjacent-day"} ${selectedDay ? "selected-day" : ""}`}
                key={i}
                onClick={() => setSelected(d)}
              >
                <strong className="day-number">{d.getDate()}</strong>
                <div className="day-habits">
                  {habits
                    .filter(h => appears(h, d))
                    .map(h => (
                      <div className={`day-habit ${completed(h, d) ? "done" : ""}`} key={h.id}>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            toggle(h, d);
                          }}
                        >
                          {completed(h, d) ? "✓" : ""}
                        </button>
                        <span>
                          {h.emoji} {h.name}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="selected-day-list">
        <div className="selected-heading">
          <div>
            <h2>{selected.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h2>
            <p>Tap a habit to mark it complete</p>
          </div>
          <span>
            {selectedHabits.filter(h => completed(h, selected)).length}/{selectedHabits.length}
          </span>
        </div>
        <div className="selected-habits">
          {selectedHabits.length === 0 ? (
            <div className="empty">No habits scheduled for this day.</div>
          ) : (
            selectedHabits.map(h => (
              <div className={`selected-habit ${completed(h, selected) ? "done" : ""}`} key={h.id}>
                <span className={`selected-emoji ${h.color}`}>{h.emoji}</span>
                <strong>{h.name}</strong>
                <button onClick={() => toggle(h, selected)}>
                  {completed(h, selected) ? "✓" : ""}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="calendar-footer">
        {view === "week"
          ? "Weekly view · tick habits directly in each day"
          : "Monthly view · tap any day to see its habits below"}
      </div>

      {manage && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal manage-modal" onClick={e => e.stopPropagation()}>
            <button className="close" onClick={close}>×</button>
            <h2>Manage habits</h2>
            <p>Edit, archive, or delete your habits.</p>
            <div className="manage-list">
              {habits.length === 0 ? (
                <div className="empty">No habits created yet.</div>
              ) : (
                habits.map(h => (
                  <div className="manage-row" key={h.id}>
                    <span className={`manage-emoji ${h.color}`}>{h.emoji}</span>
                    <strong>{h.name}</strong>
                    {h.archived && <em>Archived</em>}
                    <button
                      className="icon-row-btn edit-btn"
                      title="Edit habit"
                      aria-label="Edit habit"
                      onClick={() => edit(h)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="icon-row-btn delete-btn"
                      title="Delete habit"
                      aria-label="Delete habit"
                      onClick={() => setDeleteHabit(h)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {deleteHabit && (
        <div className="modal-backdrop confirm-backdrop" onClick={() => setDeleteHabit(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c94a4a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h2>Delete habit?</h2>
            <p>
              Are you sure you want to delete <strong>"{deleteHabit.name}"</strong>? This will permanently remove its tracking history.
            </p>
            <div className="confirm-actions">
              <button className="cancel-button" onClick={() => setDeleteHabit(null)}>
                Cancel
              </button>
              <button
                className="confirm-delete-button"
                onClick={() => executeDelete(deleteHabit.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {(adding || editId !== null) && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="back-icon" onClick={back}>‹</button>
            <button className="close" onClick={close}>×</button>
            <h2>{editId !== null ? "Edit habit" : "Add a habit"}</h2>
            <p>Set the details for this habit.</p>

            <label className="field-label">Name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Read 20 pages"
            />

            <label className="field-label">Emoji</label>
            <input
              className="emoji-input"
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              maxLength={2}
            />

            <label className="field-label">Color</label>
            <div className="color-picker">
              {colors.map(c => (
                <button
                  key={c}
                  className={`${c} ${color === c ? "selected-color" : ""}`}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>

            <label className="field-label">Frequency</label>
            <select
              className="frequency-select"
              value={freq}
              onChange={e => setFreq(e.target.value as F)}
            >
              <option value="daily">Every day</option>
              <option value="specific">Specific days</option>
              <option value="weekly">X times per week</option>
            </select>

            {freq === "specific" && (
              <div className="day-picker">
                {wd.map((x, i) => (
                  <button
                    key={x}
                    className={freqDays.includes(i) ? "picked" : ""}
                    onClick={() =>
                      setFreqDays(a => (a.includes(i) ? a.filter(v => v !== i) : [...a, i]))
                    }
                  >
                    {x.slice(0, 2)}
                  </button>
                ))}
              </div>
            )}

            {freq === "weekly" && (
              <label className="times-row">
                Times per week{" "}
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={freqCount}
                  onChange={e => setFreqCount(Number(e.target.value))}
                />
              </label>
            )}

            <label className="field-label">Start date</label>
            <input type="date" value={start} onChange={e => setStart(e.target.value)} />

            <label className="archive-toggle">
              <input
                type="checkbox"
                checked={archived}
                onChange={e => setArchived(e.target.checked)}
              />
              <span className="toggle-track">
                <span />
              </span>
              <span>Archive this habit</span>
            </label>

            <div className="modal-actions">
              <button className="save-button" onClick={save}>
                {editId !== null ? "Save changes" : "Add habit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
