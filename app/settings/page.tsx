"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Hydrated } from "@/components/Hydrated";
import { Card, SectionTitle, Field, Input, Badge } from "@/components/ui";
import { Save } from "lucide-react";

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
    </div>
  );
}
