import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { FolderKanban, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchProjects } from "@/lib/projects";

const LAST_PROJECT_KEY = "seo-os:last-project-id";

function projectIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/projects\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function ProjectSwitcher({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const projects = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });

  const routeProjectId = projectIdFromPath(pathname);
  const storedProjectId =
    typeof window !== "undefined" ? window.localStorage.getItem(LAST_PROJECT_KEY) : null;
  const projectList = projects.data ?? [];
  const selectedId =
    routeProjectId ??
    (storedProjectId && projectList.some((project) => project.id === storedProjectId)
      ? storedProjectId
      : projectList[0]?.id ?? "");

  if (projects.isLoading) {
    return (
      <div className="flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        {!compact && <span>Memuat proyek…</span>}
      </div>
    );
  }

  if (projectList.length === 0) {
    return (
      <Button asChild size="sm" variant="outline">
        <a href="/projects">
          <Plus className="size-4" />
          {!compact && "Buat Proyek"}
        </a>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!compact && (
        <div className="hidden text-right lg:block">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Current Project</p>
        </div>
      )}
      <Select
        value={selectedId}
        onValueChange={(projectId) => {
          window.localStorage.setItem(LAST_PROJECT_KEY, projectId);
          void navigate({ to: "/projects/$projectId", params: { projectId } });
        }}
      >
        <SelectTrigger className={compact ? "h-9 w-[170px]" : "h-9 w-[220px]"}>
          <FolderKanban className="mr-2 size-4 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="Pilih proyek" />
        </SelectTrigger>
        <SelectContent>
          {projectList.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              <span className="block max-w-[180px] truncate">{project.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!compact && (
        <Button asChild size="sm" variant="ghost" className="hidden xl:inline-flex">
          <a href="/projects">
            <Plus className="size-4" />
            Proyek Baru
          </a>
        </Button>
      )}
    </div>
  );
}
