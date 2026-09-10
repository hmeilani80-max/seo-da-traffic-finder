import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAiJson } from "@/lib/ai/provider.server";

export type AuditFindingStatus =
  | "passed"
  | "urgent"
  | "issue"
  | "warning"
  | "not_found"
  | "unable_to_verify";

export type AuditFinding = {
  id: string;
  audit_id: string;
  category: string;
  check_key: string;
  title: string;
  status: AuditFindingStatus;
  url: string | null;
  evidence: Record<string, unknown>;
  source_type: string;
  source_ref: string | null;
  created_at: string;
};

export type SiteAudit = {
  id: string;
  project_id: string;
  target_url: string;
  status: "running" | "completed" | "partial" | "failed";
  source_summary: Record<string, unknown>;
  summary: Record<string, unknown>;
  error: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
};

export type AuditAnalysisOutput = {
  executiveSummary: string;
  priorityOrder: string[];
  issueAnalyses: Array<{
    findingId: string;
    priority: "urgent" | "high" | "medium" | "low";
    whyItMatters: string;
    howToFix: string;
    suggestedFix?: string;
  }>;
  nextActions: string[];
};

export type AuditAiAnalysis = {
  id: string;
  audit_id: string;
  provider: string;
  status: "ok" | "error";
  output: AuditAnalysisOutput | Record<string, unknown>;
  error: string | null;
  created_at: string;
};

type NewFinding = Omit<AuditFinding, "id" | "audit_id" | "created_at">;

type PageSnapshot = {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  contentType: string;
  html: string;
};

const MAX_PAGES = 20;
const MAX_SITEMAP_CANDIDATES = 100;
const MAX_HTML_BYTES = 2_000_000;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;
const USER_AGENT = "OptimasiSEOAudit/1.0 (+internal-seo-audit)";

function dbClient(value: unknown): SupabaseClient {
  return value as SupabaseClient;
}

function normalizedHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
}

function validatePublicUrl(raw: string): URL {
  const candidate = /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`;
  const url = new URL(candidate);

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("Website harus menggunakan HTTP atau HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error("URL dengan credential tidak didukung.");
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const ipv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
  const ipv6 = host.includes(":");
  const localSuffix = /\.(?:localhost|local|internal|lan|home|localdomain)$/i.test(host);

  if (
    !host.includes(".") ||
    host === "localhost" ||
    localSuffix ||
    ipv4 ||
    ipv6
  ) {
    throw new Error("Audit hanya boleh menjalankan crawl terhadap domain publik.");
  }

  url.hash = "";
  return url;
}

function sameAuditSite(left: URL, right: URL): boolean {
  return normalizedHostname(left.hostname) === normalizedHostname(right.hostname);
}

async function readTextLimited(response: Response, maxBytes = MAX_HTML_BYTES): Promise<string> {
  if (!response.body) return (await response.text()).slice(0, maxBytes);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        break;
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return text;
  } finally {
    reader.releaseLock();
  }
}

async function fetchText(rawUrl: string, timeout = REQUEST_TIMEOUT_MS): Promise<PageSnapshot> {
  const requested = validatePublicUrl(rawUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  let current = requested;

  try {
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
      const response = await fetch(current.toString(), {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,text/plain,application/xml;q=0.9,*/*;q=0.5",
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (redirects >= MAX_REDIRECTS) throw new Error("Terlalu banyak redirect saat crawl.");
        const location = response.headers.get("location");
        if (!location) throw new Error(`HTTP ${response.status} tanpa Location header.`);

        const next = validatePublicUrl(new URL(location, current).toString());
        if (!sameAuditSite(requested, next)) {
          throw new Error("Redirect ke domain lain diblokir untuk keamanan audit.");
        }
        current = next;
        continue;
      }

      const contentType = response.headers.get("content-type") ?? "";
      const html = await readTextLimited(response);
      return {
        requestedUrl: requested.toString(),
        finalUrl: current.toString(),
        status: response.status,
        contentType,
        html,
      };
    }

    throw new Error("Redirect crawl tidak dapat diselesaikan.");
  } finally {
    clearTimeout(timeoutId);
  }
}

function firstMatch(html: string, pattern: RegExp): string | null {
  return html.match(pattern)?.[1]?.replace(/\s+/g, " ").trim() || null;
}

function stripTags(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function metaContent(html: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${escaped}["'][^>]*>`, "i"),
  ];
  for (const pattern of patterns) {
    const value = firstMatch(html, pattern);
    if (value !== null) return value;
  }
  return null;
}

