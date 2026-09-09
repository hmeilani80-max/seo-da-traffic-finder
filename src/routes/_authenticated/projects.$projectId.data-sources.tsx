import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { DataSourcesRegistry } from "@/components/project/DataSourcesRegistry";
import { fetchProject } from "@/lib/project-profile";

export const Route = createFileRoute("/_authenticated/projects/$projectId/data-sources")({
  component: DataSourcesPage,
});

function DataSourcesPage() {
  const { projectId } = useParams({ from: "/_authenticated/projects/$projectId/data-sources" });
  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
  });

  if (!project.data?.workspace_id) {
    return (
      <p className="text-sm text-muted-foreground">
        Proyek ini belum terhubung ke workspace internal, sehingga sumber data belum bisa dicatat.
      </p>
    );
  }

  return <DataSourcesRegistry projectId={projectId} workspaceId={project.data.workspace_id} />;
}
