import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  useCatalogue, useSettings, uid, fmt, COMMON_ITEMS, UNITS, type CatalogueItem,
} from "@/lib/storage";
import { tr } from "@/lib/i18n";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Search = { add?: number; sort?: SortKey };
type SortKey = "az" | "profit" | "lowStock";

export const Route = createFileRoute("/catalogue")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    add: s.add ? 1 : undefined,
    sort: s.sort === "profit" || s.sort === "lowStock" ? s.sort : "az",
  }),
  head: () => ({ meta: [{ title: "Catalogue — MerchantMate" }] }),
  component: CataloguePage,
});

function CataloguePage() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const [items, setItems] = useCatalogue();
  const [settings] = useSettings();
  const lang = settings.lang;
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<CatalogueItem | null>(null);

  useEffect(() => {
    if (search.add) {
      setShowAdd(true);
      nav({ search: { sort: search.sort }, replace: true });
    }
  }, [search.add, search.sort, nav]);

  const sort = search.sort ?? "az";

  const sorted = useMemo(() => {
    const arr = [...items];
    if (sort === "az") arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "profit")
      arr.sort((a, b) => (b.sellPrice - b.costPrice) - (a.sellPrice - a.costPrice));
    else arr.sort((a, b) => a.quantity - b.quantity);
    return arr;
  }, [items, sort]);

  const remove = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    toast.success(tr("delete", lang));
  };

  const upsert = (it: CatalogueItem) => {
    if (items.some((i) => i.id === it.id)) {
      setItems(items.map((i) => (i.id === it.id ? it : i)));
    } else {
      setItems([...items, it]);
    }
    setShowAdd(false);
    setEditing(null);
    toast.success(tr("saved", lang));
  };

  const sortOpts: { v: SortKey; label: string }[] = [
    { v: "az", label: tr("sortAZ", lang) },
    { v: "profit", label: tr("sortProfit", lang) },
    { v: "lowStock", label: tr("sortLowStock", lang) },
  ];

  return (
    <div className="mx-auto max-w-md px-4 pt-4">
      <h1 className="mb-3 text-2xl font-extrabold text-primary">📋 {tr("catalogue", lang)}</h1>

      <div className="mb-4 flex gap-2 overflow-x-auto rounded-2xl bg-card p-1 shadow-card">
        {sortOpts.map((o) => (
          <button
            key={o.v}
            onClick={() => nav({ search: { sort: o.v } })}
            className={
              "flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold " +
              (sort === o.v ? "bg-primary text-primary-foreground" : "text-muted-foreground")
            }
          >
            {o.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center shadow-card">
          <div className="text-5xl">📦</div>
          <div className="mt-3 text-base font-semibold text-muted-foreground">
            {tr("noCatalogue", lang)}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((it) => {
            const profit = it.sellPrice - it.costPrice;
            return (
              <div key={it.id} className="rounded-2xl bg-card p-3 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="grid size-12 place-items-center rounded-xl bg-accent text-2xl">
                    {it.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-bold">{it.name}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                      <span className="text-muted-foreground">
                        {tr("costPrice", lang)}: <b className="text-foreground">{fmt(it.costPrice)}</b>
                      </span>
                      <span className="text-muted-foreground">
                        {tr("sellPrice", lang)}: <b className="text-foreground">{fmt(it.sellPrice)}</b>
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      <span className="font-bold text-success">
                        +{fmt(profit)} {tr("profit", lang)}
                      </span>
                      <span className="text-muted-foreground">
                        📦 {it.quantity} {it.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setEditing(it);
                        setShowAdd(true);
                      }}
                      aria-label={tr("edit", lang)}
                      className="grid size-8 place-items-center rounded-full bg-muted text-foreground"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => remove(it.id)}
                      aria-label={tr("delete", lang)}
                      className="grid size-8 place-items-center rounded-full bg-destructive/10 text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <CatalogueModal
          initial={editing}
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
          onSave={upsert}
          lang={lang}
        />
      )}
    </div>
  );
}

function CatalogueModal({
  initial, onClose, onSave, lang,
}: {
  initial: CatalogueItem | null;
  onClose: () => void;
  onSave: (i: CatalogueItem) => void;
  lang: "hi" | "hinglish" | "en";
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "📦");
  const [costPrice, setCostPrice] = useState(initial ? String(initial.costPrice) : "");
  const [sellPrice, setSellPrice] = useState(initial ? String(initial.sellPrice) : "");
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : "");
  const [unit, setUnit] = useState(initial?.unit ?? "piece");

  const profit = (Number(sellPrice) || 0) - (Number(costPrice) || 0);

  const save = () => {
    if (!name) return;
    onSave({
      id: initial?.id ?? uid(),
      name: name.trim(),
      emoji,
      costPrice: Number(costPrice) || 0,
      sellPrice: Number(sellPrice) || 0,
      quantity: Number(quantity) || 0,
      unit,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
        <h2 className="mb-4 text-xl font-extrabold">
          📋 {initial ? tr("edit", lang) : tr("newItem", lang)}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold">{tr("itemName", lang)}</label>
            <div className="mt-1 flex gap-2">
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="h-12 w-14 rounded-xl border border-border bg-background text-center text-2xl"
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 flex-1 rounded-xl border border-border bg-background px-3 text-base"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {COMMON_ITEMS.map((it) => (
                <button
                  key={it.name}
                  onClick={() => {
                    setName(it.name);
                    setEmoji(it.emoji);
                  }}
                  className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold"
                >
                  {it.emoji} {it.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold">{tr("costPrice", lang)} (₹)</label>
              <input
                inputMode="numeric"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 text-base"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">{tr("sellPrice", lang)} (₹)</label>
              <input
                inputMode="numeric"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 text-base"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">{tr("quantity", lang)}</label>
              <input
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 text-base"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">{tr("unit", lang)}</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 text-base"
              >
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div
            className="rounded-xl px-3 py-2 text-sm font-bold"
            style={{ background: "color-mix(in oklab, var(--success) 15%, transparent)", color: "var(--success)" }}
          >
            {tr("profit", lang)}: {fmt(profit)} / {unit}
          </div>

          <button
            onClick={save}
            disabled={!name}
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
