import { createServerFn } from "@tanstack/react-start";

const OPENSEO_MCP_URL = "https://app.openseo.so/mcp";
const DEFAULT_PROJECT_ID = "29a87a88-a855-446d-8595-fb3a0ff2c781";
const DEFAULT_TARGET_DOMAIN = "arsjadrasjid.com";

export type BacklinkHistoryItem = {
  keyword: string | null;
  targetPage: string | null;
};

export type BacklinkSuggestion = {
  keyword: string;
  targetPage: string;
  score: number;
  rank: number | null;
  searchVolume: number | null;
  keywordDifficulty: number | null;
  trafficEstimate: number | null;
  topicalRelevance: number;
  seoOpportunity: number;
  backlinkDiversity: number;
  linkStrengthFit: number;
  reason: string;
};

export type BacklinkSuggestionResult = {
  sourceDomain: string;
  targetDomain: string;
  projectId: string;
  suggestions: BacklinkSuggestion[];
  sourceKeywordsFound: number;
  targetKeywordsFound: number;
  error: string | null;
};

type RankedKeyword = {
  keyword: string;
  url: string | null;
  position: number | null;
  searchVolume: number | null;
  traffic: number | null;
  cpc: number | null;
  keywordDifficulty: number | null;
};

type McpToolResult = {
  content?: Array<{ type?: string; text?: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

type JsonRpcEnvelope = {
  jsonrpc?: string;
  id?: string | number | null;
  result?: McpToolResult;
  error?: { code?: number; message?: string; data?: unknown };
};

const STOPWORDS = new Set([
  "yang",
  "dan",
  "atau",
  "dari",
  "untuk",
  "dengan",
  "dalam",
  "pada",
  "ke",
  "di",
  "ini",
  "itu",
  "adalah",
  "oleh",
  "sebagai",
  "tentang",
  "cara",
  "apa",
  "the",
  "and",
  "for",
  "from",
  "with",
  "this",
  "that",
  "how",
  "what",
  "are",
  "is",
  "of",
  "to",
  "in",
  "on",
  "a",
  "an",
  "www",
  "com",
  "co",
  "id",
  "https",
  "http",
]);

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalizeDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "");
}

