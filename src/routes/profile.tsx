import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useProfile, useSettings, clearAll } from "@/lib/storage";
import { tr, type Lang } from "@/lib/i18n";
import { Edit2, Sun, Moon, LogOut, Check, X } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — MerchantMate" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [profile, setProfile] = useProfile();
  const [settings, setSettings] = useSettings();
  const lang = settings.lang;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profile!);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pt-4">
      <h1 className="text-2xl font-extrabold text-primary">👤 {tr("profile", lang)}</h1>

      <div className="rounded-3xl p-5 shadow-card" style={{ background: "linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary), var(--saffron) 35%))" }}>
        <div className="flex items-center gap-3">
          <div className="grid size-16 place-items-center rounded-full bg-white/20 text-3xl">🏪</div>
          <div className="flex-1 text-primary-foreground">
            {editing ? (
              <input
                value={form.shopName}
                onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                className="w-full rounded-lg bg-white/20 px-2 py-1 text-lg font-bold text-primary-foreground placeholder:text-primary-foreground/60"
              />
            ) : (
              <div className="text-xl font-extrabold">{profile.shopName}</div>
            )}
            <div className="text-sm opacity-90">{profile.ownerName} · {profile.city}</div>
            <div className="text-xs opacity-80">📱 {profile.phone}</div>
          </div>
          <button
            onClick={() => {
              if (editing) {
                setProfile(form);
                setEditing(false);
              } else {
                setForm(profile);
                setEditing(true);
              }
            }}
            className="rounded-full bg-white/20 p-2 text-primary-foreground"
          >
            {editing ? <Check className="size-5" /> : <Edit2 className="size-4" />}
          </button>
        </div>
        {editing && (
          <div className="mt-3 space-y-2">
            <input
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              placeholder={tr("ownerName", lang)}
              className="w-full rounded-lg bg-white/20 px-3 py-2 text-sm font-semibold text-primary-foreground placeholder:text-primary-foreground/60"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder={tr("city", lang)}
                className="rounded-lg bg-white/20 px-3 py-2 text-sm text-primary-foreground placeholder:text-primary-foreground/60"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder={tr("phone", lang)}
                className="rounded-lg bg-white/20 px-3 py-2 text-sm text-primary-foreground placeholder:text-primary-foreground/60"
              />
            </div>
          </div>
        )}
      </div>

      {/* Language */}
      <div className="rounded-2xl bg-card p-4 shadow-card">
        <h3 className="mb-3 text-sm font-bold">🌐 {tr("language", lang)}</h3>
        <div className="flex gap-2">
          {([
            { v: "hi", label: "हिन्दी" },
            { v: "hinglish", label: "Hinglish" },
            { v: "en", label: "English" },
          ] as { v: Lang; label: string }[]).map((opt) => (
            <button
              key={opt.v}
              onClick={() => setSettings({ ...settings, lang: opt.v })}
              className={
                "flex-1 rounded-xl px-3 py-2.5 text-sm font-bold " +
                (lang === opt.v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="rounded-2xl bg-card p-4 shadow-card">
        <h3 className="mb-3 text-sm font-bold">🎨 {tr("theme", lang)}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setSettings({ ...settings, theme: "light" })}
            className={
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold " +
              (settings.theme === "light" ? "bg-saffron text-saffron-foreground" : "bg-muted text-muted-foreground")
            }
            style={settings.theme === "light" ? { background: "var(--saffron)", color: "var(--saffron-foreground)" } : undefined}
          >
            <Sun className="size-4" /> {tr("light", lang)}
          </button>
          <button
            onClick={() => setSettings({ ...settings, theme: "dark" })}
            className={
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold " +
              (settings.theme === "dark" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")
            }
          >
            <Moon className="size-4" /> {tr("dark", lang)}
          </button>
        </div>
      </div>

      {/* Logout */}
      {confirmClear ? (
        <div className="rounded-2xl border-2 border-destructive bg-card p-4 shadow-card">
          <p className="text-sm font-semibold">{tr("confirmClear", lang)}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setConfirmClear(false)}
              className="flex-1 rounded-xl bg-muted py-3 text-sm font-bold"
            >
              <X className="mr-1 inline size-4" /> {tr("cancel", lang)}
            </button>
            <button
              onClick={clearAll}
              className="flex-1 rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground"
            >
              <LogOut className="mr-1 inline size-4" /> {tr("logout", lang)}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmClear(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-card text-sm font-bold text-destructive shadow-card"
        >
          <LogOut className="size-4" /> {tr("logout", lang)}
        </button>
      )}

      <div className="pt-2 text-center text-xs text-muted-foreground">
        MerchantMate · {tr("tagline", lang)}
      </div>
    </div>
  );
}
