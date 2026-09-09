/**
 * Wave 1 — AI Client Intelligence (server-only).
 *
 * AI hanya melakukan penalaran atas konteks Project + evidence yang benar-benar ada.
 * AI TIDAK BOLEH menghasilkan metrik SEO faktual dan TIDAK BOLEH menimpa field Project.
 */

import { AI_FACTUAL_INTEGRITY_RULE, aiJson } from "./ai.provider";

export type IntelligenceOutput = {
  business_understanding: string;
  client_objectives: string[];
  available_data_access: string[];
  initial_findings: string[];
  missing_information: string[];
  discovery_questions: string[];
  recommended_next_actions: string[];
  field_suggestions: { field: string; value: string; rationale?: string }[];
};

const SUGGESTABLE_FIELDS = [
  "industry",
  "objectives",
  "target_market",
  "current_problem",
  "contact_person",
  "budget_indication",
  "competitors",
];

const SYSTEM = `Anda adalah asisten riset SEO internal untuk agensi di Indonesia.
Tugas Anda: memahami konteks bisnis klien dari data Project dan bukti (evidence) yang diberikan.
${AI_FACTUAL_INTEGRITY_RULE}
Jika sebuah informasi tidak ada pada input, sebutkan sebagai informasi yang belum tersedia.
Balas dalam Bahasa Indonesia.
Format JSON:
{
 "business_understanding": string,
 "client_objectives": string[],
 "available_data_access": string[],
 "initial_findings": string[],
 "missing_information": string[],
 "discovery_questions": string[],
 "recommended_next_actions": string[],
 "field_suggestions": [{"field": one of ${SUGGESTABLE_FIELDS.join("|")}, "value": string, "rationale": string}]
}`;

export type IntelligenceInput = {
  project: {
    name: string;
    client_domain: string | null;
    lifecycle_status: string;
    industry: string | null;
    objectives: string[];
    target_market: string | null;
    current_problem: string | null;
    contact_person: string | null;
    budget_indication: string | null;
    competitors: string[];
    discovery_notes: string | null;
    description: string | null;
  };
  evidence: { title: string; source_type: string; status: string; excerpt: string | null }[];
  dataSources: { label: string; status: string }[];
  userPrompt?: string;
};

export async function runClientIntelligence(input: IntelligenceInput) {
  const evidenceBlock =
    input.evidence.length === 0
      ? "(belum ada evidence)"
      : input.evidence
          .map(
            (e, i) =>
              `${i + 1}. [${e.source_type} / ${e.status}] ${e.title}\n${(e.excerpt ?? "(tanpa teks)").slice(0, 4000)}`,
          )
          .join("\n\n");

  const sourcesBlock =
    input.dataSources.length === 0
      ? "(belum ada sumber data yang dicatat)"
      : input.dataSources.map((s) => `- ${s.label}: ${s.status}`).join("\n");

  const user = `PROFIL PROJECT (data otoritatif, jangan diubah):
${JSON.stringify(input.project, null, 2)}

STATUS SUMBER DATA:
${sourcesBlock}

EVIDENCE:
${evidenceBlock}

${input.userPrompt ? `PERMINTAAN KHUSUS USER:\n${input.userPrompt}` : ""}

Hanya usulkan field_suggestions untuk field yang masih kosong atau jelas kurang lengkap, dan tandai dasar alasannya dari evidence/profil.`;

  return aiJson<IntelligenceOutput>({ system: SYSTEM, user, temperature: 0.2 });
}
