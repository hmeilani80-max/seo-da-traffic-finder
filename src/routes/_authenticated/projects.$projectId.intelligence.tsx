import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { ClientIntelligencePanel } from "@/components/project/ClientIntelligencePanel";
import { fetchProject } from "@/lib/project-profile";

export const Route = createFileRoute("/_authenticated/projects/$projectId/intelligence")({
  component: IntelligencePage,
});

function IntelligencePage() {
  const { projectId } = useParams({ from: "/_authenticated/projects/$projectId/intelligence" });
  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
  });

  if (!project.data) return null;
  return <ClientIntelligencePanel projectId={projectId} />;
}
