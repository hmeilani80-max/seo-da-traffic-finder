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
  .inputValidator((input: { findingId: string; title?: string; priority?: string }) => {
    const priority = TASK_PRIORITIES.includes(input?.priority as TaskPriority)
      ? (input.priority as TaskPriority)
      : undefined;
    return {
      findingId: String(input?.findingId ?? "").trim(),
      title: String(input?.title ?? "").trim(),
      priority,
    };
  })
  .handler(async ({ data, context }) => {
    if (!data.findingId) throw new Error("Finding wajib dipilih.");
    const db = dbClient(context.supabase);

    const { data: item, error } = await db
      .from("audit_findings")
      .select("id,audit_id,workspace_id,project_id,title,status,url,check_key,source_type,source_ref")
      .eq("id", data.findingId)
      .single();

    if (error || !item) throw error ?? new Error("Finding tidak ditemukan.");
    if (item.status === "passed") throw new Error("Finding Passed tidak perlu dibuat menjadi task.");

    const defaultPriority: TaskPriority =
      item.status === "urgent" ? "urgent" : item.status === "issue" ? "high" : "medium";
    const priority = data.priority ?? defaultPriority;
    const title = data.title || item.title;

    const sourceRefs = [
      {
        type: "audit_finding",
        id: item.id,
        audit_id: item.audit_id,
        check_key: item.check_key,
        url: item.url,
        source_type: item.source_type,
        source_ref: item.source_ref,
      },
    ];

    const { data: task, error: taskError } = await db
      .from("tasks")
      .insert({
        workspace_id: item.workspace_id,
        project_id: item.project_id,
        title,
        description: `Audit finding: ${item.check_key}${item.url ? `\nURL: ${item.url}` : ""}`,
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
