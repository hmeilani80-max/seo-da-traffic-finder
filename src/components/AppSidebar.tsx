import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Database,
  FolderKanban,
  Sparkles,
  Globe,
  KeyRound,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type MenuItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const MENU: MenuItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/domains", label: "Domain Saya", icon: Database },
  { to: "/projects", label: "Proyek & Placement", icon: FolderKanban },
  {
    to: "/backlink-recommendation",
    label: "Rekomendasi Backlink",
    icon: Sparkles,
  },
  { to: "/domain-research", label: "Riset Domain", icon: Globe },
  { to: "/keyword-research", label: "Riset Keyword", icon: KeyRound },
  { to: "/settings", label: "Pengaturan", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {MENU.map((item) => {
        const active = item.exact
          ? pathname === item.to
          : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Link
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-2 px-1"
      >
        <span className="grid size-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          BL
        </span>
        <span className="text-sm font-semibold text-sidebar-foreground">
          Backlink Manager
        </span>
      </Link>

      <NavLinks onNavigate={onNavigate} />

      <button
        type="button"
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/auth";
        }}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        <LogOut className="size-4 shrink-0" />
        Keluar
      </button>
    </div>
  );
}

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border bg-sidebar md:block">
        <SidebarBody />
      </aside>

      {/* Sidebar mobile (drawer) */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-background/80"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border bg-sidebar">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent"
              aria-label="Tutup menu"
            >
              <X className="size-5" />
            </button>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-semibold text-sidebar-foreground">
            Backlink Manager
          </span>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