function canonicalHref(html: string): string | null {
  const patterns = [
    /<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["'][^>]*>/i,
  ];
  for (const pattern of patterns) {
    const value = firstMatch(html, pattern);
    if (value) return value;
  }
  return null;
}

function htmlLang(html: string): string | null {
  return firstMatch(html, /<html[^>]+lang=["']([^"']+)["']/i);
}

function extractLinks(html: string, base: URL): string[] {
  const links = new Set<string>();

  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>/gi)) {
    const raw = match[1]?.trim();
    if (!raw || /^(mailto:|tel:|javascript:)/i.test(raw)) continue;

    try {
      const url = validatePublicUrl(new URL(raw, base).toString());
      if (!sameAuditSite(base, url)) continue;
      if (/\.(?:jpg|jpeg|png|gif|webp|svg|pdf|zip|mp4|mp3|woff2?|ttf|css|js)(?:$|\?)/i.test(url.pathname)) continue;
      links.add(url.toString());
    } catch {
      // Invalid/untrusted links are excluded from the crawl queue.
    }
  }

  return [...links];
}

function sitemapUrls(xml: string, origin: URL): string[] {
  const out = new Set<string>();

  for (const match of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) {
    const raw = match[1]?.replace(/&amp;/g, "&").trim();
    if (!raw) continue;

    try {
      const url = validatePublicUrl(raw);
      if (!sameAuditSite(origin, url)) continue;
      out.add(url.toString());
      if (out.size >= MAX_SITEMAP_CANDIDATES) break;
    } catch {
      // Invalid/untrusted sitemap entries are excluded.
    }
  }

  return [...out];
}

function robotsDisallows(text: string): string[] {
  const rules: string[] = [];
  let applies = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey?.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      applies = value === "*" || value.toLowerCase().includes("optimasi");
    } else if (applies && key === "disallow" && value) {
      rules.push(value);
    }
  }

  return rules;
}

function allowedByRobots(url: string, disallows: string[]): boolean {
  const pathname = new URL(url).pathname || "/";
  if (disallows.includes("/")) return false;
  return !disallows.some((rule) => rule !== "/" && pathname.startsWith(rule));
}

function makeFinding(
  index: number | string,
  check: string,
  data: Omit<NewFinding, "check_key">,
): NewFinding {
  return {
    ...data,
    check_key: `${check}:${index}`,
  };
}

function inspectPage(page: PageSnapshot, index: number): NewFinding[] {
  const html = page.html;
  const url = page.finalUrl;
  const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = metaContent(html, "description");
  const robots = metaContent(html, "robots") ?? "";
  const canonical = canonicalHref(html);
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((match) => stripTags(match[1] ?? ""))
    .filter(Boolean);
  const lang = htmlLang(html);
  const viewport = metaContent(html, "viewport");
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  const missingAlt = images.filter((tag) => !/\balt\s*=\s*["'][^"']*["']/i.test(tag)).length;
  const jsonLdCount = (html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>/gi) ?? []).length;
  const bodyText = stripTags(html);
  const wordCount = bodyText ? bodyText.split(/\s+/).length : 0;
  const source = { source_type: "public_crawl", source_ref: url, url };

  return [
    makeFinding(index, "http_status", {
      ...source,
      category: "Crawlability",
      title: "HTTP status halaman dapat diakses",
      status: page.status >= 200 && page.status < 400 ? "passed" : page.status >= 400 ? "urgent" : "warning",
      evidence: { http_status: page.status, requested_url: page.requestedUrl, final_url: page.finalUrl },
    }),
    makeFinding(index, "https", {
      ...source,
      category: "Technical",
      title: "Halaman menggunakan HTTPS",
      status: new URL(url).protocol === "https:" ? "passed" : "warning",
      evidence: { protocol: new URL(url).protocol },
    }),
    makeFinding(index, "title", {
      ...source,
      category: "Metadata",
      title: "Title tag tersedia",
      status: title ? (title.length >= 15 && title.length <= 65 ? "passed" : "warning") : "issue",
      evidence: { title, length: title?.length ?? 0 },
    }),
    makeFinding(index, "meta_description", {
      ...source,
      category: "Metadata",
      title: "Meta description tersedia",
      status: description ? (description.length >= 70 && description.length <= 170 ? "passed" : "warning") : "warning",
      evidence: { meta_description: description, length: description?.length ?? 0 },
    }),
    makeFinding(index, "canonical", {
      ...source,
      category: "Technical",
      title: "Canonical URL tersedia",
      status: canonical ? "passed" : "warning",
      evidence: { canonical },
    }),
    makeFinding(index, "indexability", {
      ...source,
      category: "Crawlability",
      title: "Halaman tidak memiliki noindex",
      status: /(?:^|[,\s])noindex(?:$|[,\s])/i.test(robots) ? "urgent" : "passed",
      evidence: { meta_robots: robots || null },
    }),
    makeFinding(index, "h1", {
      ...source,
      category: "Content",
      title: "Struktur H1 terdeteksi",
      status: h1s.length === 1 ? "passed" : h1s.length === 0 ? "issue" : "warning",
      evidence: { h1_count: h1s.length, h1: h1s.slice(0, 3) },
    }),
    makeFinding(index, "html_lang", {
      ...source,
      category: "Technical",
      title: "Atribut bahasa HTML tersedia",
      status: lang ? "passed" : "warning",
      evidence: { lang },
    }),
    makeFinding(index, "viewport", {
      ...source,
      category: "Technical",
      title: "Viewport mobile tersedia",
      status: viewport ? "passed" : "warning",
      evidence: { viewport },
    }),
    makeFinding(index, "image_alt", {
      ...source,
      category: "Accessibility",
      title: "Image alt coverage",
      status: missingAlt === 0 ? "passed" : "warning",
      evidence: { image_count: images.length, missing_alt_count: missingAlt },
    }),
    makeFinding(index, "structured_data", {
      ...source,
      category: "Technical",
      title: "Structured data JSON-LD terdeteksi",
      status: jsonLdCount > 0 ? "passed" : "not_found",
      evidence: { json_ld_blocks: jsonLdCount },
    }),
    makeFinding(index, "content_presence", {
      ...source,
      category: "Content",
      title: "Konten teks dapat dibaca crawler",
      status: wordCount >= 100 ? "passed" : "warning",
      evidence: { approximate_word_count: wordCount },
    }),
  ];
}

