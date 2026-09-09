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
  Plug,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Path =
  | "/"
  | "/projects"
  | "/projects/placements"
  | "/domains"
  | "/backlink-recommendation"
  | "/domain-research"
  | "/keyword-research"
  | "/settings";

type Item = {
  to: Path;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  children?: { to: Path; label: string; exact?: boolean }[];
};

type Group = { title: string; items: Item[] };

const GROUPS: Group[] = [
  {
    title: "Workspace",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      {
        to: "/projects",
        label: "Proyek",
        icon: FolderKanban,
        children: [
          { to: "/projects", label: "Semua Proyek", exact: true },
          { to: "/projects/placements", label: "Placement Order" },
        ],
      },
    ],
  },
  {
    title: "Riset SEO",
    items: [
      { to: "/domain-research", label: "Riset Domain", icon: Globe },
      { to: "/keyword-research", label: "Riset Keyword", icon: KeyRound },
      { to: "/backlink-recommendation", label: "Rekomendasi Backlink", icon: Sparkles },
    ],
  },
  {
    title: "Data",
    items: [{ to: "/domains", label: "Domain Saya", icon: Database }],
  },
  {
    title: "Sistem",
    items: [{ to: "/settings", label: "Pengaturan", icon: Settings }],
  },
];

function isActive(pathname: string, to: string, exact?: boolean) {
  return exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
      {GROUPS.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </p>
          {group.items.map((item) => {
            const active = isActive(pathname, item.to, item.exact);
            const Icon = item.icon;
            return (
              <div key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>

                {item.children && active && (
                  <div className="mt-1 space-y-0.5 pl-6">
                    {item.children.map((child) => {
                      const childActive = isActive(pathname, child.to, child.exact);
                      return (
                        <Link
                          key={child.label}
                          to={child.to}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                            childActive
                              ? "font-medium text-foreground"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              childActive ? "bg-primary" : "bg-border",
                            )}
                          />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col gap-5 p-4">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2 px-1">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-teal text-sm font-bold text-brand-teal-foreground">
          SO
        </span>
        <span className="text-sm font-semibold leading-tight text-sidebar-foreground">
          SEO Operating
          <br />
          System
        </span>
      </Link>

      <NavLinks onNavigate={onNavigate} />

      <button
        type="button"
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/auth";
        }}
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-sidebar-border bg-sidebar md:block">
        <SidebarBody />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
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

      <div className="flex min-w-0 flex-1 flex-col md:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-semibold text-sidebar-foreground">SEO Operating System</span>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export const SidebarIcons = { Plug, ShoppingCart };
