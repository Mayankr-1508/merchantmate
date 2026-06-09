import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useProfile, useSettings, useUdhaar, useStock, useSales, fmt, todayISO } from "@/lib/storage";
import { tr } from "@/lib/i18n";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import heroImg from "@/assets/kirana-hero.jpg";
import avatarImg from "@/assets/shopkeeper-avatar.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MerchantMate — Aapki dukaan, aapka hisaab" },
      { name: "description", content: "Kirana store udhaar, stock & sales tracker for Indian shopkeepers." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [profile] = useProfile();
  const [settings] = useSettings();
  const [udhaar] = useUdhaar();
  const [stock] = useStock();
  const [sales, setSales] = useSales();
  const lang = settings.lang;

  const pending = udhaar.filter((u) => !u.paid);
  const totalPending = pending.reduce((s, u) => s + u.amount, 0);
  const uniqueCustomers = new Set(pending.map((u) => u.customer)).size;
  const lowStock = stock.filter((s) => s.quantity <= s.minStock).length;
  const today = todayISO();
  const todayEntries = udhaar.filter((u) => u.date === today).length;

  const weekData = useMemo(() => {
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

  const [cash, setCash] = useState("");
  const [upi, setUpi] = useState("");
  const saveSale = () => {
    const c = Number(cash) || 0;
    const u = Number(upi) || 0;
    if (!c && !u) return;
    const existing = sales.find((s) => s.date === today);
    if (existing) {
      setSales(sales.map((s) => (s.date === today ? { ...s, cash: s.cash + c, upi: s.upi + u } : s)));
    } else {
      setSales([...sales, { date: today, cash: c, upi: u }]);
    }
    setCash("");
    setUpi("");
    toast.success(tr("saved", lang));
  };

  const profilePhoto = profile?.photoDataUrl || avatarImg;

  return (
    <div className="mx-auto max-w-md">
      {/* Header with greeting + avatar */}
      <div className="flex items-start justify-between px-5 pt-5">
        <div>
          <p className="text-base font-semibold text-foreground/80">{tr("namaste", lang)} 🙏</p>
          <h1 className="text-2xl font-extrabold leading-tight text-primary">
            {profile?.shopName} 👋
          </h1>
          <p className="mt-0.5 text-xs font-semibold" style={{ color: "var(--saffron)" }}>
            {tr("tagline", lang)}
          </p>
        </div>
        <Link to="/profile" aria-label="Profile">
          <img
            src={profilePhoto}
            alt="Shopkeeper avatar"
            className="size-12 rounded-full border-2 object-cover shadow-card"
            style={{ borderColor: "var(--saffron)" }}
            width={48}
            height={48}
          />
        </Link>
      </div>

      {/* Hero illustration */}
      <div className="relative mt-3 overflow-hidden">
        <img
          src={heroImg}
          alt="Indian kirana shop with shopkeeper"
          className="h-52 w-full object-contain"
          width={1280}
          height={768}
        />
      </div>

      <div className="space-y-5 px-4 pt-2">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            emoji="📒"
            label={tr("totalUdhaar", lang)}
            value={fmt(totalPending)}
            sub={`${uniqueCustomers} ${tr("customers", lang)}`}
            tone="default"
          />
          <StatCard
            emoji="⚠️"
            label={tr("lowStock", lang)}
            value={String(lowStock)}
            sub={tr("items", lang)}
            tone={lowStock > 0 ? "danger" : "default"}
          />
          <StatCard
            emoji="📝"
            label={tr("todayEntries", lang)}
            value={String(todayEntries)}
            sub=""
            tone="accent"
          />
        </div>

        {/* Week chart */}
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <h3 className="mb-2 text-sm font-bold">{tr("weekChart", lang)}</h3>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <XAxis dataKey="d" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}
                  formatter={(v: number) => fmt(v)}
                />
                <Bar dataKey="given" fill="var(--saffron)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="cleared" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Big buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/udhaar"
            className="flex flex-col items-center gap-2 rounded-2xl bg-primary px-4 py-5 text-primary-foreground shadow-card active:scale-95"
          >
            <span className="text-3xl">📒</span>
            <span className="text-base font-bold">{tr("udhaar", lang)}</span>
          </Link>
          <Link
            to="/stock"
            className="flex flex-col items-center gap-2 rounded-2xl px-4 py-5 shadow-card active:scale-95"
            style={{ background: "var(--saffron)", color: "var(--saffron-foreground)" }}
          >
            <span className="text-3xl">📦</span>
            <span className="text-base font-bold">Stock & Reorder</span>
          </Link>
        </div>

        {/* Today's sales */}
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <h3 className="mb-3 text-base font-bold">💰 {tr("todaySales", lang)}</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">{tr("cash", lang)} (₹)</span>
              <input
                inputMode="numeric"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 text-lg font-bold"
                placeholder="0"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">{tr("upi", lang)} (₹)</span>
              <input
                inputMode="numeric"
                value={upi}
                onChange={(e) => setUpi(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 text-lg font-bold"
                placeholder="0"
              />
            </label>
          </div>
          <button
            onClick={saveSale}
            className="mt-3 h-12 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground active:scale-95"
          >
            {tr("save", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  emoji, label, value, sub, tone,
}: { emoji: string; label: string; value: string; sub: string; tone: "default" | "danger" | "accent" }) {
  const valueColor =
    tone === "danger" ? "text-destructive" : tone === "accent" ? "text-saffron" : "text-primary";
  return (
    <div className="rounded-2xl bg-card p-3 shadow-card">
      <div className="text-xl">{emoji}</div>
      <div className={"mt-1 text-lg font-extrabold leading-tight " + valueColor}>{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