function summarize(findings: NewFinding[]) {
  const counts: Record<AuditFindingStatus, number> = {
    passed: 0,
    urgent: 0,
    issue: 0,
    warning: 0,
    not_found: 0,
    unable_to_verify: 0,
  };

  for (const item of findings) counts[item.status] += 1;
  return { total_findings: findings.length, ...counts };
}

async function crawlSite(target: URL): Promise<{
  findings: NewFinding[];
  sourceSummary: Record<string, unknown>;
  partialErrors: string[];
}> {
  const origin = new URL(target.origin);
  const homepageUrl = new URL(target.pathname === "/" ? "/" : target.pathname, origin).toString();
  const robotsUrl = new URL("/robots.txt", origin).toString();
  const sitemapUrl = new URL("/sitemap.xml", origin).toString();
  const findings: NewFinding[] = [];
  const partialErrors: string[] = [];

  const [robotsResult, sitemapResult, homepageResult] = await Promise.allSettled([
    fetchText(robotsUrl),
    fetchText(sitemapUrl),
    fetchText(homepageUrl),
  ]);

  let robotsText = "";
  let sitemapText = "";
  let homepage: PageSnapshot | null = null;

  if (robotsResult.status === "fulfilled") {
    robotsText = robotsResult.value.html;
    findings.push(
      makeFinding("site", "robots_txt", {
        category: "Crawlability",
        title: "robots.txt tersedia",
        status:
          robotsResult.value.status >= 200 && robotsResult.value.status < 400
            ? "passed"
            : robotsResult.value.status === 404
              ? "not_found"
              : "warning",
        url: robotsUrl,
        evidence: { http_status: robotsResult.value.status },
        source_type: "robots",
        source_ref: robotsUrl,
      }),
    );
  } else {
    const message = robotsResult.reason instanceof Error ? robotsResult.reason.message : String(robotsResult.reason);
    partialErrors.push(`robots.txt: ${message}`);
    findings.push(
      makeFinding("site", "robots_txt", {
        category: "Crawlability",
        title: "robots.txt dapat diverifikasi",
        status: "unable_to_verify",
        url: robotsUrl,
        evidence: { error: message },
        source_type: "robots",
        source_ref: robotsUrl,
      }),
    );
  }

  if (sitemapResult.status === "fulfilled") {
    sitemapText = sitemapResult.value.html;
    const sitemapCount = sitemapUrls(sitemapText, origin).length;
    findings.push(
      makeFinding("site", "sitemap_xml", {
        category: "Crawlability",
        title: "sitemap.xml tersedia",
        status:
          sitemapResult.value.status >= 200 && sitemapResult.value.status < 400
            ? "passed"
            : sitemapResult.value.status === 404
              ? "not_found"
              : "warning",
        url: sitemapUrl,
        evidence: { http_status: sitemapResult.value.status, url_count: sitemapCount },
        source_type: "sitemap",
        source_ref: sitemapUrl,
      }),
    );
  } else {
    const message = sitemapResult.reason instanceof Error ? sitemapResult.reason.message : String(sitemapResult.reason);
    partialErrors.push(`sitemap.xml: ${message}`);
    findings.push(
      makeFinding("site", "sitemap_xml", {
        category: "Crawlability",
        title: "sitemap.xml dapat diverifikasi",
        status: "unable_to_verify",
        url: sitemapUrl,
        evidence: { error: message },
        source_type: "sitemap",
        source_ref: sitemapUrl,
      }),
    );
  }

  if (homepageResult.status === "fulfilled") {
    homepage = homepageResult.value;
  } else {
    const message = homepageResult.reason instanceof Error ? homepageResult.reason.message : String(homepageResult.reason);
    partialErrors.push(`homepage: ${message}`);
    findings.push(
      makeFinding(0, "page_fetch", {
        category: "Crawlability",
        title: "Homepage dapat di-crawl",
        status: "unable_to_verify",
        url: homepageUrl,
        evidence: { error: message },
        source_type: "public_crawl",
        source_ref: homepageUrl,
      }),
    );
  }

  const disallows = robotsDisallows(robotsText);
  const discovered = new Set<string>([homepageUrl]);
  for (const url of sitemapUrls(sitemapText, origin)) discovered.add(url);
  if (homepage) {
    for (const url of extractLinks(homepage.html, origin)) discovered.add(url);
  }

  const candidates = [...discovered]
    .filter((url) => allowedByRobots(url, disallows))
    .slice(0, MAX_PAGES);

  const pages: Array<PageSnapshot | null> = [];
  for (let i = 0; i < candidates.length; i += 4) {
    const batch = candidates.slice(i, i + 4);
    const results = await Promise.allSettled(
      batch.map((url) => (homepage && url === homepageUrl ? Promise.resolve(homepage) : fetchText(url))),
    );

    results.forEach((result, offset) => {
      const candidateUrl = batch[offset] ?? homepageUrl;
      if (result.status === "fulfilled") {
        pages.push(result.value);
        return;
      }

      pages.push(null);
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      partialErrors.push(`${candidateUrl}: ${message}`);
      findings.push(
        makeFinding(i + offset, "page_fetch", {
          category: "Crawlability",
          title: "Halaman dapat di-crawl",
          status: "unable_to_verify",
          url: candidateUrl,
          evidence: { error: message },
          source_type: "public_crawl",
          source_ref: candidateUrl,
        }),
      );
    });
  }

  pages.forEach((page, index) => {
    if (!page) return;

    if (!/text\/html|application\/xhtml\+xml/i.test(page.contentType) && !/<html\b/i.test(page.html)) {
      findings.push(
        makeFinding(index, "html_content", {
          category: "Crawlability",
          title: "Response berisi dokumen HTML",
          status: "unable_to_verify",
          url: page.finalUrl,
          evidence: { content_type: page.contentType, http_status: page.status },
          source_type: "public_crawl",
          source_ref: page.finalUrl,
        }),
      );
      return;
    }

    findings.push(...inspectPage(page, index));
  });

  return {
    findings,
    partialErrors,
    sourceSummary: {
      method: "public_crawl",
      max_pages: MAX_PAGES,
      pages_discovered: discovered.size,
      pages_attempted: candidates.length,
      pages_succeeded: pages.filter(Boolean).length,
      robots_disallow_rules: disallows.length,
      robots_checked: true,
      sitemap_checked: true,
      redirect_policy: "same public hostname or www alias only",
      openseo_configured: Boolean(process.env["OPENSEO_API_KEY"]),
      openseo_used: false,
      note: "OpenSEO availability is recorded, but no OpenSEO facts are claimed until a verified adapter exists.",
    },
  };
}

