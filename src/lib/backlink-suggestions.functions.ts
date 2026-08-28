import { createServerFn } from "@tanstack/react-start";

const OPENSEO_MCP_URL = "https://app.openseo.so/mcp";
const DEFAULT_PROJECT_ID = "29a87a88-a855-446d-8595-fb3a0ff2c781";
const DEFAULT_TARGET_DOMAIN = "arsjadrasjid.com";

export type BacklinkHistoryItem = {
  keyword: string | null;
  targetPage: string | null;
};

export type DomainOverview = {
  organicTraffic: number | null;
  organicKeywords: number | null;
  backlinks: number | null;
  referringDomains: number | null;
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

  targetOverview?: DomainOverview | null;

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
  content?: Array<{
    type?: string;
    text?: string;
  }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

type JsonRpcEnvelope = {
  jsonrpc?: string;
  id?: string | number | null;

  result?: McpToolResult;

  error?: {
    code?: number;
    message?: string;
    data?: unknown;
  };
};

/**
 * Kata-kata umum yang tidak terlalu berguna
 * untuk menentukan topical relevance.
 */
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
  "agar",
  "bagi",
  "jadi",
  "lebih",
  "bisa",
  "akan",
  "saat",
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
  return (input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function tokenize(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(
      (token) =>
        token.length >= 3 &&
        !STOPWORDS.has(token),
    );
}

function toNumber(value: unknown): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  return null;
}

function asRecord(
  value: unknown,
): Record<string, unknown> | null {
  if (
    value != null &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return null;
}

function readPath(
  value: unknown,
  ...path: string[]
): unknown {
  let current: unknown = value;

  for (const key of path) {
    const record = asRecord(current);

    if (!record) {
      return undefined;
    }

    current = record[key];
  }

  return current;
}

/**
 * OpenSEO MCP dapat mengembalikan:
 *
 * 1. JSON biasa
 * 2. SSE dengan baris "data:"
 *
 * Fungsi ini menangani keduanya.
 */
function parseSseOrJson(
  text: string,
): JsonRpcEnvelope {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error(
      "OpenSEO mengembalikan response kosong.",
    );
  }

  try {
    return JSON.parse(trimmed) as JsonRpcEnvelope;
  } catch {
    const frames = trimmed
      .split(/\r?\n/)
      .filter((line) =>
        line.startsWith("data:"),
      )
      .map((line) =>
        line.slice(5).trim(),
      )
      .filter(Boolean);

    for (
      let index = frames.length - 1;
      index >= 0;
      index -= 1
    ) {
      const frame = frames[index];

      if (!frame) {
        continue;
      }

      try {
        return JSON.parse(
          frame,
        ) as JsonRpcEnvelope;
      } catch {
        // lanjut cari frame JSON yang valid
      }
    }
  }

  throw new Error(
    "Format response OpenSEO MCP tidak dikenali.",
  );
}

function toolErrorMessage(
  result: McpToolResult | undefined,
) {
  const text = result?.content
    ?.filter(
      (item) =>
        item.type === "text" &&
        typeof item.text === "string",
    )
    .map((item) => item.text)
    .join(" ")
    .trim();

  return (
    text ||
    "OpenSEO tool gagal dijalankan."
  );
}

/**
 * Generic OpenSEO MCP caller.
 *
 * API key hanya dibaca server-side.
 * Jangan pernah masukkan API key ke file ini.
 */
async function callOpenSeoTool(
  apiKey: string,
  name: string,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  const id = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

  const response = await fetch(
    OPENSEO_MCP_URL,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${apiKey}`,

        Accept:
          "application/json, text/event-stream",

        "Content-Type":
          "application/json",

        "Mcp-Method":
          "tools/call",

        "Mcp-Name":
          name,

        "MCP-Protocol-Version":
          "2026-07-28",
      },

      body: JSON.stringify({
        jsonrpc: "2.0",

        id,

        method: "tools/call",

        params: {
          name,

          arguments: args,

          _meta: {
            "io.modelcontextprotocol/protocolVersion":
              "2026-07-28",

            "io.modelcontextprotocol/clientCapabilities":
              {},
          },
        },
      }),
    },
  );

  const body = await response.text();

  if (!response.ok) {
    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new Error(
        "OpenSEO API key tidak valid atau tidak memiliki akses ke project.",
      );
    }

    throw new Error(
      `OpenSEO HTTP ${response.status}: ${
        body.slice(0, 220) ||
        response.statusText
      }`,
    );
  }

  const envelope =
    parseSseOrJson(body);

  if (envelope.error) {
    throw new Error(
      envelope.error.message ||
        "OpenSEO MCP error.",
    );
  }

  if (!envelope.result) {
    throw new Error(
      "OpenSEO tidak mengembalikan tool result.",
    );
  }

  if (envelope.result.isError) {
    throw new Error(
      toolErrorMessage(
        envelope.result,
      ),
    );
  }

  return envelope.result;
}

/**
 * Mengubah raw OpenSEO ranked keyword
 * menjadi format yang lebih sederhana.
 */
function mapRankedKeyword(
  item: unknown,
): RankedKeyword | null {
  const keyword =
    readPath(
      item,
      "keyword_data",
      "keyword",
    ) ??
    readPath(
      item,
      "keyword",
    );

  if (
    typeof keyword !== "string" ||
    !keyword.trim()
  ) {
    return null;
  }

  const url =
    readPath(
      item,
      "ranked_serp_element",
      "serp_item",
      "url",
    ) ??
    readPath(
      item,
      "ranked_serp_element",
      "url",
    ) ??
    readPath(
      item,
      "url",
    );

  const position =
    readPath(
      item,
      "ranked_serp_element",
      "serp_item",
      "rank_absolute",
    ) ??
    readPath(
      item,
      "ranked_serp_element",
      "rank_absolute",
    ) ??
    readPath(
      item,
      "rank_absolute",
    );

  const traffic =
    readPath(
      item,
      "ranked_serp_element",
      "serp_item",
      "etv",
    ) ??
    readPath(
      item,
      "ranked_serp_element",
      "etv",
    ) ??
    readPath(
      item,
      "etv",
    );

  const keywordDifficulty =
    readPath(
      item,
      "keyword_data",
      "keyword_properties",
      "keyword_difficulty",
    ) ??
    readPath(
      item,
      "keyword_data",
      "keyword_info",
      "keyword_difficulty",
    );

  const searchVolume =
    readPath(
      item,
      "keyword_data",
      "keyword_info",
      "search_volume",
    );

  const cpc =
    readPath(
      item,
      "keyword_data",
      "keyword_info",
      "cpc",
    );

  return {
    keyword:
      keyword.trim(),

    url:
      typeof url === "string" &&
      url.trim()
        ? url.trim()
        : null,

    position:
      toNumber(position),

    searchVolume:
      toNumber(searchVolume),

    traffic:
      toNumber(traffic),

    cpc:
      toNumber(cpc),

    keywordDifficulty:
      toNumber(keywordDifficulty),
  };
}

/**
 * Ambil ranked keywords sebuah domain
 * dari OpenSEO.
 */
async function getRankedKeywords(
  apiKey: string,
  projectId: string,
  target: string,
  limit: number,
) {
  const toolResult =
    await callOpenSeoTool(
      apiKey,
      "get_ranked_keywords",
      {
        projectId,

        target,

        scope: "domain",

        resultTypes: [
          "organic",
        ],

        maxRank: 50,

        sortBy:
          "traffic_estimate",

        limit,
      },
    );

  const raw =
    toolResult
      .structuredContent
      ?.["keywords"];

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map(mapRankedKeyword)
    .filter(
      (
        row,
      ): row is RankedKeyword =>
        row != null,
    );
}

/**
 * Ambil Domain Overview OpenSEO.
 *
 * Ini adalah data seperti yang tersedia pada:
 *
 * /domain?domain=arsjadrasjid.com
 *
 * Yang kita gunakan:
 * - Organic Traffic
 * - Organic Keywords
 * - Backlinks
 * - Referring Domains
 */
async function getDomainOverview(
  apiKey: string,
  projectId: string,
  domain: string,
): Promise<DomainOverview> {
  const toolResult =
    await callOpenSeoTool(
      apiKey,
      "get_domain_overview",
      {
        projectId,
        domain,
        scope: "domain",
      },
    );

  const data =
    toolResult.structuredContent ?? {};

  return {
    organicTraffic:
      toNumber(
        data["organicTraffic"],
      ),

    organicKeywords:
      toNumber(
        data["organicKeywords"],
      ),

    backlinks:
      toNumber(
        data["backlinks"],
      ),

    referringDomains:
      toNumber(
        data["referringDomains"],
      ),
  };
}

function isTargetUrl(
  url: string | null,
  targetDomain: string,
) {
  if (!url) {
    return false;
  }

  try {
    const host = new URL(url)
      .hostname
      .toLowerCase()
      .replace(/^www\./, "");

    return (
      host === targetDomain ||
      host.endsWith(
        `.${targetDomain}`,
      )
    );
  } catch {
    return false;
  }
}

/**
 * Membentuk "profil topik"
 * domain sumber berdasarkan ranked keywords.
 */
function sourceTokenWeights(
  rows: RankedKeyword[],
) {
  const weights =
    new Map<string, number>();

  for (
    const row of rows.slice(0, 40)
  ) {
    const volumeWeight =
      Math.log10(
        (row.searchVolume ?? 0) +
          10,
      );

    const trafficWeight =
      Math.log10(
        (row.traffic ?? 0) +
          10,
      );

    const positionBoost =
      row.position != null &&
      row.position <= 10
        ? 1.15
        : 1;

    const rowWeight =
      (
        volumeWeight * 0.55 +
        trafficWeight * 0.45
      ) * positionBoost;

    const uniqueTokens =
      new Set(
        tokenize(
          row.keyword,
        ),
      );

    for (
      const token of uniqueTokens
    ) {
      weights.set(
        token,
        (weights.get(token) ??
          0) + rowWeight,
      );
    }
  }

  const max =
    Math.max(
      0,
      ...weights.values(),
    );

  if (max > 0) {
    for (
      const [token, value]
      of weights
    ) {
      weights.set(
        token,
        value / max,
      );
    }
  }

  return weights;
}

/**
 * Mengukur kesesuaian topik
 * domain sumber dengan keyword/page target.
 */
function topicalRelevance(
  candidate: RankedKeyword,
  sourceWeights: Map<
    string,
    number
  >,
) {
  if (
    sourceWeights.size === 0
  ) {
    return 0.5;
  }

  let pagePath = "";

  if (candidate.url) {
    try {
      pagePath =
        new URL(
          candidate.url,
        ).pathname;
    } catch {
      pagePath =
        candidate.url;
    }
  }

  const keywordTokens =
    tokenize(
      candidate.keyword,
    );

  const pageTokens =
    tokenize(
      pagePath,
    );

  const tokens =
    new Set([
      ...keywordTokens,
      ...pageTokens,
    ]);

  if (
    tokens.size === 0
  ) {
    return 0.2;
  }

  let matched = 0;

  for (
    const token of tokens
  ) {
    matched +=
      sourceWeights.get(token) ??
      0;
  }

  const denominator =
    Math.max(
      1,
      Math.min(
        tokens.size,
        4,
      ),
    );

  const normalized =
    matched / denominator;

  return clamp(
    0.15 +
      normalized * 1.25,
  );
}

/**
 * Ranking yang paling menarik untuk backlink:
 *
 * 4-20 = striking distance
 * 21-30 = masih menarik
 * 1-3 = sudah sangat kuat sehingga urgency lebih rendah
 */
function rankOpportunity(
  position: number | null,
) {
  if (
    position == null
  ) {
    return 0.2;
  }

  if (
    position <= 3
  ) {
    return 0.45;
  }

  if (
    position <= 10
  ) {
    return 1;
  }

  if (
    position <= 20
  ) {
    return 0.95;
  }

  if (
    position <= 30
  ) {
    return 0.78;
  }

  if (
    position <= 40
  ) {
    return 0.58;
  }

  if (
    position <= 50
  ) {
    return 0.38;
  }

  return 0.2;
}

function buildReason(input: {
  row: RankedKeyword;
  topical: number;
  diversity: number;
  pageCount: number;
  anchorCount: number;
}) {
  const parts: string[] = [];

  if (
    input.row.position != null
  ) {
    const volume =
      input.row.searchVolume !=
      null
        ? `, volume ${Math.round(
            input.row
              .searchVolume,
          ).toLocaleString(
            "id-ID",
          )}`
        : "";

    parts.push(
      `Posisi ${Math.round(
        input.row.position,
      )}${volume} memberi ruang untuk didorong.`,
    );
  } else {
    parts.push(
      "Keyword memiliki potensi sebagai target backlink.",
    );
  }

  if (
    input.topical >= 0.7
  ) {
    parts.push(
      "Topiknya sangat relevan dengan domain sumber.",
    );
  } else if (
    input.topical >= 0.45
  ) {
    parts.push(
      "Topiknya cukup relevan dengan domain sumber.",
    );
  }

  if (
    input.pageCount === 0
  ) {
    parts.push(
      "Target page belum digunakan pada histori backlink.",
    );
  } else if (
    input.diversity >= 0.55
  ) {
    parts.push(
      `Target page baru digunakan ${input.pageCount}× di histori.`,
    );
  }

  if (
    input.anchorCount === 0
  ) {
    parts.push(
      "Anchor belum pernah digunakan sebelumnya.",
    );
  }

  return parts.join(" ");
}

function scoreSuggestions(input: {
  sourceRows: RankedKeyword[];
  targetRows: RankedKeyword[];

  history:
    BacklinkHistoryItem[];

  sourceDr:
    number | null;

  targetDomain:
    string;
}) {
  const sourceWeights =
    sourceTokenWeights(
      input.sourceRows,
    );

  /**
   * Kandidat hanya halaman
   * arsjadrasjid.com yang:
   *
   * - benar-benar punya URL
   * - punya organic keyword
   * - punya search volume
   */
  const candidates =
    input.targetRows.filter(
      (row) =>
        isTargetUrl(
          row.url,
          input.targetDomain,
        ) &&
        row.keyword.length >=
          3 &&
        (row.searchVolume ??
          0) > 0,
    );

  const maxVolume =
    Math.max(
      1,
      ...candidates.map(
        (row) =>
          row.searchVolume ??
          0,
      ),
    );

  const maxTraffic =
    Math.max(
      1,
      ...candidates.map(
        (row) =>
          row.traffic ?? 0,
      ),
    );

  /**
   * Hitung histori penggunaan
   * target page dan anchor.
   */
  const pageCounts =
    new Map<
      string,
      number
    >();

  const anchorCounts =
    new Map<
      string,
      number
    >();

  for (
    const item of input.history
  ) {
    const target =
      normalizeText(
        item.targetPage,
      );

    const keyword =
      normalizeText(
        item.keyword,
      );

    if (target) {
      pageCounts.set(
        target,
        (pageCounts.get(
          target,
        ) ?? 0) + 1,
      );
    }

    if (keyword) {
      anchorCounts.set(
        keyword,
        (anchorCounts.get(
          keyword,
        ) ?? 0) + 1,
      );
    }
  }

  /**
   * Hindari kombinasi keyword + URL
   * yang identik.
   */
  const seen =
    new Set<string>();

  const scored =
    candidates
      .filter((row) => {
        const key =
          `${normalizeText(
            row.keyword,
          )}|${normalizeText(
            row.url,
          )}`;

        if (
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      })
      .map((row) => {
        const targetPage =
          row.url as string;

        const normalizedPage =
          normalizeText(
            targetPage,
          );

        const normalizedAnchor =
          normalizeText(
            row.keyword,
          );

        const pageCount =
          pageCounts.get(
            normalizedPage,
          ) ?? 0;

        const anchorCount =
          anchorCounts.get(
            normalizedAnchor,
          ) ?? 0;

        /**
         * 35%
         * TOPICAL RELEVANCE
         */
        const topical =
          topicalRelevance(
            row,
            sourceWeights,
          );

        /**
         * Search Volume Score
         */
        const volumeScore =
          clamp(
            Math.log10(
              (row.searchVolume ??
                0) +
                1,
            ) /
              Math.log10(
                maxVolume +
                  1,
              ),
          );

        /**
         * Estimated Traffic Score
         */
        const trafficScore =
          clamp(
            Math.log10(
              (row.traffic ??
                0) +
                1,
            ) /
              Math.log10(
                maxTraffic +
                  1,
              ),
          );

        /**
         * 30%
         * SEO OPPORTUNITY
         *
         * Rank memiliki bobot terbesar.
         */
        const opportunity =
          clamp(
            rankOpportunity(
              row.position,
            ) *
              0.55 +
              volumeScore *
                0.35 +
              trafficScore *
                0.1,
          );

        /**
         * 20%
         * BACKLINK DIVERSITY
         *
         * Semakin sering page/anchor dipakai,
         * nilainya semakin turun.
         */
        const diversity =
          clamp(
            1 /
              (
                1 +
                pageCount *
                  0.35 +
                anchorCount *
                  0.7
              ),
          );

        /**
         * 15%
         * LINK STRENGTH FIT
         *
         * Membandingkan DR domain backlink
         * dengan Keyword Difficulty.
         */
        const difficulty =
          row.keywordDifficulty ??
          45;

        const strength =
          input.sourceDr ==
          null
            ? 0.55
            : clamp(
                (
                  input.sourceDr +
                  25
                ) /
                  (
                    Math.max(
                      0,
                      difficulty,
                    ) +
                    25
                  ),
              );

        /**
         * FINAL SCORE
         *
         * 35% Topical
         * 30% SEO Opportunity
         * 20% Diversity
         * 15% Link Strength
         */
        let score =
          topical * 0.35 +
          opportunity * 0.3 +
          diversity * 0.2 +
          strength * 0.15;

        /**
         * Homepage sedikit diturunkan
         * agar artikel spesifik lebih diprioritaskan.
         */
        try {
          const pathname =
            new URL(
              targetPage,
            ).pathname;

          if (
            pathname === "/"
          ) {
            score *= 0.9;
          }
        } catch {
          // URL sudah divalidasi sebelumnya
        }

        return {
          keyword:
            row.keyword,

          targetPage,

          score:
            Math.round(
              clamp(score) *
                100,
            ),

          rank:
            row.position !=
            null
              ? Math.round(
                  row.position,
                )
              : null,

          searchVolume:
            row.searchVolume !=
            null
              ? Math.round(
                  row.searchVolume,
                )
              : null,

          keywordDifficulty:
            row.keywordDifficulty !=
            null
              ? Math.round(
                  row.keywordDifficulty,
                )
              : null,

          trafficEstimate:
            row.traffic != null
              ? Math.round(
                  row.traffic,
                )
              : null,

          topicalRelevance:
            Math.round(
              topical * 100,
            ),

          seoOpportunity:
            Math.round(
              opportunity *
                100,
            ),

          backlinkDiversity:
            Math.round(
              diversity *
                100,
            ),

          linkStrengthFit:
            Math.round(
              strength * 100,
            ),

          reason:
            buildReason({
              row,
              topical,
              diversity,
              pageCount,
              anchorCount,
            }),
        } satisfies BacklinkSuggestion;
      })
      .sort(
        (a, b) =>
          b.score -
          a.score,
      );

  /**
   * Kita ingin 3 target page berbeda.
   */
  const selected:
    BacklinkSuggestion[] =
    [];

  const selectedPages =
    new Set<string>();

  for (
    const item of scored
  ) {
    const page =
      normalizeText(
        item.targetPage,
      );

    if (
      selectedPages.has(
        page,
      )
    ) {
      continue;
    }

    selected.push(item);

    selectedPages.add(
      page,
    );

    if (
      selected.length === 3
    ) {
      return selected;
    }
  }

  /**
   * Fallback jika jumlah unique page
   * kurang dari 3.
   */
  for (
    const item of scored
  ) {
    if (
      selected.includes(
        item,
      )
    ) {
      continue;
    }

    selected.push(item);

    if (
      selected.length === 3
    ) {
      break;
    }
  }

  return selected;
}

/**
 * MAIN SERVER FUNCTION
 *
 * Dipanggil dari BacklinkSuggestionPanel.
 */
export const suggestBacklinkPlacements =
  createServerFn({
    method: "POST",
  })
    .inputValidator(
      (data: {
        domain: string;
        sourceDr?:
          | number
          | null;
        history?:
          BacklinkHistoryItem[];
      }) => {
        const domain =
          normalizeDomain(
            String(
              data?.domain ??
                "",
            ),
          );

        if (
          !domain ||
          !domain.includes(
            ".",
          )
        ) {
          throw new Error(
            "Masukkan domain sumber yang valid.",
          );
        }

        const sourceDr =
          data.sourceDr ==
            null ||
          !Number.isFinite(
            Number(
              data.sourceDr,
            ),
          )
            ? null
            : clamp(
                Number(
                  data.sourceDr,
                ),
                0,
                100,
              );

        const history =
          Array.isArray(
            data.history,
          )
            ? data.history
                .slice(
                  0,
                  500,
                )
                .map(
                  (
                    item,
                  ) => ({
                    keyword:
                      typeof item?.keyword ===
                      "string"
                        ? item.keyword.slice(
                            0,
                            300,
                          )
                        : null,

                    targetPage:
                      typeof item?.targetPage ===
                      "string"
                        ? item.targetPage.slice(
                            0,
                            2048,
                          )
                        : null,
                  }),
                )
            : [];

        return {
          domain,
          sourceDr,
          history,
        };
      },
    )
    .handler(
      async ({
        data,
      }): Promise<BacklinkSuggestionResult> => {
        /**
         * API key hanya berada
         * di environment server.
         */
        const apiKey =
          process.env[
            "OPENSEO_API_KEY"
          ]?.trim();

        const projectId =
          process.env[
            "OPENSEO_PROJECT_ID"
          ]?.trim() ||
          DEFAULT_PROJECT_ID;

        const targetDomain =
          normalizeDomain(
            process.env[
              "BACKLINK_TARGET_DOMAIN"
            ]?.trim() ||
              DEFAULT_TARGET_DOMAIN,
          );

        if (!apiKey) {
          return {
            sourceDomain:
              data.domain,

            targetDomain,

            projectId,

            suggestions: [],

            sourceKeywordsFound:
              0,

            targetKeywordsFound:
              0,

            targetOverview:
              null,

            error:
              "OPENSEO_API_KEY belum tersedia di server. Tambahkan API key OpenSEO sebagai environment secret.",
          };
        }

        try {
          /**
           * Tiga data OpenSEO:
           *
           * 1. Ranked keyword domain backlink
           * 2. Ranked keyword arsjadrasjid.com
           * 3. Domain overview arsjadrasjid.com
           *
           * Domain overview tidak memblokir recommendation
           * jika call-nya gagal.
           */
          const [
            sourceRows,
            targetRows,
            targetOverview,
          ] =
            await Promise.all([
              getRankedKeywords(
                apiKey,
                projectId,
                data.domain,
                40,
              ),

              getRankedKeywords(
                apiKey,
                projectId,
                targetDomain,
                100,
              ),

              getDomainOverview(
                apiKey,
                projectId,
                targetDomain,
              ).catch(
                (error) => {
                  console.warn(
                    "[OpenSEO Domain Overview]",
                    error,
                  );

                  return null;
                },
              ),
            ]);

          if (
            targetRows.length ===
            0
          ) {
            return {
              sourceDomain:
                data.domain,

              targetDomain,

              projectId,

              suggestions: [],

              sourceKeywordsFound:
                sourceRows.length,

              targetKeywordsFound:
                0,

              targetOverview,

              error:
                `OpenSEO belum mengembalikan ranked keyword untuk ${targetDomain}.`,
            };
          }

          /**
           * Hitung ranking seluruh
           * kandidat target page.
           */
          const suggestions =
            scoreSuggestions({
              sourceRows,

              targetRows,

              history:
                data.history,

              sourceDr:
                data.sourceDr,

              targetDomain,
            });

          return {
            sourceDomain:
              data.domain,

            targetDomain,

            projectId,

            suggestions,

            sourceKeywordsFound:
              sourceRows.length,

            targetKeywordsFound:
              targetRows.length,

            targetOverview,

            error:
              suggestions.length ===
              0
                ? "Belum ditemukan kombinasi keyword dan target page yang memenuhi kriteria."
                : null,
          };
        } catch (error) {
          console.error(
            "[Backlink Suggestions]",
            error,
          );

          return {
            sourceDomain:
              data.domain,

            targetDomain,

            projectId,

            suggestions: [],

            sourceKeywordsFound:
              0,

            targetKeywordsFound:
              0,

            targetOverview:
              null,

            error:
              error instanceof
              Error
                ? error.message
                : "Gagal mengambil rekomendasi dari OpenSEO.",
          };
        }
      },
    );
