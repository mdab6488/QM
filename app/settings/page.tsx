"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Hydrated } from "@/components/Hydrated";
import { Card, SectionTitle, Field, Input, Badge } from "@/components/ui";
import { Save, Database, Trash2, RotateCcw, Download } from "lucide-react";

export default function SettingsPage() {
  return (
    <Hydrated>
      <SettingsView />
    </Hydrated>
  );
}

function SettingsView() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const loadSeed = useStore((s) => s.loadSeed);
  const clearTrades = useStore((s) => s.clearTrades);
  const resetAll = useStore((s) => s.resetAll);
  const trades = useStore((s) => s.trades);
  const moods = useStore((s) => s.moods);
  const rules = useStore((s) => s.rules);

  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateSettings({
      ...form,
      startingBalance: Number(form.startingBalance),
      dailyLossLimit: Number(form.dailyLossLimit),
      dailyProfitTarget: Number(form.dailyProfitTarget),
      maxTradesPerDay: Number(form.maxTradesPerDay),
      riskPerTradePct: Number(form.riskPerTradePct),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ trades, moods, rules, settings }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qm-cockpit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <SectionTitle title="Settings" subtitle="Account, risk guardrails and data" />

      <Card>
        <SectionTitle title="Trader & account" />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Display name">
            <Input value={form.traderName} onChange={(e) => setForm({ ...form, traderName: e.target.value })} />
          </Field>
          <Field label="Currency symbol">
            <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          </Field>
          <Field label="Starting balance">
            <Input type="number" value={form.startingBalance} onChange={(e) => setForm({ ...form, startingBalance: +e.target.value })} />
          </Field>
          <Field label="Risk per trade (%)">
            <Input type="number" value={form.riskPerTradePct} onChange={(e) => setForm({ ...form, riskPerTradePct: +e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Risk guardrails" subtitle="The cockpit warns you when you cross these" />
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Daily loss limit">
            <Input type="number" value={form.dailyLossLimit} onChange={(e) => setForm({ ...form, dailyLossLimit: +e.target.value })} />
          </Field>
          <Field label="Daily profit target">
            <Input type="number" value={form.dailyProfitTarget} onChange={(e) => setForm({ ...form, dailyProfitTarget: +e.target.value })} />
          </Field>
          <Field label="Max trades / day">
            <Input type="number" value={form.maxTradesPerDay} onChange={(e) => setForm({ ...form, maxTradesPerDay: +e.target.value })} />
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button className="btn-primary" onClick={save}>
            <Save size={15} /> Save settings
          </button>
          {saved && <Badge tone="win">Saved</Badge>}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Data management" subtitle={`${trades.length} trades · ${moods.length} check-ins · ${rules.length} rules`} />
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={loadSeed}>
            <Database size={15} /> Load sample QX data
          </button>
          <button className="btn-ghost" onClick={exportAll}>
            <Download size={15} /> Backup all data (JSON)
          </button>
          <button
            className="btn-danger"
            onClick={() => {
              if (confirm("Delete ALL trades? This cannot be undone.")) clearTrades();
            }}
          >
            <Trash2 size={15} /> Clear trades
          </button>
          <button
            className="btn-danger"
            onClick={() => {
              if (confirm("Reset EVERYTHING (trades, moods, rules, settings)?")) resetAll();
            }}
          >
            <RotateCcw size={15} /> Factory reset
          </button>
        </div>
        <p className="text-xs text-muted mt-3">
          All data is stored locally in your browser (localStorage). Nothing is sent to a server.
          Use the backup button regularly and before clearing your browser data.
        </p>
      </Card>
    </div>
  );
}
