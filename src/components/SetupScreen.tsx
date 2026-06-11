import { useState } from "react";
import { useProfile, useSettings } from "@/lib/storage";
import { tr, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import heroImg from "@/assets/kirana-hero.jpg";

export function SetupScreen() {
  const [, setProfile] = useProfile();
  const [settings, setSettings] = useSettings();
  const lang = settings.lang;
  const [form, setForm] = useState({ shopName: "", ownerName: "", city: "", phone: "" });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md">
        {/* Header with illustration background + text overlay (matches home) */}
        <div className="relative overflow-hidden">
          <img
            src={heroImg}
            alt="Indian kirana shop with shopkeeper"
            className="h-56 w-full object-cover"
            width={1280}
            height={768}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/40 to-background" />
          <div className="absolute inset-x-0 bottom-0 px-5 pb-3">
            <p className="text-base font-semibold text-foreground/80">{tr("namaste", lang)} 🙏</p>
            <h1 className="text-3xl font-extrabold leading-tight text-primary drop-shadow-sm">
              MerchantMate 🏪
            </h1>
            <p className="mt-0.5 text-sm font-bold" style={{ color: "var(--saffron)" }}>
              {tr("tagline", lang)}
            </p>
          </div>
        </div>

        <div className="px-5 pb-8">
          <div className="mb-5 mt-4 flex gap-2">
            {(["hi", "hinglish", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setSettings({ ...settings, lang: l })}
                className={
                  "flex-1 rounded-full px-3 py-2 text-sm font-semibold " +
                  (lang === l
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground")
                }
              >
                {l === "hi" ? "हिन्दी" : l === "hinglish" ? "Hinglish" : "English"}
              </button>
            ))}
          </div>

          <div className="rounded-3xl bg-card p-6 shadow-card">
            <h2 className="text-xl font-bold">{tr("welcome", lang)} 🙏</h2>
            <p className="mt-1 text-sm text-muted-foreground">{tr("setupSub", lang)}</p>

            <div className="mt-5 space-y-4">
              <Field label={tr("shopName", lang)} icon="🏪">
                <Input value={form.shopName} onChange={update("shopName")} className="h-12 text-base" />
              </Field>
              <Field label={tr("ownerName", lang)} icon="👤">
                <Input value={form.ownerName} onChange={update("ownerName")} className="h-12 text-base" />
              </Field>
              <Field label={tr("city", lang)} icon="📍">
                <Input value={form.city} onChange={update("city")} className="h-12 text-base" />
              </Field>
              <Field label={tr("phone", lang)} icon="📱">
                <Input
                  value={form.phone}
                  onChange={update("phone")}
                  inputMode="tel"
                  className="h-12 text-base"
                />
              </Field>
            </div>

            <Button
              disabled={!form.shopName || !form.ownerName}
              onClick={() => setProfile(form)}
              className="mt-6 h-14 w-full rounded-2xl text-lg font-bold"
              style={{ background: "var(--saffron)", color: "var(--saffron-foreground)" }}
            >
              {tr("start", lang)} →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm font-semibold">
        <span className="mr-1">{icon}</span> {label}
      </Label>
      {children}
    </div>
  );
}