function normalizeText(input: string | null | undefined) {
  return (input ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function tokenize(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readPath(value: unknown, ...path: string[]): unknown {
  let current: unknown = value;
  for (const key of path) {
    const record = asRecord(current);
    if (!record) return undefined;
    current = record[key];
  }
  return current;
}

function parseSseOrJson(text: string): JsonRpcEnvelope {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("OpenSEO mengembalikan response kosong.");

  try {
    return JSON.parse(trimmed) as JsonRpcEnvelope;
  } catch {
    const frames = trimmed
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter(Boolean);

    for (let index = frames.length - 1; index >= 0; index -= 1) {
      const frame = frames[index];
      if (!frame) continue;
      try {
        return JSON.parse(frame) as JsonRpcEnvelope;
      } catch {
        // Keep looking for a valid JSON-RPC data frame.
      }
    }
  }

  throw new Error("Format response OpenSEO MCP tidak dikenali.");
}

function toolErrorMessage(result: McpToolResult | undefined) {
  const text = result?.content
    ?.filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join(" ")
    .trim();
  return text || "OpenSEO tool gagal dijalankan.";
}

async function callOpenSeoTool(
  apiKey: string,
  name: string,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const response = await fetch(OPENSEO_MCP_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      "Mcp-Method": "tools/call",
      "Mcp-Name": name,
      "MCP-Protocol-Version": "2026-07-28",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      method: "tools/call",
      params: {
        name,
        arguments: args,
        _meta: {
          "io.modelcontextprotocol/protocolVersion": "2026-07-28",
          "io.modelcontextprotocol/clientCapabilities": {},
        },
      },
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "OpenSEO API key tidak valid atau tidak memiliki akses ke project.",
      );
    }
    throw new Error(
      `OpenSEO HTTP ${response.status}: ${body.slice(0, 220) || response.statusText}`,
    );
  }

  const envelope = parseSseOrJson(body);
  if (envelope.error) {
    throw new Error(envelope.error.message || "OpenSEO MCP error.");
  }
  if (!envelope.result) {
    throw new Error("OpenSEO tidak mengembalikan tool result.");
  }
  if (envelope.result.isError) {
    throw new Error(toolErrorMessage(envelope.result));
  }
  return envelope.result;
}

function mapRankedKeyword(item: unknown): RankedKeyword | null {
  const keyword =
    readPath(item, "keyword_data", "keyword") ?? readPath(item, "keyword");
  if (typeof keyword !== "string" || !keyword.trim()) return null;

  const url =
    readPath(item, "ranked_serp_element", "serp_item", "url") ??
    readPath(item, "ranked_serp_element", "url") ??
    readPath(item, "url");

  const position =
    readPath(item, "ranked_serp_element", "serp_item", "rank_absolute") ??
    readPath(item, "ranked_serp_element", "rank_absolute") ??
    readPath(item, "rank_absolute");

  const traffic =
    readPath(item, "ranked_serp_element", "serp_item", "etv") ??
    readPath(item, "ranked_serp_element", "etv") ??
    readPath(item, "etv");

  const keywordDifficulty =
    readPath(item, "keyword_data", "keyword_properties", "keyword_difficulty") ??
    readPath(item, "keyword_data", "keyword_info", "keyword_difficulty");

  return {
    keyword: keyword.trim(),
    url: typeof url === "string" && url.trim() ? url.trim() : null,
    position: toNumber(position),
    searchVolume: toNumber(
      readPath(item, "keyword_data", "keyword_info", "search_volume"),
    ),
    traffic: toNumber(traffic),
    cpc: toNumber(readPath(item, "keyword_data", "keyword_info", "cpc")),
    keywordDifficulty: toNumber(keywordDifficulty),
  };
}

async function getRankedKeywords(
  apiKey: string,
  projectId: string,
  target: string,
  limit: number,
) {
  const toolResult = await callOpenSeoTool(apiKey, "get_ranked_keywords", {
    projectId,
    target,
    scope: "domain",
    resultTypes: ["organic"],
    maxRank: 50,
    sortBy: "traffic_estimate",
    limit,
  });

  const raw = toolResult.structuredContent?.['keywords'];
  if (!Array.isArray(raw)) return [];
  return raw
    .map(mapRankedKeyword)
    .filter((row): row is RankedKeyword => row != null);
}

function isTargetUrl(url: string | null, targetDomain: string) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return host === targetDomain || host.endsWith(`.${targetDomain}`);
  } catch {
    return false;
  }
}

function sourceTokenWeights(rows: RankedKeyword[]) {
  const weights = new Map<string, number>();

  for (const row of rows.slice(0, 40)) {
    const rowWeight =
      Math.log10((row.searchVolume ?? 0) + 10) * 0.55 +
      Math.log10((row.traffic ?? 0) + 10) * 0.45;
    for (const token of new Set(tokenize(row.keyword))) {
      weights.set(token, (weights.get(token) ?? 0) + rowWeight);
    }
  }

  const max = Math.max(0, ...weights.values());
  if (max > 0) {
    for (const [token, value] of weights) weights.set(token, value / max);
  }
  return weights;
}

function topicalRelevance(
  candidate: RankedKeyword,
  sourceWeights: Map<string, number>,
) {
  if (sourceWeights.size === 0) return 0.5;

  let path = "";
  if (candidate.url) {
    try {
      path = new URL(candidate.url).pathname;
    } catch {
      path = candidate.url;
    }
  }
  const tokens = new Set(tokenize(`${candidate.keyword} ${path}`));
  if (tokens.size === 0) return 0.2;

  let matched = 0;
  for (const token of tokens) matched += sourceWeights.get(token) ?? 0;
  const normalized = matched / Math.max(1, Math.min(tokens.size, 4));
  return clamp(0.15 + normalized * 1.25);
}

function rankOpportunity(position: number | null) {
  if (position == null) return 0.2;
  if (position <= 3) return 0.45;
  if (position <= 10) return 1;
  if (position <= 20) return 0.95;
  if (position <= 30) return 0.78;
  if (position <= 40) return 0.58;
  if (position <= 50) return 0.38;
  return 0.2;
}

