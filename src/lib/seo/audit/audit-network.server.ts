import { lookup } from "node:dns/promises";
import * as http from "node:http";
import * as https from "node:https";
import { isIP } from "node:net";

export type SafePageSnapshot = {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  contentType: string;
  html: string;
};

type PublicAddress = { address: string; family: 4 | 6 };

type SafeFetchOptions = {
  timeoutMs: number;
  maxBytes: number;
  maxRedirects: number;
  userAgent: string;
};

function normalizedHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
}

function parseIpv4(address: string): number[] | null {
  if (isIP(address) !== 4) return null;
  const parts = address.split(".").map(Number);
  return parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
    ? parts
    : null;
}

function isUnsafeIpv4(address: string): boolean {
  const parts = parseIpv4(address);
  if (!parts) return true;
  const [a, b, c] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isUnsafeIpv6(address: string): boolean {
  const value = address.toLowerCase().split("%")[0] ?? "";
  if (isIP(value) !== 6) return true;

  if (value === "::" || value === "::1") return true;

  const mapped = value.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) return isUnsafeIpv4(mapped[1]);

  const first = Number.parseInt(value.split(":")[0] || "0", 16);
  // Restrict direct IPv6 targets to global unicast 2000::/3. This excludes
  // link-local, ULA, multicast, documentation, transition, and unspecified ranges.
  if (first < 0x2000 || first > 0x3fff) return true;
  if (value.startsWith("2001:db8:")) return true; // documentation

  return false;
}

function isUnsafeAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return isUnsafeIpv4(address);
  if (family === 6) return isUnsafeIpv6(address);
  return true;
}

async function resolvePinnedAddress(hostname: string): Promise<PublicAddress> {
  const results = await lookup(hostname, { all: true, verbatim: true });
  if (!results.length) throw new Error("DNS domain audit tidak menghasilkan alamat yang dapat digunakan.");

  const unsafe = results.find((result) => isUnsafeAddress(result.address));
  if (unsafe) {
    throw new Error("Domain audit resolve ke alamat private/reserved dan diblokir untuk keamanan.");
  }

  const first = results[0];
  if (!first || (first.family !== 4 && first.family !== 6)) {
    throw new Error("DNS domain audit tidak menghasilkan alamat IPv4/IPv6 yang valid.");
  }
  return { address: first.address, family: first.family };
}

function validateAuditUrl(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Website harus menggunakan HTTP atau HTTPS.");
  }
  if (url.username || url.password) throw new Error("URL dengan credential tidak didukung.");
  if (!url.hostname.includes(".") || url.hostname.toLowerCase() === "localhost") {
    throw new Error("Audit hanya boleh menjalankan crawl terhadap domain publik.");
  }
  if (isIP(url.hostname)) {
    throw new Error("Audit terhadap literal IP diblokir; gunakan hostname publik.");
  }
  url.hash = "";
  return url;
}

async function requestOnce(
  url: URL,
  pinned: PublicAddress,
  options: SafeFetchOptions,
): Promise<{ status: number; contentType: string; location: string | null; body: string }> {
  const transport = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    let settled = false;
    const chunks: Buffer[] = [];
    let bytes = 0;
    let request: http.ClientRequest;

    const totalTimer = setTimeout(() => {
      if (settled) return;
      request?.destroy(new Error("Request audit melewati batas waktu."));
    }, options.timeoutMs);

    const finishReject = (error: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(totalTimer);
      reject(error);
    };

    request = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: {
          "User-Agent": options.userAgent,
          Accept: "text/html,application/xhtml+xml,text/plain,application/xml;q=0.9,*/*;q=0.5",
          "Accept-Encoding": "identity",
        },
        lookup: (_hostname, _lookupOptions, callback) => {
          callback(null, pinned.address, pinned.family);
        },
        ...(url.protocol === "https:" ? { servername: url.hostname } : {}),
      },
      (response) => {
        const status = response.statusCode ?? 0;
        const contentType = String(response.headers["content-type"] ?? "");
        const location = typeof response.headers.location === "string" ? response.headers.location : null;

        const finishResolve = () => {
          if (settled) return;
          settled = true;
          clearTimeout(totalTimer);
          resolve({
            status,
            contentType,
            location,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        };

        response.on("data", (chunk: Buffer | string) => {
          if (settled) return;
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          const remaining = options.maxBytes - bytes;

          if (remaining <= 0) {
            finishResolve();
            response.destroy();
            return;
          }

          const accepted = buffer.length > remaining ? buffer.subarray(0, remaining) : buffer;
          chunks.push(accepted);
          bytes += accepted.length;

          if (bytes >= options.maxBytes) {
            finishResolve();
            response.destroy();
          }
        });
        response.on("end", finishResolve);
        response.on("error", (error) => finishReject(error instanceof Error ? error : new Error(String(error))));
      },
    );

    request.on("error", (error) => finishReject(error instanceof Error ? error : new Error(String(error))));
    request.end();
  });
}

export async function fetchPublicAuditText(rawUrl: string, options: SafeFetchOptions): Promise<SafePageSnapshot> {
  const requested = validateAuditUrl(rawUrl);
  const originHost = normalizedHostname(requested.hostname);
  let current = requested;

  for (let redirects = 0; redirects <= options.maxRedirects; redirects += 1) {
    const pinned = await resolvePinnedAddress(current.hostname);
    const response = await requestOnce(current, pinned, options);

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (redirects >= options.maxRedirects) throw new Error("Terlalu banyak redirect saat crawl.");
      if (!response.location) throw new Error(`HTTP ${response.status} tanpa Location header.`);

      const next = validateAuditUrl(new URL(response.location, current).toString());
      if (normalizedHostname(next.hostname) !== originHost) {
        throw new Error("Redirect ke domain lain diblokir untuk keamanan audit.");
      }
      current = next;
      continue;
    }

    return {
      requestedUrl: requested.toString(),
      finalUrl: current.toString(),
      status: response.status,
      contentType: response.contentType,
      html: response.body,
    };
  }

  throw new Error("Redirect crawl tidak dapat diselesaikan.");
}
