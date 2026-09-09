import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { EvidenceWorkspace } from "@/components/project/EvidenceWorkspace";
import { ImportWizard } from "@/components/project/ImportWizard";
import { fetchProject } from "@/lib/project-profile";

export const Route = createFileRoute("/_authenticated/projects/$projectId/files")({
  component: FilesPage,
});

function FilesPage() {
  const { projectId } = useParams({ from: "/_authenticated/projects/$projectId/files" });
  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
  });

  const workspaceId = project.data?.workspace_id;
  if (!workspaceId) {
    return (
      <p className="text-sm text-muted-foreground">
        Proyek ini belum terhubung ke workspace internal, sehingga file belum bisa diunggah.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <EvidenceWorkspace projectId={projectId} workspaceId={workspaceId} />
      <ImportWizard projectId={projectId} workspaceId={workspaceId} />
    </div>
  );
}