function normalizeAnalysis(value: unknown, findingIds: Set<string>): AuditAnalysisOutput {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const stringArray = (input: unknown) =>
    Array.isArray(input)
      ? input.map((item) => String(item ?? "").trim()).filter(Boolean).slice(0, 20)
      : [];

  const issueAnalyses = (Array.isArray(raw["issueAnalyses"]) ? raw["issueAnalyses"] : [])
    .map((item) => {
      const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      const findingId = String(row["findingId"] ?? "");
      const priorityRaw = String(row["priority"] ?? "medium");
      const priority = (["urgent", "high", "medium", "low"].includes(priorityRaw)
        ? priorityRaw
        : "medium") as "urgent" | "high" | "medium" | "low";

      return {
        findingId,
        priority,
        whyItMatters: String(row["whyItMatters"] ?? "").trim(),
        howToFix: String(row["howToFix"] ?? "").trim(),
        suggestedFix: String(row["suggestedFix"] ?? "").trim() || undefined,
      };
    })
    .filter((item) => findingIds.has(item.findingId) && item.whyItMatters && item.howToFix)
    .slice(0, 50);

  return {
    executiveSummary: String(raw["executiveSummary"] ?? "Belum cukup data untuk membuat ringkasan AI.").trim(),
    priorityOrder: stringArray(raw["priorityOrder"]),
    issueAnalyses,
    nextActions: stringArray(raw["nextActions"]),
  };
}

