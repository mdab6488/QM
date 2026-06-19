"use client";

import { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Hydrated } from "@/components/Hydrated";
import { Badge, Input, Modal, SectionTitle, Select } from "@/components/ui";
import { TradeForm } from "@/components/TradeForm";
import { Trade } from "@/lib/types";
import { fmtMoney } from "@/lib/utils";
import { chronological } from "@/lib/stats";
import { Plus, Download, Upload, Pencil, Trash2 } from "lucide-react";
import { tradesToCsv, csvToTrades } from "@/lib/csv";

export default function TradesPage() {
  return (
    <Hydrated>
      <Journal />
    </Hydrated>
  );
}

function Journal() {
  const trades = useStore((s) => s.trades);
  const settings = useStore((s) => s.settings);
  const addTrade = useStore((s) => s.addTrade);
  const updateTrade = useStore((s) => s.updateTrade);
  const deleteTrade = useStore((s) => s.deleteTrade);
  const importTrades = useStore((s) => s.importTrades);

  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Trade | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => {
    let list = chronological(trades).reverse();
    if (filter !== "ALL") list = list.filter((t) => t.outcome === filter);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (t) =>
          t.asset.toLowerCase().includes(s) ||
          t.strategy.toLowerCase().includes(s) ||
          t.notes.toLowerCase().includes(s) ||
          t.mistakes.join(" ").toLowerCase().includes(s)
      );
    }
    return list;
  }, [trades, q, filter]);

  const exportCsv = () => {
    const blob = new Blob([tradesToCsv(trades)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qm-trades-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = csvToTrades(text);
      if (parsed.length) {
        importTrades(parsed);
        alert(`Imported ${parsed.length} trades.`);
      } else alert("No valid rows found.");
    } catch (err) {
      alert("Could not parse CSV. Expected a header row matching the export format.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Trade Journal"
        subtitle={`${trades.length} trades logged`}
        right={
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept=".csv" hidden onChange={onImportFile} />
            <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
              <Upload size={15} /> Import
            </button>
            <button className="btn-ghost" onClick={exportCsv}>
              <Download size={15} /> Export
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setEditing(null);
                setModal("add");
              }}
            >
              <Plus size={15} /> New trade
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search asset, strategy, notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-[160px]"
          options={[
            { value: "ALL", label: "All outcomes" },
            { value: "WIN", label: "Wins" },
            { value: "LOSS", label: "Losses" },
            { value: "DRAW", label: "Draws" },
          ]}
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-border">
              <th className="px-3 py-2.5 font-medium">Date</th>
              <th className="px-3 py-2.5 font-medium">Asset</th>
              <th className="px-3 py-2.5 font-medium">Dir</th>
              <th className="px-3 py-2.5 font-medium">Setup</th>
              <th className="px-3 py-2.5 font-medium">Emotion</th>
              <th className="px-3 py-2.5 font-medium text-right">Stake</th>
              <th className="px-3 py-2.5 font-medium">Result</th>
              <th className="px-3 py-2.5 font-medium text-right">P&L</th>
              <th className="px-3 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-border/60 hover:bg-panel2/40">
                <td className="px-3 py-2.5 whitespace-nowrap text-muted">
                  {new Date(t.date).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-3 py-2.5 font-medium">
                  {t.asset}
                  <span className="text-muted text-xs ml-1">{t.timeframe}</span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={t.direction === "CALL" ? "text-win" : "text-loss"}>
                    {t.direction}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-muted">{t.strategy}</td>
                <td className="px-3 py-2.5">
                  <span className="text-muted text-xs">{t.emotionBefore}</span>
                  {!t.followedPlan && <span className="ml-1 text-warn text-xs">⚠</span>}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted">
                  {fmtMoney(t.investment, settings.currency)}
                </td>
                <td className="px-3 py-2.5">
                  <Badge tone={t.outcome === "WIN" ? "win" : t.outcome === "LOSS" ? "loss" : "default"}>
                    {t.outcome}
                  </Badge>
                </td>
                <td
                  className={`px-3 py-2.5 text-right tabular-nums font-medium ${
                    t.pnl > 0 ? "text-win" : t.pnl < 0 ? "text-loss" : "text-muted"
                  }`}
                >
                  {t.pnl >= 0 ? "+" : ""}
                  {fmtMoney(t.pnl, settings.currency)}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1 justify-end">
                    <button
                      className="p-1.5 text-muted hover:text-text rounded hover:bg-panel2"
                      onClick={() => {
                        setEditing(t);
                        setModal("edit");
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="p-1.5 text-muted hover:text-loss rounded hover:bg-panel2"
                      onClick={() => {
                        if (confirm("Delete this trade?")) deleteTrade(t.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-muted">
                  No trades match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === "edit" ? "Edit trade" : "New trade"}
        wide
      >
        <TradeForm
          initial={editing ?? undefined}
          onCancel={() => setModal(null)}
          onSubmit={(d) => {
            if (modal === "edit" && editing) updateTrade(editing.id, d);
            else addTrade(d);
            setModal(null);
          }}
        />
      </Modal>
    </div>
  );
}
