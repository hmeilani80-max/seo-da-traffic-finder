import { Link, useRouterState } from "@tanstack/react-router";
import {
  Compass,
  Database,
  FolderKanban,
  Globe,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";

import { ProjectSwitcher } from "@/components/ProjectSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type MenuItem = {
  to:
    | "/"
    | "/domains"
    | "/projects"
    | "/backlink-recommendation"
    | "/domain-research"
    | "/keyword-research"
    | "/keyword-explorer"
    | "/settings";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

const MENU_GROUPS: MenuGroup[] = [
  {
    title: "MAIN",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/projects", label: "Proyek", icon: FolderKanban },
    ],
  },
  {
    title: "RESEARCH & INTELLIGENCE",
    items: [
      { to: "/domains", label: "Domain Saya", icon: Database },
      { to: "/domain-research", label: "Riset Domain", icon: Globe },
      { to: "/keyword-research", label: "Riset Keyword", icon: KeyRound },
    ],
  },
  {
    title: "EXTERNAL TOOLS",
    items: [{ to: "/keyword-explorer", label: "Keyword Explorer", icon: Compass }],
  },
  {
    title: "EXECUTION",
    items: [
      {
        to: "/backlink-recommendation",
        label: "Rekomendasi Backlink",
        icon: Sparkles,
      },
    ],
  },
  {
    title: "WORKSPACE",
    items: [{ to: "/settings", label: "Pengaturan", icon: Settings }],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
      {MENU_GROUPS.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.16em] text-sidebar-foreground/45">
            {group.title}
          </p>
          {group.items.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
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
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col gap-5 p-4">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3 px-1">
        <span className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          SEO
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">SEO OS</p>
          <p className="truncate text-[11px] text-sidebar-foreground/50">Operating System</p>
        </div>
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
        <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-3 backdrop-blur sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-md p-1.5 text-foreground hover:bg-muted md:hidden"
              aria-label="Buka menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="hidden md:block">
              <p className="text-sm font-semibold">SEO Operating System</p>
              <p className="text-[11px] text-muted-foreground">Project context first</p>
            </div>
          </div>

          <ProjectSwitcher compact={false} />
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
