"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Hydrated } from "@/components/Hydrated";
import { Badge, Field, Input, Modal, SectionTitle, Select, Stat, Textarea } from "@/components/ui";
import { Session, SessionEntry, SessionOutcome } from "@/lib/types";
import { fmtMoney, fmtPct } from "@/lib/utils";
import { computeSession, entryPnl, summarizeSessions } from "@/lib/stats";
import { Plus, Pencil, Trash2, Layers, ArrowDownUp } from "lucide-react";

export default function TradesPage() {
  return (
    <Hydrated>
      <Journal />
    </Hydrated>
  );
}

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];

function Journal() {
  const sessions = useStore((s) => s.sessions);
  const settings = useStore((s) => s.settings);
  const loadSeed = useStore((s) => s.loadSeed);
  const addSession = useStore((s) => s.addSession);
  const updateSession = useStore((s) => s.updateSession);
  const deleteSession = useStore((s) => s.deleteSession);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sessionModal, setSessionModal] = useState<"add" | "edit" | null>(null);

  const ordered = useMemo(
    () => [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name)),
    [sessions]
  );
  const summary = useMemo(() => summarizeSessions(sessions), [sessions]);

  // Keep a session selected once data exists.
  const selected =
    ordered.find((s) => s.id === selectedId) ?? ordered[ordered.length - 1] ?? null;

  const cur = settings.currency;

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Trade Journal"
        subtitle={`${sessions.length} session${sessions.length === 1 ? "" : "s"} · bankroll money-management tracker`}
        right={
          <div className="flex flex-wrap gap-2">
            {!sessions.length && (
              <button className="btn-ghost" onClick={loadSeed}>
                Load QX sessions
              </button>
            )}
            <button
              className="btn-primary"
              onClick={() => {
                setSessionModal("add");
              }}
            >
              <Plus size={15} /> New session
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          label="Total P&L"
          value={`${summary.net >= 0 ? "+" : ""}${fmtMoney(summary.net, cur)}`}
          tone={summary.net >= 0 ? "win" : "loss"}
          hint={`${summary.winners}W · ${summary.losers}L sessions`}
        />
        <Stat label="Sessions" value={summary.count} />
        <Stat
          label="Total invested"
          value={fmtMoney(summary.invested, cur)}
          hint={`Returned ${fmtMoney(summary.returned, cur)}`}
        />
        <Stat
          label="Best / worst"
          value={`${fmtMoney(summary.bestNet, cur)}`}
          tone="win"
          hint={`Worst ${fmtMoney(summary.worstNet, cur)}`}
        />
      </div>

      {!sessions.length ? (
        <div className="card p-10 text-center">
          <p className="text-text font-medium">No sessions yet</p>
          <p className="text-sm text-muted mt-1">
            Create a session to start tracking a bankroll, or load your QX sessions to explore.
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <button className="btn-primary" onClick={() => setSessionModal("add")}>
              <Plus size={15} /> New session
            </button>
            <button className="btn-ghost" onClick={loadSeed}>
              Load QX sessions
            </button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-[260px_1fr] gap-4">
          <SessionList
            sessions={ordered}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
            currency={cur}
            total={summary.net}
          />
          {selected && (
            <SessionDetail
              key={selected.id}
              session={selected}
              currency={cur}
              onEdit={() => {
                setSelectedId(selected.id);
                setSessionModal("edit");
              }}
              onDelete={() => {
                if (confirm(`Delete session ${selected.name}?`)) {
                  deleteSession(selected.id);
                  setSelectedId(null);
                }
              }}
            />
          )}
        </div>
      )}

      <Modal
        open={sessionModal !== null}
        onClose={() => setSessionModal(null)}
        title={sessionModal === "edit" ? "Edit session" : "New session"}
      >
        <SessionForm
          initial={sessionModal === "edit" ? selected ?? undefined : undefined}
          onCancel={() => setSessionModal(null)}
          onSubmit={(data) => {
            if (sessionModal === "edit" && selected) {
              updateSession(selected.id, data);
            } else {
              const id = addSession(data);
              setSelectedId(id);
            }
            setSessionModal(null);
          }}
        />
      </Modal>
    </div>
  );
}

