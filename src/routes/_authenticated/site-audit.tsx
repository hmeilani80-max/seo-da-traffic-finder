import { createFileRoute } from "@tanstack/react-router";

import { SiteAuditWorkspace } from "@/components/site-audit/SiteAuditWorkspace";

export const Route = createFileRoute("/_authenticated/site-audit")({
  validateSearch: (search: Record<string, unknown>) => ({
    projectId: typeof search.projectId === "string" ? search.projectId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Site Audit — SEO Operating System" },
      {
        name: "description",
        content: "Comprehensive factual Site Audit per Project, AI analysis terpisah, dan Audit to Task.",
      },
    ],
  }),
  component: SiteAuditPage,
});

function SiteAuditPage() {
  const { projectId } = Route.useSearch();
  return <SiteAuditWorkspace initialProjectId={projectId} />;
}
