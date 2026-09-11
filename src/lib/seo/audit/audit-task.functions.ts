import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
type TaskPriority = (typeof TASK_PRIORITIES)[number];

function dbClient(value: unknown): SupabaseClient {
  return value as SupabaseClient;
}

export const createReviewedTaskFromFindingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { findingIds?: string[]; findingId?: string; title?: string; priority?: string }) => {
    const findingIds = Array.isArray(input?.findingIds)
      ? [...new Set(input.findingIds.map((id) => String(id).trim()).filter(Boolean))].slice(0, 100)
      : [];
    const fallbackId = String(input?.findingId ?? "").trim();
    const priority = TASK_PRIORITIES.includes(input?.priority as TaskPriority)
      ? (input.priority as TaskPriority)
      : undefined;
    return {
      findingIds: findingIds.length ? findingIds : fallbackId ? [fallbackId] : [],
      title: String(input?.title ?? "").trim(),
      priority,
    };
  })
  .handler(async ({ data, context }) => {
    if (!data.findingIds.length) throw new Error("Finding wajib dipilih.");
    const db = dbClient(context.supabase);

    const { data: items, error } = await db
      .from("audit_findings")
      .select("id,audit_id,workspace_id,project_id,title,status,url,check_key,source_type,source_ref")
      .in("id", data.findingIds);

    if (error || !items?.length) throw error ?? new Error("Finding tidak ditemukan.");
    if (items.some((item) => item.status === "passed")) {
      throw new Error("Finding Passed tidak perlu dibuat menjadi task.");
    }

    const item = items[0];
    const sameContext = items.every(
      (candidate) =>
        candidate.project_id === item.project_id &&
        candidate.workspace_id === item.workspace_id &&
        candidate.audit_id === item.audit_id,
    );
    if (!sameContext) throw new Error("Finding yang dipilih harus berasal dari audit dan Project yang sama.");

    const defaultPriority: TaskPriority = items.some((candidate) => candidate.status === "urgent")
      ? "urgent"
      : items.some((candidate) => candidate.status === "issue")
        ? "high"
        : "medium";
    const priority = data.priority ?? defaultPriority;
    const title = data.title || item.title;
    const urls = items.map((candidate) => candidate.url).filter(Boolean) as string[];

    const sourceRefs = items.map((candidate) => ({
      type: "audit_finding",
      id: candidate.id,
      audit_id: candidate.audit_id,
      check_key: candidate.check_key,
      url: candidate.url,
      source_type: candidate.source_type,
      source_ref: candidate.source_ref,
    }));

    const { data: task, error: taskError } = await db
      .from("tasks")
      .insert({
        workspace_id: item.workspace_id,
        project_id: item.project_id,
        title,
        description: [
          `Audit finding: ${item.title}`,
          `Affected findings: ${items.length}`,
          urls.length ? `Affected URLs:\n${urls.slice(0, 25).join("\n")}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
        status: "todo",
        priority,
        source_type: "audit_finding",
        source_id: item.id,
        source_refs: sourceRefs,
        created_by: context.userId,
      })
      .select("id")
      .single();

    if (taskError) {
      if (taskError.code === "23505") {
        const { data: existing } = await db
          .from("tasks")
          .select("id")
          .eq("project_id", item.project_id)
          .eq("source_type", "audit_finding")
          .eq("source_id", item.id)
          .maybeSingle();
        if (existing) return { taskId: String(existing.id), alreadyExists: true };
      }
      throw taskError;
    }

    if (!task) throw new Error("Task tidak berhasil dibuat.");
    return { taskId: String(task.id), alreadyExists: false };
  });