/** Left pane — the "Sessions" overview sheet: every session + grand total. */
function SessionList({
  sessions,
  selectedId,
  onSelect,
  currency,
  total,
}: {
  sessions: Session[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  currency: string;
  total: number;
}) {
  return (
    <div className="card overflow-hidden h-fit">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 text-sm font-medium">
        <Layers size={15} className="text-brand" /> Sessions
      </div>
      <div className="divide-y divide-border/60">
        {sessions.map((s) => {
          const { net } = computeSession(s);
          const active = s.id === selectedId;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors ${
                active ? "bg-brand/10" : "hover:bg-panel2/50"
              }`}
            >
              <div>
                <div className={`text-sm font-medium ${active ? "text-brand" : ""}`}>{s.name}</div>
                <div className="text-[11px] text-muted">{s.date}</div>
              </div>
              <span
                className={`text-sm tabular-nums font-medium ${
                  net > 0 ? "text-win" : net < 0 ? "text-loss" : "text-muted"
                }`}
              >
                {net >= 0 ? "+" : ""}
                {fmtMoney(net, currency)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted">Total P&L</span>
        <span
          className={`text-sm tabular-nums font-semibold ${
            total > 0 ? "text-win" : total < 0 ? "text-loss" : "text-muted"
          }`}
        >
          {total >= 0 ? "+" : ""}
          {fmtMoney(total, currency)}
        </span>
      </div>
    </div>
  );
}

/** Right pane — a single session sheet: capital, plan, entries, net. */
function SessionDetail({
  session,
  currency,
  onEdit,
  onDelete,
}: {
  session: Session;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const addEntry = useStore((s) => s.addEntry);
  const updateEntry = useStore((s) => s.updateEntry);
  const deleteEntry = useStore((s) => s.deleteEntry);

  const [entryModal, setEntryModal] = useState<"add" | "edit" | null>(null);
  const [editingEntry, setEditingEntry] = useState<SessionEntry | null>(null);

  const stats = useMemo(() => computeSession(session), [session]);

  const cycleOutcome = (e: SessionEntry) => {
    const next: Record<SessionOutcome, SessionOutcome> = {
      PENDING: "WIN",
      WIN: "LOSS",
      LOSS: "PENDING",
    };
    updateEntry(session.id, e.id, { outcome: next[e.outcome] });
  };

  return (
    <div className="card overflow-hidden">
      {/* Capital banner (merged A1 in the sheet) */}
      <div className="px-5 py-4 border-b border-border bg-panel2/40 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{session.name}</h3>
            <span className="text-xs text-muted">{session.date}</span>
          </div>
          <div className="text-2xl font-semibold tabular-nums mt-1">
            {fmtMoney(session.capital, currency)}
            <span className="text-xs text-muted font-normal ml-2">capital</span>
          </div>
        </div>
        <div className="flex gap-1">
          <button className="p-2 text-muted hover:text-text rounded hover:bg-panel2" onClick={onEdit}>
            <Pencil size={15} />
          </button>
          <button className="p-2 text-muted hover:text-loss rounded hover:bg-panel2" onClick={onDelete}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Plan strip — base size = capital / steps */}
      <div className="px-5 py-3 border-b border-border flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted">
          Plan · base size <span className="text-text font-medium">{fmtMoney(stats.baseSize, currency)}</span>{" "}
          ({session.steps} steps)
        </span>
        <div className="flex flex-wrap gap-1.5 ml-auto">
          {Array.from({ length: session.steps }).map((_, i) => (
            <span key={i} className="chip bg-panel2 text-muted">
              {ORDINALS[i] ?? `${i + 1}.`}
            </span>
          ))}
        </div>
      </div>

      {/* Entries table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted border-b border-border">
              <th className="px-4 py-2.5 font-medium w-8">#</th>
              <th className="px-4 py-2.5 font-medium text-right">Investment</th>
              <th className="px-4 py-2.5 font-medium text-right">Expected Return</th>
              <th className="px-4 py-2.5 font-medium">Result</th>
              <th className="px-4 py-2.5 font-medium text-right">P&L</th>
              <th className="px-4 py-2.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {session.entries.map((e, i) => {
              const pnl = entryPnl(e);
              return (
                <tr key={e.id} className="border-b border-border/60 hover:bg-panel2/40">
                  <td className="px-4 py-2.5 text-muted tabular-nums">{i + 1}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtMoney(e.investment, currency)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                    {fmtMoney(e.payout, currency)}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => cycleOutcome(e)}
                      title="Click to change result"
                      className="cursor-pointer"
                    >
                      <Badge
                        tone={e.outcome === "WIN" ? "win" : e.outcome === "LOSS" ? "loss" : "default"}
                      >
                        {e.outcome === "PENDING" ? "OPEN" : e.outcome}
                      </Badge>
                    </button>
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                      pnl > 0 ? "text-win" : pnl < 0 ? "text-loss" : "text-muted"
                    }`}
                  >
                    {e.outcome === "PENDING" ? "—" : `${pnl >= 0 ? "+" : ""}${fmtMoney(pnl, currency)}`}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 justify-end">
                      <button
                        className="p-1.5 text-muted hover:text-text rounded hover:bg-panel2"
                        onClick={() => {
                          setEditingEntry(e);
                          setEntryModal("edit");
                        }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="p-1.5 text-muted hover:text-loss rounded hover:bg-panel2"
                        onClick={() => deleteEntry(session.id, e.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!session.entries.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No steps yet — add the first trade of this session.
                </td>
              </tr>
            )}
          </tbody>
          {session.entries.length > 0 && (
            <tfoot>
              <tr className="border-t border-border text-sm font-medium">
                <td className="px-4 py-2.5 text-muted text-xs uppercase tracking-wide">Total</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{fmtMoney(stats.invested, currency)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                  {fmtMoney(stats.returned, currency)}
                </td>
                <td className="px-4 py-2.5 text-xs text-muted">
                  {stats.wins}W · {stats.losses}L
                  {stats.pending ? ` · ${stats.pending} open` : ""}
                </td>
                <td
                  className={`px-4 py-2.5 text-right tabular-nums ${
                    stats.net > 0 ? "text-win" : stats.net < 0 ? "text-loss" : "text-muted"
                  }`}
                >
                  {stats.net >= 0 ? "+" : ""}
                  {fmtMoney(stats.net, currency)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer: net + ROI + add step */}
      <div className="px-5 py-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-muted">
          <span>
            Win rate <span className="text-text font-medium">{fmtPct(stats.winRate)}</span>
          </span>
          <span>
            ROI{" "}
            <span className={`font-medium ${stats.net >= 0 ? "text-win" : "text-loss"}`}>
              {fmtPct(stats.roi)}
            </span>
          </span>
        </div>
        <button
          className="btn-ghost"
          onClick={() => {
            setEditingEntry(null);
            setEntryModal("add");
          }}
        >
          <Plus size={15} /> Add step
        </button>
      </div>

      {session.notes && (
        <div className="px-5 py-3 border-t border-border text-sm text-muted">{session.notes}</div>
      )}

      <Modal
        open={entryModal !== null}
        onClose={() => setEntryModal(null)}
        title={entryModal === "edit" ? "Edit step" : "Add step"}
      >
        <EntryForm
          initial={editingEntry ?? undefined}
          suggestedInvestment={stats.baseSize}
          payoutPct={session.entries[0] ? undefined : 85}
          onCancel={() => setEntryModal(null)}
          onSubmit={(data) => {
            if (entryModal === "edit" && editingEntry) {
              updateEntry(session.id, editingEntry.id, data);
            } else {
              addEntry(session.id, data);
            }
            setEntryModal(null);
          }}
        />
      </Modal>
    </div>
  );
}

// ---- Forms ----

function SessionForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Session;
  onSubmit: (d: Omit<Session, "id" | "entries">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [capital, setCapital] = useState(initial?.capital ?? 500);
  const [steps, setSteps] = useState(initial?.steps ?? 5);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name: name.trim() || "S?", date, capital: Number(capital) || 0, steps: Number(steps) || 1, notes });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Session name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="S1" />
        </Field>
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Capital (bankroll)">
          <Input
            type="number"
            step="any"
            value={capital}
            onChange={(e) => setCapital(e.target.valueAsNumber)}
          />
        </Field>
        <Field label="Plan steps">
          <Input
            type="number"
            min={1}
            value={steps}
            onChange={(e) => setSteps(e.target.valueAsNumber)}
          />
        </Field>
      </div>
      <div className="text-xs text-muted -mt-1">
        Base size per step ≈ {(Number(capital) / (Number(steps) || 1) || 0).toFixed(2)}
      </div>
      <Field label="Notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Plan, conditions, market…" />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {initial ? "Save" : "Create session"}
        </button>
      </div>
    </form>
  );
}

function EntryForm({
  initial,
  suggestedInvestment,
  payoutPct,
  onSubmit,
  onCancel,
}: {
  initial?: SessionEntry;
  suggestedInvestment: number;
  payoutPct?: number;
  onSubmit: (d: Omit<SessionEntry, "id">) => void;
  onCancel: () => void;
}) {
  const [investment, setInvestment] = useState(
    initial?.investment ?? Math.round(suggestedInvestment)
  );
  const [payout, setPayout] = useState(
    initial?.payout ?? Math.round((suggestedInvestment || 0) * (1 + (payoutPct ?? 85) / 100))
  );
  const [outcome, setOutcome] = useState<SessionOutcome>(initial?.outcome ?? "PENDING");

  const pnl = (outcome === "WIN" ? payout : 0) - investment;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          investment: Number(investment) || 0,
          payout: Number(payout) || 0,
          outcome,
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Investment (stake)">
          <Input
            type="number"
            step="any"
            value={investment}
            onChange={(e) => setInvestment(e.target.valueAsNumber)}
            autoFocus
          />
        </Field>
        <Field label="Expected return (payout)">
          <Input
            type="number"
            step="any"
            value={payout}
            onChange={(e) => setPayout(e.target.valueAsNumber)}
          />
        </Field>
      </div>
      <Field label="Result">
        <Select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value as SessionOutcome)}
          options={[
            { value: "PENDING", label: "Open / not settled" },
            { value: "WIN", label: "Win" },
            { value: "LOSS", label: "Loss" },
          ]}
        />
      </Field>
      <div className="flex items-center gap-2 text-sm text-muted">
        <ArrowDownUp size={14} />
        Step P&L:{" "}
        <span className={pnl > 0 ? "text-win" : pnl < 0 ? "text-loss" : ""}>
          {outcome === "PENDING" ? "— (open)" : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`}
        </span>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {initial ? "Save step" : "Add step"}
        </button>
      </div>
    </form>
  );
}
