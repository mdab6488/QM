"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EquityPoint, GroupStat, DailyStat } from "@/lib/stats";

const axis = { stroke: "#8b97b0", fontSize: 11 };
const grid = "#1f2a40";

function MoneyTip({ active, payload, label, currency = "$" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs">
      <div className="text-muted mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="tabular-nums">
          {p.name}: {currency}
          {Number(p.value).toLocaleString()}
        </div>
      ))}
    </div>
  );
}

export function EquityCurveChart({
  data,
  currency = "$",
}: {
  data: EquityPoint[];
  currency?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="index" {...axis} tickLine={false} axisLine={false} />
        <YAxis {...axis} tickLine={false} axisLine={false} width={48} />
        <Tooltip content={<MoneyTip currency={currency} />} />
        <Area
          type="monotone"
          dataKey="equity"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#eq)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PnlBars({
  data,
  currency = "$",
}: {
  data: DailyStat[];
  currency?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={grid} vertical={false} />
        <XAxis dataKey="date" {...axis} tickLine={false} axisLine={false}
          tickFormatter={(d) => String(d).slice(5)} />
        <YAxis {...axis} tickLine={false} axisLine={false} width={48} />
        <Tooltip content={<MoneyTip currency={currency} />} cursor={{ fill: "#ffffff08" }} />
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pnl >= 0 ? "#22c55e" : "#ef4444"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GroupBars({
  data,
  currency = "$",
  metric = "pnl",
}: {
  data: GroupStat[];
  currency?: string;
  metric?: "pnl" | "winRate";
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 34)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid stroke={grid} horizontal={false} />
        <XAxis type="number" {...axis} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="key"
          {...axis}
          tickLine={false}
          axisLine={false}
          width={90}
        />
        <Tooltip
          cursor={{ fill: "#ffffff08" }}
          content={({ active, payload }: any) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as GroupStat;
            return (
              <div className="card px-3 py-2 text-xs">
                <div className="font-medium mb-1">{d.key}</div>
                <div>Trades: {d.trades}</div>
                <div>Win rate: {d.winRate.toFixed(0)}%</div>
                <div className="tabular-nums">
                  PnL: {currency}
                  {d.pnl.toLocaleString()}
                </div>
              </div>
            );
          }}
        />
        <Bar dataKey={metric} radius={[0, 3, 3, 0]}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={
                metric === "pnl"
                  ? d.pnl >= 0
                    ? "#22c55e"
                    : "#ef4444"
                  : "#3b82f6"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
