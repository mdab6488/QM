"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Hydrated } from "@/components/Hydrated";
import { Badge, Field, Input, Modal, SectionTitle, Select, Stat, Textarea } from "@/components/ui";
import { Group, Session, SessionEntry, SessionOutcome } from "@/lib/types";
import { fmtMoney, fmtPct } from "@/lib/utils";
import { computeGroup, computeSession, entryPnl } from "@/lib/stats";
import { DEFAULT_DEPOSIT, DEFAULT_GOAL } from "@/lib/constants";
import {
  Plus,
  Pencil,
  Trash2,
  Layers,
  ArrowDownUp,
  Target,
  ArrowUpFromLine,
  ArrowDownToLine,
  FolderPlus,
} from "lucide-react";

export default function TradesPage() {
  return (
    <Hydrated>
      <MoneyManagement />
    </Hydrated>
  );
}

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];

function MoneyManagement() {
  const groups = useStore((s) => s.groups);
  const sessions = useStore((s) => s.sessions);
  const settings = useStore((s) => s.settings);
  const addGroup = useStore((s) => s.addGroup);
  const updateGroup = useStore((s) => s.updateGroup);
  const deleteGroup = useStore((s) => s.deleteGroup);
  const addTxn = useStore((s) => s.addTxn);
  const addSession = useStore((s) => s.addSession);
  const updateSession = useStore((s) => s.updateSession);
  const deleteSession = useStore((s) => s.deleteSession);

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [groupModal, setGroupModal] = useState<"add" | "edit" | null>(null);
  const [txnModal, setTxnModal] = useState<"DEPOSIT" | "WITHDRAW" | null>(null);
  const [sessionModal, setSessionModal] = useState<"add" | "edit" | null>(null);

  const cur = settings.currency;
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0] ?? null;

  const groupSessions = useMemo(
    () =>
      activeGroup
        ? [...sessions]
            .filter((s) => s.groupId === activeGroup.id)
            .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name))
        : [],
    [sessions, activeGroup]
  );
  const gstats = useMemo(
    () => (activeGroup ? computeGroup(activeGroup, sessions) : null),
    [activeGroup, sessions]
  );

  const selectedSession =
    groupSessions.find((s) => s.id === selectedSessionId) ??
    groupSessions[groupSessions.length - 1] ??
    null;

  // --- Empty state -------------------------------------------------------
  if (!groups.length) {
    return (
      <div className="space-y-4">
        <SectionTitle title="Money Management" subtitle="Fund a group, trade sessions toward your goal" />
        <div className="card p-10 text-center">
          <p className="text-text font-medium">No groups yet</p>
          <p className="text-sm text-muted mt-1 max-w-md mx-auto">
            A group is one run: deposit a starting amount (e.g. {fmtMoney(DEFAULT_DEPOSIT, cur)}) and
            trade sessions toward your goal ({fmtMoney(DEFAULT_GOAL, cur)}). Create one to begin.
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <button className="btn-primary" onClick={() => setGroupModal("add")}>
              <FolderPlus size={15} /> New group
            </button>
          </div>
        </div>
        <Modal open={groupModal !== null} onClose={() => setGroupModal(null)} title="New group">
          <GroupForm
            groups={groups}
            currency={cur}
            onCancel={() => setGroupModal(null)}
            onCreate={(data, fundFrom) => {
              const id = addGroup(data, fundFrom);
              setActiveGroupId(id);
              setGroupModal(null);
            }}
          />
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        title="Money Management"
        subtitle={`${groups.length} group${groups.length === 1 ? "" : "s"} · deposit → sessions → goal`}
        right={
          <button className="btn-primary" onClick={() => setGroupModal("add")}>
            <FolderPlus size={15} /> New group
          </button>
        }
      />

      {/* Group switcher */}
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => {
            const active = g.id === activeGroup?.id;
            const { balance } = computeGroup(g, sessions);
            return (
              <button
                key={g.id}
                onClick={() => {
                  setActiveGroupId(g.id);
                  setSelectedSessionId(null);
                }}
                className={`chip border ${
                  active ? "border-brand bg-brand/15 text-brand" : "border-border text-muted hover:bg-panel2"
                }`}
              >
                {g.name}
                <span className="tabular-nums">· {fmtMoney(balance, cur)}</span>
              </button>
            );
          })}
        </div>
      )}

      {activeGroup && gstats && (
        <>
          {/* Goal banner — the primary objective */}
          <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">{activeGroup.name}</h3>
                  <span className="text-xs text-muted">since {activeGroup.createdAt}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tabular-nums">
                    {fmtMoney(gstats.balance, cur)}
                  </span>
                  <span className="text-sm text-muted">
                    / goal {fmtMoney(gstats.goal, cur)}
                  </span>
                </div>
                <div className="text-xs text-muted mt-1 flex items-center gap-1.5">
                  <Target size={13} /> Start {fmtMoney(gstats.startCapital, cur)} → Goal{" "}
                  {fmtMoney(gstats.goal, cur)}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button className="btn-ghost" onClick={() => setTxnModal("DEPOSIT")}>
                  <ArrowDownToLine size={15} /> Deposit
                </button>
                <button className="btn-ghost" onClick={() => setTxnModal("WITHDRAW")}>
                  <ArrowUpFromLine size={15} /> Withdraw
                </button>
                <button
                  className="p-2 text-muted hover:text-text rounded hover:bg-panel2"
                  onClick={() => setGroupModal("edit")}
                  title="Edit group"
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="p-2 text-muted hover:text-loss rounded hover:bg-panel2"
                  title="Delete group"
                  onClick={() => {
                    if (
                      confirm(
                        `Delete ${activeGroup.name} and its ${gstats.sessions} session(s)? This cannot be undone.`
                      )
                    ) {
                      deleteGroup(activeGroup.id);
                      setActiveGroupId(null);
                      setSelectedSessionId(null);
                    }
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Progress to goal */}
            <div className="mt-4">
              <div className="h-2.5 rounded-full bg-panel2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, gstats.progress))}%` }}
                />
              </div>
              <div className="text-xs text-muted mt-1">{fmtPct(gstats.progress)} of goal reached</div>
            </div>

            {/* Cash-flow stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <Stat label="Deposited" value={fmtMoney(gstats.deposited, cur)} />
              <Stat label="Withdrawn" value={fmtMoney(gstats.withdrawn, cur)} />
              <Stat
                label="Trading P&L"
                value={`${gstats.sessionsNet >= 0 ? "+" : ""}${fmtMoney(gstats.sessionsNet, cur)}`}
                tone={gstats.sessionsNet >= 0 ? "win" : "loss"}
                hint={`${gstats.sessions} session${gstats.sessions === 1 ? "" : "s"}`}
              />
              <Stat
                label="Balance"
                value={fmtMoney(gstats.balance, cur)}
                tone={gstats.balance >= gstats.startCapital ? "win" : "loss"}
              />
            </div>

            {activeGroup.txns.length > 0 && (
              <CashFlow group={activeGroup} currency={cur} />
            )}
          </div>

          {/* Sessions */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted">Sessions in {activeGroup.name}</h4>
            <button
              className="btn-ghost"
              onClick={() => {
                setSessionModal("add");
              }}
            >
              <Plus size={15} /> New session
            </button>
          </div>

          {groupSessions.length === 0 ? (
            <div className="card p-10 text-center text-muted">
              No sessions in this group yet — add the first one.
            </div>
          ) : (
            <div className="grid md:grid-cols-[260px_1fr] gap-4">
              <SessionList
                sessions={groupSessions}
                selectedId={selectedSession?.id ?? null}
                onSelect={setSelectedSessionId}
                currency={cur}
                total={gstats.sessionsNet}
              />
              {selectedSession && (
                <SessionDetail
                  key={selectedSession.id}
                  session={selectedSession}
                  currency={cur}
                  onEdit={() => {
                    setSelectedSessionId(selectedSession.id);
                    setSessionModal("edit");
                  }}
                  onDelete={() => {
                    if (confirm(`Delete session ${selectedSession.name}?`)) {
                      deleteSession(selectedSession.id);
                      setSelectedSessionId(null);
                    }
                  }}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Group modal */}
      <Modal
        open={groupModal !== null}
        onClose={() => setGroupModal(null)}
        title={groupModal === "edit" ? "Edit group" : "New group"}
      >
        {groupModal === "edit" && activeGroup ? (
          <GroupEditForm
            group={activeGroup}
            onCancel={() => setGroupModal(null)}
            onSave={(patch) => {
              updateGroup(activeGroup.id, patch);
              setGroupModal(null);
            }}
          />
        ) : (
          <GroupForm
            groups={groups}
            currency={cur}
            onCancel={() => setGroupModal(null)}
            onCreate={(data, fundFrom) => {
              const id = addGroup(data, fundFrom);
              setActiveGroupId(id);
              setSelectedSessionId(null);
              setGroupModal(null);
            }}
          />
        )}
      </Modal>

      {/* Deposit / Withdraw modal */}
      <Modal
        open={txnModal !== null}
        onClose={() => setTxnModal(null)}
        title={txnModal === "WITHDRAW" ? "Withdraw" : "Deposit"}
      >
        {txnModal && activeGroup && gstats && (
          <TxnForm
            type={txnModal}
            balance={gstats.balance}
            currency={cur}
            onCancel={() => setTxnModal(null)}
            onSubmit={(t) => {
              addTxn(activeGroup.id, t);
              setTxnModal(null);
            }}
          />
        )}
      </Modal>

      {/* Session modal */}
      <Modal
        open={sessionModal !== null}
        onClose={() => setSessionModal(null)}
        title={sessionModal === "edit" ? "Edit session" : "New session"}
      >
        {activeGroup && (
          <SessionForm
            initial={sessionModal === "edit" ? selectedSession ?? undefined : undefined}
            suggestedName={`S${groupSessions.length + 1}`}
            onCancel={() => setSessionModal(null)}
            onSubmit={(data) => {
              if (sessionModal === "edit" && selectedSession) {
                updateSession(selectedSession.id, data);
              } else {
                const id = addSession({ ...data, groupId: activeGroup.id });
                setSelectedSessionId(id);
              }
              setSessionModal(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

/** Compact deposit/withdrawal ledger for a group. */
function CashFlow({ group, currency }: { group: Group; currency: string }) {
  const deleteTxn = useStore((s) => s.deleteTxn);
  return (
    <div className="mt-4 border-t border-border pt-3">
      <div className="text-xs text-muted mb-2">Cash flow</div>
      <div className="space-y-1">
        {[...group.txns]
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((t) => (
            <div key={t.id} className="flex items-center justify-between text-sm group/txn">
              <span className="text-muted text-xs">
                {t.date} · {t.note || (t.type === "DEPOSIT" ? "Deposit" : "Withdraw")}
              </span>
              <span className="flex items-center gap-2">
                <span className={`tabular-nums ${t.type === "DEPOSIT" ? "text-win" : "text-loss"}`}>
                  {t.type === "DEPOSIT" ? "+" : "−"}
                  {fmtMoney(t.amount, currency)}
                </span>
                <button
                  className="opacity-0 group-hover/txn:opacity-100 p-1 text-muted hover:text-loss rounded"
                  onClick={() => deleteTxn(group.id, t.id)}
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

/** Left pane — the sessions overview, scoped to the active group. */
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
        <span className="text-xs uppercase tracking-wide text-muted">Trading P&L</span>
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

/** Right pane — a single session: capital, plan, entries, net. */
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
                    <button onClick={() => cycleOutcome(e)} title="Click to change result" className="cursor-pointer">
                      <Badge tone={e.outcome === "WIN" ? "win" : e.outcome === "LOSS" ? "loss" : "default"}>
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
                  {stats.wins}W · {stats.losses}L{stats.pending ? ` · ${stats.pending} open` : ""}
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

type SessionFormData = Omit<Session, "id" | "entries" | "groupId">;

function GroupForm({
  groups,
  currency,
  onCreate,
  onCancel,
}: {
  groups: Group[];
  currency: string;
  onCreate: (
    data: { name: string; goal: number; notes: string; deposit: number },
    fundFromGroupId?: string
  ) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(`Group ${groups.length + 1}`);
  const [deposit, setDeposit] = useState(DEFAULT_DEPOSIT);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [fundFrom, setFundFrom] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onCreate(
          { name: name.trim() || `Group ${groups.length + 1}`, goal: Number(goal) || 0, notes, deposit: Number(deposit) || 0 },
          fundFrom || undefined
        );
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Group name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Goal">
          <Input type="number" step="any" value={goal} onChange={(e) => setGoal(e.target.valueAsNumber)} />
        </Field>
        <Field label="Starting deposit">
          <Input type="number" step="any" value={deposit} onChange={(e) => setDeposit(e.target.valueAsNumber)} />
        </Field>
        <Field label="Fund from (optional)">
          <Select
            value={fundFrom}
            onChange={(e) => setFundFrom(e.target.value)}
            options={[
              { value: "", label: "New money" },
              ...groups.map((g) => ({ value: g.id, label: `Withdraw from ${g.name}` })),
            ]}
          />
        </Field>
      </div>
      {fundFrom && (
        <div className="text-xs text-muted -mt-1">
          {fmtMoney(Number(deposit) || 0, currency)} will be withdrawn from the selected group and
          deposited here.
        </div>
      )}
      <Field label="Notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Plan for this run…" />
      </Field>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Create group
        </button>
      </div>
    </form>
  );
}

function GroupEditForm({
  group,
  onSave,
  onCancel,
}: {
  group: Group;
  onSave: (patch: { name: string; goal: number; notes: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(group.name);
  const [goal, setGoal] = useState(group.goal);
  const [notes, setNotes] = useState(group.notes);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ name: name.trim() || group.name, goal: Number(goal) || 0, notes });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Group name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Goal">
          <Input type="number" step="any" value={goal} onChange={(e) => setGoal(e.target.valueAsNumber)} />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <p className="text-xs text-muted -mt-1">
        To change funds, use the Deposit / Withdraw buttons — they keep the cash-flow history accurate.
      </p>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save
        </button>
      </div>
    </form>
  );
}

function TxnForm({
  type,
  balance,
  currency,
  onSubmit,
  onCancel,
}: {
  type: "DEPOSIT" | "WITHDRAW";
  balance: number;
  currency: string;
  onSubmit: (t: { date: string; type: "DEPOSIT" | "WITHDRAW"; amount: number; note?: string }) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(type === "WITHDRAW" ? 0 : DEFAULT_DEPOSIT);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const over = type === "WITHDRAW" && amount > balance;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ date, type, amount: Math.abs(Number(amount) || 0), note: note.trim() || undefined });
      }}
    >
      {type === "WITHDRAW" && (
        <div className="text-sm text-muted">
          Available balance: <span className="text-text font-medium">{fmtMoney(balance, currency)}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount">
          <Input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.valueAsNumber)} autoFocus />
        </Field>
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Note (optional)">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === "WITHDRAW" ? "Profit taking…" : "Top-up…"} />
      </Field>
      {over && <div className="text-xs text-loss">Withdrawing more than the current balance.</div>}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {type === "WITHDRAW" ? "Withdraw" : "Deposit"}
        </button>
      </div>
    </form>
  );
}

function SessionForm({
  initial,
  suggestedName,
  onSubmit,
  onCancel,
}: {
  initial?: Session;
  suggestedName: string;
  onSubmit: (d: SessionFormData) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? suggestedName);
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
          <Input type="number" step="any" value={capital} onChange={(e) => setCapital(e.target.valueAsNumber)} />
        </Field>
        <Field label="Plan steps">
          <Input type="number" min={1} value={steps} onChange={(e) => setSteps(e.target.valueAsNumber)} />
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
  const [investment, setInvestment] = useState(initial?.investment ?? Math.round(suggestedInvestment));
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
        onSubmit({ investment: Number(investment) || 0, payout: Number(payout) || 0, outcome });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Investment (stake)">
          <Input type="number" step="any" value={investment} onChange={(e) => setInvestment(e.target.valueAsNumber)} autoFocus />
        </Field>
        <Field label="Expected return (payout)">
          <Input type="number" step="any" value={payout} onChange={(e) => setPayout(e.target.valueAsNumber)} />
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