export const listProjectAuditsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string }) => ({
    projectId: String(input?.projectId ?? "").trim(),
  }))
  .handler(async ({ data, context }): Promise<SiteAudit[]> => {
    if (!data.projectId) return [];
    const db = dbClient(context.supabase);
    const { data: rows, error } = await db
      .from("site_audits")
      .select("id,project_id,target_url,status,source_summary,summary,error,started_at,completed_at,created_at")
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return (rows ?? []) as SiteAudit[];
  });

export const getAuditDetailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { auditId: string }) => ({
    auditId: String(input?.auditId ?? "").trim(),
  }))
  .handler(async ({ data, context }) => {
    if (!data.auditId) throw new Error("Audit wajib dipilih.");
    const db = dbClient(context.supabase);

    const [auditResult, findingResult, analysisResult] = await Promise.all([
      db
        .from("site_audits")
        .select("id,project_id,target_url,status,source_summary,summary,error,started_at,completed_at,created_at")
        .eq("id", data.auditId)
        .single(),
      db
        .from("audit_findings")
        .select("id,audit_id,category,check_key,title,status,url,evidence,source_type,source_ref,created_at")
        .eq("audit_id", data.auditId)
        .order("created_at"),
      db
        .from("audit_ai_analyses")
        .select("id,audit_id,provider,status,output,error,created_at")
        .eq("audit_id", data.auditId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (auditResult.error) throw auditResult.error;
    if (findingResult.error) throw findingResult.error;
    if (analysisResult.error) throw analysisResult.error;

    return {
      audit: auditResult.data as SiteAudit,
      findings: (findingResult.data ?? []) as AuditFinding[],
      analyses: (analysisResult.data ?? []) as AuditAiAnalysis[],
    };
  });

export const runSiteAuditFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string }) => ({
    projectId: String(input?.projectId ?? "").trim(),
  }))
  .handler(async ({ data, context }) => {
    if (!data.projectId) throw new Error("Project wajib dipilih.");
    const db = dbClient(context.supabase);

    const { data: project, error: projectError } = await db
      .from("projects")
      .select("id,name,client_domain,workspace_id")
      .eq("id", data.projectId)
      .single();

    if (projectError || !project) throw projectError ?? new Error("Project tidak ditemukan.");
    if (!project.workspace_id) throw new Error("Project belum memiliki workspace.");
    if (!project.client_domain) throw new Error("Project belum memiliki website/domain untuk diaudit.");

    const target = validatePublicUrl(String(project.client_domain));
    const { data: audit, error: auditError } = await db
      .from("site_audits")
      .insert({
        workspace_id: project.workspace_id,
        project_id: project.id,
        created_by: context.userId,
        target_url: target.toString(),
        status: "running",
      })
      .select("id")
      .single();

    if (auditError || !audit) throw auditError ?? new Error("Gagal membuat audit run.");

    try {
      const result = await crawlSite(target);
      const rows = result.findings.map((item) => ({
        workspace_id: project.workspace_id,
        project_id: project.id,
        audit_id: audit.id,
        category: item.category,
        check_key: item.check_key,
        title: item.title,
        status: item.status,
        url: item.url,
        evidence: item.evidence,
        source_type: item.source_type,
        source_ref: item.source_ref,
      }));

      if (rows.length) {
        const { error: findingError } = await db.from("audit_findings").insert(rows);
        if (findingError) throw findingError;
      }

      const summary = summarize(result.findings);
      const pageFactCount = result.findings.filter((item) => item.source_type === "public_crawl").length;
      const status = pageFactCount === 0 ? "failed" : result.partialErrors.length ? "partial" : "completed";

      const { error: finishError } = await db
        .from("site_audits")
        .update({
          status,
          source_summary: result.sourceSummary,
          summary,
          error: result.partialErrors.length ? result.partialErrors.slice(0, 10).join("\n") : null,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", audit.id);

      if (finishError) throw finishError;
      return { auditId: String(audit.id), status, summary };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Audit gagal dijalankan.";
      await db
        .from("site_audits")
        .update({
          status: "failed",
          error: message,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", audit.id);
      throw error;
    }
  });

export const analyzeAuditFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { auditId: string }) => ({
    auditId: String(input?.auditId ?? "").trim(),
  }))
  .handler(async ({ data, context }) => {
    if (!data.auditId) throw new Error("Audit wajib dipilih.");
    const db = dbClient(context.supabase);

    const { data: audit, error: auditError } = await db
      .from("site_audits")
      .select("id,workspace_id,project_id,target_url,summary,status")
      .eq("id", data.auditId)
      .single();

    if (auditError || !audit) throw auditError ?? new Error("Audit tidak ditemukan.");

    const { data: findings, error: findingError } = await db
      .from("audit_findings")
      .select("id,category,check_key,title,status,url,evidence,source_type")
      .eq("audit_id", data.auditId)
      .neq("status", "passed")
      .limit(80);

    if (findingError) throw findingError;

    const factualFindings = findings ?? [];
    const findingIds = new Set(factualFindings.map((item) => String(item.id)));
    const ai = await runAiJson<unknown>({
      temperature: 0.2,
      system: [
        "You are an SEO Audit Analyst inside an agency operating system.",
        "Use ONLY the factual audit findings supplied in the user message.",
        "Do not invent traffic, rankings, performance metrics, crawl facts, business facts, or issues not present in the supplied findings.",
        "Explain priority, why each issue matters, how to fix it, and provide suggested copy/fix only when the finding supports it.",
        "Return JSON only with keys executiveSummary, priorityOrder, issueAnalyses, nextActions.",
        "issueAnalyses items: {findingId, priority, whyItMatters, howToFix, suggestedFix?}. priority must be urgent/high/medium/low.",
        "Write concise professional Indonesian.",
      ].join("\n"),
      user: JSON.stringify({
        audit: { target_url: audit.target_url, status: audit.status, summary: audit.summary },
        findings: factualFindings,
      }),
    });

    const output = normalizeAnalysis(ai.data, findingIds);
    const { data: saved, error: saveError } = await db
      .from("audit_ai_analyses")
      .insert({
        workspace_id: audit.workspace_id,
        project_id: audit.project_id,
        audit_id: audit.id,
        provider: ai.provider,
        status: ai.error ? "error" : "ok",
        input_summary: { finding_count: factualFindings.length },
        output,
        error: ai.error,
        created_by: context.userId,
      })
      .select("id")
      .single();

    if (saveError || !saved) throw saveError ?? new Error("Gagal menyimpan AI Audit Analysis.");
    return { analysisId: String(saved.id), provider: ai.provider, error: ai.error, output };
  });

export const createTaskFromFindingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { findingId: string }) => ({
    findingId: String(input?.findingId ?? "").trim(),
  }))
  .handler(async ({ data, context }) => {
    if (!data.findingId) throw new Error("Finding wajib dipilih.");
    const db = dbClient(context.supabase);

    const { data: item, error } = await db
      .from("audit_findings")
      .select("id,audit_id,workspace_id,project_id,title,status,url,check_key")
      .eq("id", data.findingId)
      .single();

    if (error || !item) throw error ?? new Error("Finding tidak ditemukan.");
    if (item.status === "passed") throw new Error("Finding Passed tidak perlu dibuat menjadi task.");

    const priority = item.status === "urgent" ? "urgent" : item.status === "issue" ? "high" : "medium";
    const { data: task, error: taskError } = await db
      .from("tasks")
      .insert({
        workspace_id: item.workspace_id,
        project_id: item.project_id,
        title: item.title,
        description: `Audit finding: ${item.check_key}${item.url ? `\nURL: ${item.url}` : ""}`,
        status: "todo",
        priority,
        source_type: "audit_finding",
        source_id: item.id,
        source_refs: [
          {
            type: "audit_finding",
            id: item.id,
            audit_id: item.audit_id,
            check_key: item.check_key,
            url: item.url,
          },
        ],
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