function buildReason(input: {
  row: RankedKeyword;
  topical: number;
  diversity: number;
  pageCount: number;
}) {
  const parts: string[] = [];
  if (input.row.position != null) {
    const volume =
      input.row.searchVolume != null
        ? `, volume ${Math.round(input.row.searchVolume).toLocaleString("id-ID")}`
        : "";
    parts.push(`Posisi ${Math.round(input.row.position)}${volume} memberi ruang untuk didorong.`);
  } else {
    parts.push("Keyword punya potensi sebagai target backlink.");
  }

  if (input.topical >= 0.65) {
    parts.push("Topiknya kuat dengan domain sumber.");
  } else if (input.topical >= 0.4) {
    parts.push("Topiknya cukup selaras dengan domain sumber.");
  }

  if (input.pageCount === 0) {
    parts.push("Target page belum dipakai pada histori backlink.");
  } else if (input.diversity >= 0.55) {
    parts.push(`Target page baru dipakai ${input.pageCount}× di histori.`);
  }

  return parts.join(" ");
}

function scoreSuggestions(input: {
  sourceRows: RankedKeyword[];
  targetRows: RankedKeyword[];
  history: BacklinkHistoryItem[];
  sourceDr: number | null;
  targetDomain: string;
}) {
  const sourceWeights = sourceTokenWeights(input.sourceRows);
  const candidates = input.targetRows.filter(
    (row) =>
      isTargetUrl(row.url, input.targetDomain) &&
      row.keyword.length >= 3 &&
      (row.searchVolume ?? 0) > 0,
  );

  const maxVolume = Math.max(1, ...candidates.map((row) => row.searchVolume ?? 0));
  const maxTraffic = Math.max(1, ...candidates.map((row) => row.traffic ?? 0));

  const pageCounts = new Map<string, number>();
  const anchorCounts = new Map<string, number>();
  for (const item of input.history) {
    const target = normalizeText(item.targetPage);
    const keyword = normalizeText(item.keyword);
    if (target) pageCounts.set(target, (pageCounts.get(target) ?? 0) + 1);
    if (keyword) anchorCounts.set(keyword, (anchorCounts.get(keyword) ?? 0) + 1);
  }

  const seen = new Set<string>();
  const scored = candidates
    .filter((row) => {
      const key = `${normalizeText(row.keyword)}|${normalizeText(row.url)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((row) => {
      const targetPage = row.url as string;
      const pageCount = pageCounts.get(normalizeText(targetPage)) ?? 0;
      const anchorCount = anchorCounts.get(normalizeText(row.keyword)) ?? 0;

      const topical = topicalRelevance(row, sourceWeights);
      const volumeScore = clamp(
        Math.log10((row.searchVolume ?? 0) + 1) / Math.log10(maxVolume + 1),
      );
      const trafficScore = clamp(
        Math.log10((row.traffic ?? 0) + 1) / Math.log10(maxTraffic + 1),
      );
      const opportunity = clamp(
        rankOpportunity(row.position) * 0.55 + volumeScore * 0.35 + trafficScore * 0.1,
      );
      const diversity = clamp(1 / (1 + pageCount * 0.35 + anchorCount * 0.7));
      const difficulty = row.keywordDifficulty ?? 45;
      const strength =
        input.sourceDr == null
          ? 0.55
          : clamp((input.sourceDr + 25) / (Math.max(0, difficulty) + 25));

      let score =
        topical * 0.35 + opportunity * 0.3 + diversity * 0.2 + strength * 0.15;

      try {
        if (new URL(targetPage).pathname === "/") score *= 0.9;
      } catch {
        // URL was already validated by isTargetUrl.
      }

      return {
        keyword: row.keyword,
        targetPage,
        score: Math.round(clamp(score) * 100),
        rank: row.position != null ? Math.round(row.position) : null,
        searchVolume:
          row.searchVolume != null ? Math.round(row.searchVolume) : null,
        keywordDifficulty:
          row.keywordDifficulty != null ? Math.round(row.keywordDifficulty) : null,
        trafficEstimate: row.traffic != null ? Math.round(row.traffic) : null,
        topicalRelevance: Math.round(topical * 100),
        seoOpportunity: Math.round(opportunity * 100),
        backlinkDiversity: Math.round(diversity * 100),
        linkStrengthFit: Math.round(strength * 100),
        reason: buildReason({ row, topical, diversity, pageCount }),
      } satisfies BacklinkSuggestion;
    })
    .sort((a, b) => b.score - a.score);

  const selected: BacklinkSuggestion[] = [];
  const selectedPages = new Set<string>();
  for (const item of scored) {
    const page = normalizeText(item.targetPage);
    if (selectedPages.has(page)) continue;
    selected.push(item);
    selectedPages.add(page);
    if (selected.length === 3) return selected;
  }
  for (const item of scored) {
    if (selected.includes(item)) continue;
    selected.push(item);
    if (selected.length === 3) break;
  }
  return selected;
}

export const suggestBacklinkPlacements = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      domain: string;
      sourceDr?: number | null;
      history?: BacklinkHistoryItem[];
    }) => {
      const domain = normalizeDomain(String(data?.domain ?? ""));
      if (!domain || !domain.includes(".")) {
        throw new Error("Masukkan domain sumber yang valid.");
      }

      const sourceDr =
        data.sourceDr == null || !Number.isFinite(Number(data.sourceDr))
          ? null
          : clamp(Number(data.sourceDr), 0, 100);
      const history = Array.isArray(data.history)
        ? data.history.slice(0, 500).map((item) => ({
            keyword:
              typeof item?.keyword === "string" ? item.keyword.slice(0, 300) : null,
            targetPage:
              typeof item?.targetPage === "string"
                ? item.targetPage.slice(0, 2048)
                : null,
          }))
        : [];

      return { domain, sourceDr, history };
    },
  )
  .handler(async ({ data }): Promise<BacklinkSuggestionResult> => {
    const apiKey = process.env["OPENSEO_API_KEY"]?.trim();
    const projectId =
      process.env["OPENSEO_PROJECT_ID"]?.trim() || DEFAULT_PROJECT_ID;
    const targetDomain = normalizeDomain(
      process.env["BACKLINK_TARGET_DOMAIN"]?.trim() || DEFAULT_TARGET_DOMAIN,
    );

    if (!apiKey) {
      return {
        sourceDomain: data.domain,
        targetDomain,
        projectId,
        suggestions: [],
        sourceKeywordsFound: 0,
        targetKeywordsFound: 0,
        error:
          "OPENSEO_API_KEY belum tersedia di server. Tambahkan API key OpenSEO sebagai environment secret.",
      };
    }

    try {
      const [sourceRows, targetRows] = await Promise.all([
        getRankedKeywords(apiKey, projectId, data.domain, 40),
        getRankedKeywords(apiKey, projectId, targetDomain, 100),
      ]);

      if (targetRows.length === 0) {
        return {
          sourceDomain: data.domain,
          targetDomain,
          projectId,
          suggestions: [],
          sourceKeywordsFound: sourceRows.length,
          targetKeywordsFound: 0,
          error: `OpenSEO belum mengembalikan ranked keyword untuk ${targetDomain}.`,
        };
      }

      const suggestions = scoreSuggestions({
        sourceRows,
        targetRows,
        history: data.history,
        sourceDr: data.sourceDr,
        targetDomain,
      });

      return {
        sourceDomain: data.domain,
        targetDomain,
        projectId,
        suggestions,
        sourceKeywordsFound: sourceRows.length,
        targetKeywordsFound: targetRows.length,
        error:
          suggestions.length === 0
            ? "Belum ditemukan kombinasi keyword dan target page yang memenuhi kriteria."
            : null,
      };
    } catch (error) {
      console.error("[Backlink Suggestions]", error);
      return {
        sourceDomain: data.domain,
        targetDomain,
        projectId,
        suggestions: [],
        sourceKeywordsFound: 0,
        targetKeywordsFound: 0,
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengambil rekomendasi dari OpenSEO.",
      };
    }
  });
