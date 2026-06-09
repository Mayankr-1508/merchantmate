import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  useUdhaar, useProfile, useSettings, uid, todayISO, fmt, fmtDate, daysSince,
  COMMON_ITEMS, type UdhaarEntry,
} from "@/lib/storage";
import { tr } from "@/lib/i18n";
import { Search, MessageCircle, Check, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

type Search = { add?: number; c?: string };

export const Route = createFileRoute("/udhaar")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    add: s.add ? 1 : undefined,
    c: typeof s.c === "string" ? s.c : undefined,
  }),
  head: () => ({ meta: [{ title: "Udhaar — MerchantMate" }] }),
  component: UdhaarPage,
});

function UdhaarPage() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const [udhaar, setUdhaar] = useUdhaar();
  const [profile] = useProfile();
  const [settings] = useSettings();
  const lang = settings.lang;
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (search.add) {
      setShowAdd(true);
      nav({ search: { c: search.c }, replace: true });
    }
  }, [search.add, search.c, nav]);

  const customers = useMemo(() => {
    const map = new Map<string, { name: string; total: number; lastDate: string; entries: UdhaarEntry[] }>();
    for (const e of udhaar) {
      const cur = map.get(e.customer) ?? { name: e.customer, total: 0, lastDate: e.date, entries: [] };
      if (!e.paid) cur.total += e.amount;
      if (e.date > cur.lastDate) cur.lastDate = e.date;
      cur.entries.push(e);
      map.set(e.customer, cur);
    }
    return [...map.values()]
      .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.total - a.total);
  }, [udhaar, q]);

  const activeCustomer = search.c ? customers.find((c) => c.name === search.c) : null;

  const markPaid = (id: string) => {
    setUdhaar(udhaar.map((u) => (u.id === id ? { ...u, paid: true, paidAt: new Date().toISOString() } : u)));
    toast.success(tr("paidDone", lang));
  };

  const waLink = (name: string, amount: number) => {
    const msg = `Namaste ${name} bhai, aapka ${profile?.shopName ?? ""} par ${fmt(amount)} baaki hai. Kabhi bhi aa ke clear kar sakte hain. Dhanyavaad 🙏`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const bulkRemind = () => {
    const pending = customers.filter((c) => c.total > 0);
    if (!pending.length) return;
    const msg = pending.map((c) => `${c.name}: ${fmt(c.total)}`).join("\n");
    const text = `Namaste! ${profile?.shopName ?? ""} se reminder:\n\n${msg}\n\nKabhi bhi aa ke clear kar sakte hain. Dhanyavaad 🙏`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (activeCustomer) {
    return (
      <div className="mx-auto max-w-md px-4 pt-4">
        <button
          onClick={() => nav({ search: {} })}
          className="mb-3 flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <ChevronLeft className="size-4" /> {tr("udhaar", lang)}
        </button>
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <Avatar name={activeCustomer.name} />
            <div className="flex-1">
              <div className="text-lg font-bold">{activeCustomer.name}</div>
              <div className="text-sm text-muted-foreground">
                {activeCustomer.entries.length} entries
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">{tr("totalUdhaar", lang)}</div>
              <div className="text-xl font-extrabold text-destructive">{fmt(activeCustomer.total)}</div>
            </div>
          </div>
          {activeCustomer.total > 0 && (
            <a
              href={waLink(activeCustomer.name, activeCustomer.total)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex h-12 items-center justify-center gap-2 rounded-xl text-base font-bold text-white"
              style={{ background: "#25D366" }}
            >
              <MessageCircle className="size-5" /> {tr("sendWhatsApp", lang)}
            </a>
          )}
        </div>

        <h3 className="mt-5 mb-2 text-sm font-bold text-muted-foreground">History</h3>
        <div className="space-y-2">
          {[...activeCustomer.entries].sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
            <div key={e.id} className="rounded-2xl bg-card p-3 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-base font-semibold">{e.items}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(e.date)}</div>
                </div>
                <div className="text-right">
                  <div className={"text-lg font-extrabold " + (e.paid ? "text-success line-through opacity-60" : "text-destructive")}>
                    {fmt(e.amount)}
                  </div>
                </div>
              </div>
              {!e.paid && (
                <button
                  onClick={() => markPaid(e.id)}
                  className="mt-2 flex h-10 w-full items-center justify-center gap-1 rounded-xl bg-success/15 text-sm font-bold text-success"
                >
                  <Check className="size-4" /> {tr("paidDone", lang)}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-4">
      <h1 className="mb-3 text-2xl font-extrabold text-primary">📒 {tr("udhaar", lang)}</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tr("searchCustomer", lang)}
          className="h-12 w-full rounded-2xl border border-border bg-card pl-10 pr-4 text-base shadow-card focus:border-primary focus:outline-none"
        />
      </div>

      {customers.filter((c) => c.total > 0).length > 0 && (
        <button
          onClick={bulkRemind}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white"
          style={{ background: "#25D366" }}
        >
          <MessageCircle className="size-4" /> {tr("bulkRemind", lang)}
        </button>
      )}

      <div className="mt-4 space-y-2">
        {customers.length === 0 && (
          <EmptyState text={tr("noUdhaar", lang)} />
        )}
        {customers.map((c) => {
          const days = daysSince(c.lastDate);
          return (
            <button
              key={c.name}
              onClick={() => nav({ search: { c: c.name } })}
              className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-card active:scale-[0.98]"
            >
              <Avatar name={c.name} />
              <div className="flex-1">
                <div className="text-base font-bold">{c.name}</div>
                {c.total > 0 && days > 7 && (
                  <div className="text-xs font-semibold text-warning">
                    {days} {tr("daysOld", lang)}
                  </div>
                )}
                {c.total === 0 && <div className="text-xs text-success">✓ Clear</div>}
              </div>
              <div className={"text-lg font-extrabold " + (c.total > 0 ? "text-destructive" : "text-muted-foreground")}>
                {fmt(c.total)}
              </div>
            </button>
          );
        })}
      </div>

      {showAdd && (
        <AddUdhaarModal
          onClose={() => setShowAdd(false)}
          onSave={(e) => {
            setUdhaar([...udhaar, e]);
            setShowAdd(false);
            toast.success(tr("saved", lang));
          }}
          existingNames={[...new Set(udhaar.map((u) => u.customer))]}
          lang={lang}
        />
      )}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const letter = (name[0] || "?").toUpperCase();
  const hue = name.charCodeAt(0) * 7 % 360;
  return (
    <div
      className="grid size-12 place-items-center rounded-full text-lg font-extrabold text-white"
      style={{ background: `hsl(${hue} 60% 45%)` }}
    >
      {letter}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-card p-8 text-center shadow-card">
      <div className="text-base font-semibold text-muted-foreground">{text}</div>
    </div>
  );
}

function AddUdhaarModal({
  onClose, onSave, existingNames, lang,
}: {
  onClose: () => void;
  onSave: (e: UdhaarEntry) => void;
  existingNames: string[];
  lang: "hi" | "hinglish" | "en";
}) {
  const [name, setName] = useState("");
  const [items, setItems] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());

  const suggestions = existingNames.filter((n) =>
    n.toLowerCase().startsWith(name.toLowerCase()) && n.toLowerCase() !== name.toLowerCase()
  ).slice(0, 4);

  const toggleItem = (it: string) => {
    const parts = items.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.includes(it)) setItems(parts.filter((p) => p !== it).join(", "));
    else setItems([...parts, it].join(", "));
  };

  const save = () => {
    if (!name || !amount) return;
    onSave({
      id: uid(),
      customer: name.trim(),
      items: items || "—",
      amount: Number(amount),
      date,
      paid: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
        <h2 className="mb-4 text-xl font-extrabold">📒 {tr("newUdhaar", lang)}</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold">{tr("customerName", lang)}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 text-base"
            />
            {suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setName(s)}
                    className="rounded-full bg-accent px-3 py-1 text-xs font-semibold"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold">{tr("kyaLiya", lang)}</label>
            <input
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder="Maggi, dahi, ..."
              className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 text-base"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {COMMON_ITEMS.map((it) => (
                <button
                  key={it.name}
                  onClick={() => toggleItem(it.name)}
                  className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold"
                >
                  {it.emoji} {it.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold">{tr("amount", lang)} (₹)</label>
              <input
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 text-lg font-bold"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">{tr("date", lang)}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 text-base"
              />
            </div>
          </div>

          <button
            onClick={save}
            disabled={!name || !amount}
            className="h-14 w-full rounded-2xl text-lg font-bold disabled:opacity-50"
            style={{ background: "var(--saffron)", color: "var(--saffron-foreground)" }}
          >
            {tr("save", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
