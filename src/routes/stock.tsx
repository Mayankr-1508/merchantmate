import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  useStock, useProfile, useSettings, useSupplierPhone, uid, todayISO, fmt, fmtDate,
  COMMON_ITEMS, UNITS, type StockItem,
} from "@/lib/storage";
import { tr } from "@/lib/i18n";
import { MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

function sanitizePhone(p: string) {
  const digits = p.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits;
}


type Search = { add?: number; tab?: "all" | "reorder" };

export const Route = createFileRoute("/stock")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    add: s.add ? 1 : undefined,
    tab: s.tab === "reorder" ? "reorder" : "all",
  }),
  head: () => ({ meta: [{ title: "Stock — MerchantMate" }] }),
  component: StockPage,
});

function StockPage() {
  const search = Route.useSearch();
  const nav = Route.useNavigate();
  const [stock, setStock] = useStock();
  const [profile] = useProfile();
  const [settings] = useSettings();
  const [supplierPhone, setSupplierPhone] = useSupplierPhone();
  const lang = settings.lang;
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (search.add) {
      setShowAdd(true);
      nav({ search: { tab: search.tab }, replace: true });
    }
  }, [search.add, search.tab, nav]);


  const tab = search.tab ?? "all";
  const low = stock.filter((s) => s.quantity <= s.minStock);
  const visible = tab === "reorder" ? low : stock;

  const adjust = (id: string, delta: number) => {
    setStock(
      stock.map((s) => {
        if (s.id !== id) return s;
        const nq = Math.max(0, s.quantity + delta);
        const goingLow = nq <= s.minStock && s.quantity > s.minStock;
        return { ...s, quantity: nq, lowCount: goingLow ? (s.lowCount ?? 0) + 1 : s.lowCount };
      }),
    );
  };

  const markReordered = (id: string) => {
    setStock(
      stock.map((s) =>
        s.id === id
          ? { ...s, lastReorderDate: todayISO(), lastReorderQty: s.minStock * 2 }
          : s,
      ),
    );
    toast.success("Reorder marked");
  };

  const reorderUrl = (() => {
    if (!low.length || supplierPhone.length !== 10) return "";
    const itemsText = low.map((i) => `${i.name} ${i.minStock * 2} ${i.unit}`).join(", ");
    const text = `Reorder list for ${profile?.shopName ?? ""}: ${itemsText}`;
    return `https://wa.me/91${supplierPhone}?text=${encodeURIComponent(text)}`;
  })();

  const sendReorderWA = () => {
    if (!low.length) return;
    if (supplierPhone.length !== 10) {
      toast.error("Supplier phone number add karein (10 digit)");
      return;
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-4">
      <h1 className="mb-3 text-2xl font-extrabold text-primary">📦 Stock</h1>


      <div className="mb-4 flex gap-2 rounded-2xl bg-card p-1 shadow-card">
        {(["all", "reorder"] as const).map((t) => (
          <button
            key={t}
            onClick={() => nav({ search: { tab: t } })}
            className={
              "flex-1 rounded-xl py-2.5 text-sm font-bold " +
              (tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground")
            }
          >
            {t === "all" ? tr("allItems", lang) : `${tr("reorderList", lang)} ${low.length ? `(${low.length})` : ""}`}
          </button>
        ))}
      </div>

      {tab === "reorder" && (
        <div className="mb-3 rounded-2xl bg-card p-3 shadow-card">
          <label className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <Phone className="size-3" /> Supplier Phone Number (10 digit)
          </label>
          <input
            inputMode="numeric"
            maxLength={10}
            value={supplierPhone}
            onChange={(e) => setSupplierPhone(sanitizePhone(e.target.value).slice(0, 10))}
            placeholder="98XXXXXXXX"
            className="mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-base"
          />
          {low.length > 0 && (
            <button
              onClick={sendReorderWA}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white"
              style={{ background: "#25D366" }}
            >
              <MessageCircle className="size-5" /> {tr("sendReorder", lang)}
            </button>
          )}
        </div>
      )}


      <div className="space-y-2">
        {visible.length === 0 && (
          <div className="rounded-2xl bg-card p-8 text-center shadow-card">
            <div className="text-base font-semibold text-muted-foreground">
              {tab === "reorder" ? tr("noLow", lang) : "Add your first item with +"}
            </div>
          </div>
        )}
        {visible.map((s) => {
          const isLow = s.quantity <= s.minStock;
          return (
            <div key={s.id} className="rounded-2xl bg-card p-3 shadow-card">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-xl bg-accent text-2xl">
                  {s.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-base font-bold">{s.name}</div>
                    {isLow && (
                      <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                        LOW
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {fmt(s.price)} / {s.unit} · min {s.minStock}
                  </div>
                  {s.lastReorderDate && (
                    <div className="text-[10px] text-muted-foreground">
                      Last reorder: {fmtDate(s.lastReorderDate)} ({s.lastReorderQty} {s.unit})
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => adjust(s.id, -1)}
                    className="grid size-8 place-items-center rounded-full bg-muted text-base font-bold"
                  >
                    −
                  </button>
                  <div className="min-w-12 text-center text-lg font-extrabold">{s.quantity}</div>
                  <button
                    onClick={() => adjust(s.id, 1)}
                    className="grid size-8 place-items-center rounded-full bg-primary text-base font-bold text-primary-foreground"
                  >
                    +
                  </button>
                </div>
              </div>
              {tab === "reorder" && (
                <button
                  onClick={() => markReordered(s.id)}
                  className="mt-2 h-9 w-full rounded-lg bg-accent text-xs font-bold"
                >
                  Mark reordered today
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showAdd && (
        <AddItemModal
          onClose={() => setShowAdd(false)}
          onSave={(it) => {
            setStock([...stock, it]);
            setShowAdd(false);
            toast.success(tr("saved", lang));
          }}
          lang={lang}
        />
      )}
    </div>
  );
}

function AddItemModal({
  onClose, onSave, lang,
}: { onClose: () => void; onSave: (i: StockItem) => void; lang: "hi" | "hinglish" | "en" }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📦");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("piece");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [minStock, setMinStock] = useState("5");

  const pickCommon = (n: string, e: string) => {
    setName(n);
    setEmoji(e);
  };

  const save = () => {
    if (!name) return;
    onSave({
      id: uid(),
      name,
      emoji,
      quantity: Number(quantity) || 0,
      unit,
      cost: Number(cost) || 0,
      price: Number(price) || 0,
      minStock: Number(minStock) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" />
        <h2 className="mb-4 text-xl font-extrabold">📦 {tr("newItem", lang)}</h2>

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
                  onClick={() => pickCommon(it.name, it.emoji)}
                  className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold"
                >
                  {it.emoji} {it.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="text-sm font-semibold">{tr("costPrice", lang)}</label>
              <input
                inputMode="numeric"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 text-base"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">{tr("sellPrice", lang)}</label>
              <input
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 text-base"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">{tr("minStock", lang)}</label>
            <input
              inputMode="numeric"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-3 text-base"
            />
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
