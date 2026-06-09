import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Home, BookOpen, Package, ClipboardList, BarChart3, User, Plus, X } from "lucide-react";
import { useProfile, useSettings } from "@/lib/storage";
import { tr } from "@/lib/i18n";
import { SetupScreen } from "./SetupScreen";

export function AppShell({ children }: { children: ReactNode }) {
  const [profile] = useProfile();
  const [settings] = useSettings();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!profile) {
    return <SetupScreen />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {children}
      <FloatingAdd lang={settings.lang} />
      <BottomNav lang={settings.lang} />
    </div>
  );
}

function BottomNav({ lang }: { lang: "hi" | "hinglish" | "en" }) {
  const items = [
    { to: "/", icon: Home, key: "home" as const },
    { to: "/udhaar", icon: BookOpen, key: "udhaar" as const },
    { to: "/stock", icon: Package, key: "stock" as const },
    { to: "/catalogue", icon: ClipboardList, key: "catalogue" as const },
    { to: "/stats", icon: BarChart3, key: "stats" as const },
    { to: "/profile", icon: User, key: "profile" as const },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-1">
        {items.map(({ to, icon: Icon, key }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex flex-1 flex-col items-center gap-1 py-3 text-muted-foreground data-[status=active]:text-primary"
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-semibold">{tr(key, lang)}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function FloatingAdd({ lang }: { lang: "hi" | "hinglish" | "en" }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="fixed bottom-24 right-5 z-50 flex flex-col items-end gap-3">
        {open && (
          <>
            <Link
              to="/udhaar"
              search={{ add: 1 }}
              className="flex items-center gap-2 rounded-full bg-card px-4 py-3 text-base font-semibold text-foreground shadow-card"
            >
              📒 {tr("newUdhaar", lang)}
            </Link>
            <Link
              to="/catalogue"
              search={{ add: 1 }}
              className="flex items-center gap-2 rounded-full bg-card px-4 py-3 text-base font-semibold text-foreground shadow-card"
            >
              📋 {tr("newItem", lang)}
            </Link>
          </>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Add"
          className="grid size-16 place-items-center rounded-full text-saffron-foreground shadow-fab transition-transform active:scale-95"
          style={{ background: "var(--saffron)" }}
        >
          {open ? <X className="size-7" /> : <Plus className="size-7" />}
        </button>
      </div>
    </>
  );
}
