import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Database,
  FolderKanban,
  Sparkles,
  Globe,
  KeyRound,
  ClipboardCheck,
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

type MenuSection = {
  label: string;
  items: MenuItem[];
};

const MENU_SECTIONS: MenuSection[] = [
  {
    label: "Main",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/projects", label: "Projects", icon: FolderKanban },
      { to: "/site-audit", label: "Site Audit", icon: ClipboardCheck },
    ],
  },
  {
    label: "Legacy",
    items: [
      { to: "/domains", label: "Domain Saya", icon: Database },
      {
        to: "/backlink-recommendation",
        label: "Rekomendasi Backlink",
        icon: Sparkles,
      },
      { to: "/domain-research", label: "Riset Domain", icon: Globe },
      { to: "/keyword-research", label: "Riset Keyword", icon: KeyRound },
    ],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeProjectId = pathname.match(/^\/project\/([^/]+)/)?.[1];

  return (
    <nav className="flex flex-1 flex-col gap-6">
      {MENU_SECTIONS.map((section) => (
        <div key={section.label} className="flex flex-col gap-1">
          <span className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            {section.label}
          </span>
          <div className="flex flex-col gap-1">
            {section.items.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const Icon = item.icon;
              const className = cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              );

              if (item.to === "/site-audit") {
                return (
                  <Link
                    key={item.to}
                    to="/site-audit"
                    search={activeProjectId ? { projectId: decodeURIComponent(activeProjectId) } : {}}
                    onClick={onNavigate}
                    className={className}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              }

              return (
                <Link key={item.to} to={item.to} onClick={onNavigate} className={className}>
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2 px-1">
        <span className="grid size-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          BL
        </span>
        <span className="text-sm font-semibold text-sidebar-foreground">Backlink Manager</span>
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border bg-sidebar md:block">
        <SidebarBody />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80" onClick={() => setOpen(false)} />
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
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-semibold text-sidebar-foreground">Backlink Manager</span>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
