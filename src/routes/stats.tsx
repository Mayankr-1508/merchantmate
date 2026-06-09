import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import { useUdhaar, useStock, useSales, useSettings, fmt, todayISO, daysSince } from "@/lib/storage";
import { tr } from "@/lib/i18n";

export const Route = createFileRoute("/stats")({
  head: () => ({ meta: [{ title: "Stats — MerchantMate" }] }),
  component: StatsPage,
});

type Range = "daily" | "weekly" | "monthly";

function StatsPage() {
  const [udhaar] = useUdhaar();
  const [stock] = useStock();
  const [sales] = useSales();
  const [settings] = useSettings();
  const lang = settings.lang;
  const [range, setRange] = useState<Range>("daily");

  const today = todayISO();
  const givenToday = udhaar.filter((u) => u.date === today).reduce((s, u) => s + u.amount, 0);
  const clearedToday = udhaar
    .filter((u) => u.paid && u.paidAt?.slice(0, 10) === today)
    .reduce((s, u) => s + u.amount, 0);
  const netOutstanding = udhaar.filter((u) => !u.paid).reduce((s, u) => s + u.amount, 0);
  const todaySale = sales.find((s) => s.date === today);
  const totalSalesToday = (todaySale?.cash ?? 0) + (todaySale?.upi ?? 0);

  const profitMargin = useMemo(() => {
    if (!stock.length) return 0;
    const avg = stock.reduce((s, i) => s + (i.price - i.cost) / Math.max(1, i.price), 0) / stock.length;
    return Math.max(0.05, Math.min(0.6, avg));
  }, [stock]);
  const estProfitToday = totalSalesToday * profitMargin;

  const salesSeries = useMemo(() => {
    const periods = range === "daily" ? 7 : range === "weekly" ? 6 : 6;
    const out: { p: string; sales: number; profit: number }[] = [];
    for (let i = periods - 1; i >= 0; i--) {
      const d = new Date();
      let label = "";
      let filter: (iso: string) => boolean;
      if (range === "daily") {
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().slice(0, 10);
        label = d.toLocaleDateString("en-IN", { weekday: "short" });
        filter = (x) => x === iso;
      } else if (range === "weekly") {
        d.setDate(d.getDate() - i * 7);
        const start = new Date(d);
        start.setDate(start.getDate() - 6);
        label = `W${periods - i}`;
        filter = (x) => {
          const dx = new Date(x);
          return dx >= start && dx <= d;
        };
      } else {
        d.setMonth(d.getMonth() - i);
        const y = d.getFullYear(), m = d.getMonth();
        label = d.toLocaleDateString("en-IN", { month: "short" });
        filter = (x) => {
          const dx = new Date(x);
          return dx.getFullYear() === y && dx.getMonth() === m;
        };
      }
      const s = sales.filter((s) => filter(s.date)).reduce((sum, s) => sum + s.cash + s.upi, 0);
      out.push({ p: label, sales: s, profit: s * profitMargin });
    }
    return out;
  }, [sales, range, profitMargin]);

  const weekUdhaar = useMemo(() => {
    const out: { d: string; given: number; cleared: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-IN", { weekday: "short" });
      const given = udhaar.filter((u) => u.date === iso).reduce((s, u) => s + u.amount, 0);
      const cleared = udhaar
        .filter((u) => u.paid && u.paidAt?.slice(0, 10) === iso)
        .reduce((s, u) => s + u.amount, 0);
      out.push({ d: label, given, cleared });
    }
    return out;
  }, [udhaar]);

  const monthTrend = useMemo(() => {
    const out: { m: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear(), m = d.getMonth();
      const total = udhaar
        .filter((u) => {
          const dx = new Date(u.date);
          return dx.getFullYear() === y && dx.getMonth() === m;
        })
        .reduce((s, u) => s + u.amount, 0);
      out.push({ m: d.toLocaleDateString("en-IN", { month: "short" }), total });
    }
    return out;
  }, [udhaar]);

  const customerTotals = useMemo(() => {
    const map = new Map<string, { name: string; total: number; lastDate: string }>();
    for (const e of udhaar) {
      if (e.paid) continue;
      const cur = map.get(e.customer) ?? { name: e.customer, total: 0, lastDate: e.date };
      cur.total += e.amount;
      if (e.date > cur.lastDate) cur.lastDate = e.date;
      map.set(e.customer, cur);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [udhaar]);

  const top5 = customerTotals.slice(0, 5);
  const risk = customerTotals.filter((c) => daysSince(c.lastDate) >= 30);
  const stockoutItems = [...stock].filter((s) => (s.lowCount ?? 0) > 0).sort((a, b) => (b.lowCount ?? 0) - (a.lowCount ?? 0)).slice(0, 5);
  const stockValue = stock.reduce((s, i) => s + i.quantity * i.cost, 0);

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pt-4">
      <h1 className="text-2xl font-extrabold text-primary">📊 {tr("stats", lang)}</h1>

      <div className="rounded-2xl bg-card p-4 shadow-card">
        <h3 className="mb-3 text-base font-bold">{tr("todaySummary", lang)}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Mini label={tr("given", lang)} value={fmt(givenToday)} color="text-saffron" />
          <Mini label={tr("cleared", lang)} value={fmt(clearedToday)} color="text-success" />
          <Mini label={tr("netOutstanding", lang)} value={fmt(netOutstanding)} color="text-destructive" />
          <Mini label={tr("totalSales", lang)} value={fmt(totalSalesToday)} color="text-primary" />
          <Mini label={tr("estProfit", lang)} value={fmt(estProfitToday)} color="text-success" />
          <Mini label={tr("stockValue", lang)} value={fmt(stockValue)} color="text-primary" />
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">{tr("netSales", lang)} & {tr("estProfit", lang)}</h3>
        </div>
        <div className="mb-3 flex gap-1 rounded-xl bg-muted p-1">
          {(["daily", "weekly", "monthly"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={
                "flex-1 rounded-lg py-1.5 text-xs font-bold " +
                (range === r ? "bg-card text-primary shadow" : "text-muted-foreground")
              }
            >
              {tr(r, lang)}
            </button>
          ))}
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesSeries}>
              <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="p" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="sales" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" fill="var(--saffron)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-card">
        <h3 className="mb-2 text-base font-bold">{tr("weekChart", lang)}</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekUdhaar}>
              <XAxis dataKey="d" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="given" fill="var(--saffron)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="cleared" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-card">
        <h3 className="mb-2 text-base font-bold">{tr("monthTrend", lang)}</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthTrend}>
              <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="m" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Line type="monotone" dataKey="total" stroke="var(--saffron)" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-card">
        <h3 className="mb-3 text-base font-bold">🏆 {tr("top5", lang)}</h3>
        {top5.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tr("noUdhaar", lang)}</p>
        ) : (
          <div className="space-y-2">
            {top5.map((c, i) => {
              const max = top5[0].total || 1;
              return (
                <div key={c.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold">{i + 1}. {c.name}</span>
                    <span className="font-bold text-destructive">{fmt(c.total)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.total / max) * 100}%`, background: "var(--saffron)" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-card">
        <h3 className="mb-3 text-base font-bold">⚠️ {tr("riskList", lang)}</h3>
        {risk.length === 0 ? (
          <p className="text-sm text-muted-foreground">All clear 👍</p>
        ) : (
          <div className="space-y-2">
            {risk.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-xl bg-destructive/10 px-3 py-2">
                <div>
                  <div className="font-bold">{c.name}</div>
                  <div className="text-xs text-destructive">{daysSince(c.lastDate)} {tr("daysOld", lang)}</div>
                </div>
                <div className="font-extrabold text-destructive">{fmt(c.total)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-card p-4 shadow-card">
        <h3 className="mb-3 text-base font-bold">📉 {tr("frequentLow", lang)}</h3>
        {stockoutItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tr("noLow", lang)}</p>
        ) : (
          <div className="space-y-1.5">
            {stockoutItems.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-accent px-3 py-2">
                <span className="font-semibold">{s.emoji} {s.name}</span>
                <span className="text-xs font-bold text-saffron">{s.lowCount}× low</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-2.5">
      <div className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</div>
      <div className={"text-lg font-extrabold " + color}>{value}</div>
    </div>
  );
}
