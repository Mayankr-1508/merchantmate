import { useEffect, useState, useCallback } from "react";
import type { Lang } from "./i18n";

export type Profile = {
  shopName: string;
  ownerName: string;
  city: string;
  phone: string;
  photoDataUrl?: string;
};

export type UdhaarEntry = {
  id: string;
  customer: string;
  items: string;
  amount: number;
  date: string; // ISO
  paid: boolean;
  paidAt?: string;
};

export type StockItem = {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
  unit: string;
  cost: number;
  price: number;
  minStock: number;
  lastReorderDate?: string;
  lastReorderQty?: number;
  lowCount?: number;
};

export type CatalogueItem = {
  id: string;
  name: string;
  emoji: string;
  costPrice: number;
  sellPrice: number;
  quantity: number;
  unit: string;
};

export type SaleEntry = { date: string; cash: number; upi: number };

export type Settings = { lang: Lang; theme: "light" | "dark" };

const K = {
  profile: "mm.profile",
  udhaar: "mm.udhaar",
  stock: "mm.stock",
  sales: "mm.sales",
  settings: "mm.settings",
  catalogue: "mm.catalogue",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("mm:storage", { detail: { key } }));
}

function useStored<T>(key: string, fallback: T) {
  const [state, setState] = useState<T>(fallback);
  useEffect(() => {
    setState(read<T>(key, fallback));
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ key: string }>;
      if (!ev.detail || ev.detail.key === key) setState(read<T>(key, fallback));
    };
    window.addEventListener("mm:storage", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("mm:storage", handler);
      window.removeEventListener("storage", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const setAndStore = useCallback(
    (v: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        write(key, next);
        return next;
      });
    },
    [key],
  );
  return [state, setAndStore] as const;
}

export const useProfile = () => useStored<Profile | null>(K.profile, null);
export const useUdhaar = () => useStored<UdhaarEntry[]>(K.udhaar, []);
export const useStock = () => useStored<StockItem[]>(K.stock, []);
export const useSales = () => useStored<SaleEntry[]>(K.sales, []);
export const useCatalogue = () => useStored<CatalogueItem[]>(K.catalogue, []);
export const useSettings = () =>
  useStored<Settings>(K.settings, { lang: "hinglish", theme: "light" });

export const clearAll = () => {
  Object.values(K).forEach((k) => localStorage.removeItem(k));
  window.dispatchEvent(new CustomEvent("mm:storage"));
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const COMMON_ITEMS = [
  { name: "Maggi", emoji: "🍜" },
  { name: "Bread", emoji: "🍞" },
  { name: "Dahi", emoji: "🥛" },
  { name: "Doodh", emoji: "🥛" },
  { name: "Chips", emoji: "🥔" },
  { name: "Biscuit", emoji: "🍪" },
  { name: "Atta", emoji: "🌾" },
  { name: "Chawal", emoji: "🍚" },
  { name: "Dal", emoji: "🫘" },
  { name: "Oil", emoji: "🛢️" },
  { name: "Soap", emoji: "🧼" },
  { name: "Shampoo", emoji: "🧴" },
  { name: "Cold Drink", emoji: "🥤" },
  { name: "Namkeen", emoji: "🥨" },
  { name: "Sugar", emoji: "🍬" },
  { name: "Salt", emoji: "🧂" },
  { name: "Tea", emoji: "🍵" },
];

export const UNITS = ["kg", "packet", "litre", "piece", "dozen"];

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const fmt = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");

export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const daysSince = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
