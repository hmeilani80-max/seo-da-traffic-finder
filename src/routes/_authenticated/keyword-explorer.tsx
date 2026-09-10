import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

const KEYWORD_EXPLORER_URL = "https://ebran-keyword-explorer.lovable.app";

export const Route = createFileRoute("/_authenticated/keyword-explorer")({
  head: () => ({
    meta: [
      { title: "Keyword Explorer — SEO OS" },
      {
        name: "description",
        content: "External Keyword Explorer embedded inside the SEO Operating System workspace.",
      },
    ],
  }),
  component: KeywordExplorerPage,
});

function KeywordExplorerPage() {
  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col bg-muted/20">
      <header className="flex flex-col gap-3 border-b bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Keyword Explorer</h1>
            <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              External Tool
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Ebran Keyword Explorer dibuka sebagai tool eksternal. Session, user ID, dan email SEO OS tidak dikirim melalui URL.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
            <ShieldCheck className="size-4" />
            Isolated session
          </div>
          <Button asChild size="sm" variant="outline">
            <a href={KEYWORD_EXPLORER_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Buka Tab Baru
            </a>
          </Button>
        </div>
      </header>

      <div className="relative min-h-[720px] flex-1">
        <iframe
          src={KEYWORD_EXPLORER_URL}
          title="Ebran Keyword Explorer"
          className="absolute inset-0 h-full min-h-[720px] w-full border-0 bg-background"
          allow="clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
