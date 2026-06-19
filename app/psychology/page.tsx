"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Hydrated } from "@/components/Hydrated";
import { Card, SectionTitle, Stat, Field, Input, Textarea, Select, Badge } from "@/components/ui";
import { EMOTIONS, Emotion, NEGATIVE_EMOTIONS } from "@/lib/types";
import { disciplineScore } from "@/lib/stats";
import { todayISO } from "@/lib/utils";
import { Plus, Trash2, Brain, Moon, Zap, ShieldCheck } from "lucide-react";

export default function PsychologyPage() {
  return (
    <Hydrated>
      <Psychology />
    </Hydrated>
  );
}

function Psychology() {
  const trades = useStore((s) => s.trades);
  const moods = useStore((s) => s.moods);
  const rules = useStore((s) => s.rules);
  const addMood = useStore((s) => s.addMood);
  const deleteMood = useStore((s) => s.deleteMood);
  const addRule = useStore((s) => s.addRule);
  const toggleRule = useStore((s) => s.toggleRule);
  const deleteRule = useStore((s) => s.deleteRule);

  const [newRule, setNewRule] = useState("");
  const [form, setForm] = useState({
    sleepHours: 7,
    stress: 3,
    energy: 3,
    followedRules: true,
    mood: "Calm" as Emotion,
    note: "",
  });

  const score = useMemo(() => disciplineScore(trades), [trades]);

  // Emotion impact: net pnl when feeling each negative emotion
  const emotionImpact = useMemo(() => {
    return NEGATIVE_EMOTIONS.map((emo) => {
      const list = trades.filter((t) => t.emotionBefore === emo);
      const pnl = list.reduce((a, t) => a + t.pnl, 0);
      return { emo, count: list.length, pnl };
    }).filter((x) => x.count > 0);
  }, [trades]);

  // Revenge / tilt signature: consecutive losses followed by oversized or off-plan trades
  const tiltSignals = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
    let losses = 0;
    let revengeCount = 0;
    let afterLossPnl = 0;
    for (const t of sorted) {
      if (losses >= 2 && (!t.followedPlan || t.emotionBefore === "Revenge")) {
        revengeCount++;
        afterLossPnl += t.pnl;
      }
      if (t.outcome === "LOSS") losses++;
      else if (t.outcome === "WIN") losses = 0;
    }
    return { revengeCount, afterLossPnl };
  }, [trades]);

  const recentMoods = [...moods].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);

  const submitMood = () => {
    addMood({ date: todayISO(), ...form });
    setForm({ ...form, note: "" });
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Trading Psychology"
        subtitle="Master the inner game — most accounts die from tilt, not bad setups"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          label="Discipline score"
          value={score}
          hint="process over outcome /100"
          tone={score >= 70 ? "win" : score >= 40 ? "warn" : "loss"}
        />
        <Stat
          label="Revenge trades"
          value={tiltSignals.revengeCount}
          hint="taken after 2+ losses"
          tone={tiltSignals.revengeCount === 0 ? "win" : "loss"}
        />
        <Stat
          label="Tilt P&L"
          value={tiltSignals.afterLossPnl.toFixed(0)}
          hint="result of post-loss trades"
          tone={tiltSignals.afterLossPnl >= 0 ? "win" : "loss"}
        />
        <Stat
          label="Check-ins"
          value={moods.length}
          hint="daily mind logs"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <SectionTitle title="Daily mind check-in" subtitle="Log this before your first trade" />
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Sleep (hrs)">
                <Input
                  type="number"
                  value={form.sleepHours}
                  onChange={(e) => setForm({ ...form, sleepHours: +e.target.value })}
                />
              </Field>
              <Field label="Stress (1-5)">
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={form.stress}
                  onChange={(e) => setForm({ ...form, stress: +e.target.value })}
                />
              </Field>
              <Field label="Energy (1-5)">
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={form.energy}
                  onChange={(e) => setForm({ ...form, energy: +e.target.value })}
                />
              </Field>
            </div>
            <Field label="Mood">
              <Select
                value={form.mood}
                onChange={(e) => setForm({ ...form, mood: e.target.value as Emotion })}
                options={EMOTIONS.map((e) => ({ value: e, label: e }))}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.followedRules}
                onChange={(e) => setForm({ ...form, followedRules: e.target.checked })}
              />
              I am committed to following my rules today
            </label>
            <Field label="Intention / note">
              <Textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="How do I feel? What's my plan and my line in the sand today?"
              />
            </Field>
            <button className="btn-primary w-full" onClick={submitMood}>
              <Plus size={15} /> Log check-in
            </button>
          </div>
        </Card>

        <Card>
          <SectionTitle title="My trading rules" subtitle="The contract with yourself" />
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Add a rule…"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newRule.trim()) {
                  addRule(newRule.trim());
                  setNewRule("");
                }
              }}
            />
            <button
              className="btn-primary"
              onClick={() => {
                if (newRule.trim()) {
                  addRule(newRule.trim());
                  setNewRule("");
                }
              }}
            >
              <Plus size={15} />
            </button>
          </div>
          <div className="space-y-2">
            {rules.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 card p-3 bg-panel2/40"
              >
                <input
                  type="checkbox"
                  checked={r.active}
                  onChange={() => toggleRule(r.id)}
                />
                <span className={`flex-1 text-sm ${r.active ? "" : "line-through text-muted"}`}>
                  {r.text}
                </span>
                <button
                  className="text-muted hover:text-loss"
                  onClick={() => deleteRule(r.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {!rules.length && <p className="text-sm text-muted">No rules yet. Add your first.</p>}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle title="Emotion → money map" subtitle="What each mindset actually costs you" />
        {emotionImpact.length ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {emotionImpact.map((e) => (
              <div key={e.emo} className="card p-4 bg-panel2/40">
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-2">
                    <Brain size={15} className="text-warn" /> {e.emo}
                  </span>
                  <Badge tone={e.pnl >= 0 ? "win" : "loss"}>
                    {e.pnl >= 0 ? "+" : ""}
                    {e.pnl.toFixed(0)}
                  </Badge>
                </div>
                <div className="text-xs text-muted mt-1">{e.count} trades</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            No negative-emotion trades logged yet — keep it that way. 🧘
          </p>
        )}
      </Card>

      <Card>
        <SectionTitle title="Recent check-ins" subtitle="Your mental trend" />
        {recentMoods.length ? (
          <div className="space-y-2">
            {recentMoods.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-4 card p-3 bg-panel2/40 text-sm"
              >
                <span className="text-muted w-20">{m.date}</span>
                <Badge tone={NEGATIVE_EMOTIONS.includes(m.mood) ? "warn" : "win"}>{m.mood}</Badge>
                <span className="flex items-center gap-1 text-muted">
                  <Moon size={13} /> {m.sleepHours}h
                </span>
                <span className="flex items-center gap-1 text-muted">
                  <Zap size={13} /> E{m.energy}
                </span>
                <span className="flex items-center gap-1 text-muted">
                  <ShieldCheck size={13} className={m.followedRules ? "text-win" : "text-loss"} />
                </span>
                <span className="flex-1 truncate text-muted">{m.note}</span>
                <button className="text-muted hover:text-loss" onClick={() => deleteMood(m.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No check-ins yet.</p>
        )}
      </Card>
    </div>
  );
}
