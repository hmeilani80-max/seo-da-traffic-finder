/**
 * Adapter Lovable managed AI / AI Gateway (server-only).
 *
 * Kunci LOVABLE_API_KEY hanya dibaca di dalam handler server.
 * Tidak pernah dikirim ke browser.
 */

import type { AiJsonRequest, AiJsonResponse, AiProvider } from "./ai.provider";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

export const lovableAiProvider: AiProvider = {
  id: "lovable",
  isConfigured: () => Boolean(process.env["LOVABLE_API_KEY"]),

  async json<T>(request: AiJsonRequest): Promise<AiJsonResponse<T>> {
    const model = request.model ?? DEFAULT_MODEL;
    const apiKey = process.env["LOVABLE_API_KEY"];

    if (!apiKey) {
      return {
        data: null,
        error:
          "LOVABLE_API_KEY belum tersedia di runtime server, sehingga AI terkelola belum bisa dipakai.",
        provider: "lovable",
        model,
      };
    }

    try {
      const response = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: `${request.system} Balas HANYA dengan JSON object valid.` },
            { role: "user", content: request.user },
          ],
        }),
      });

      if (response.status === 429) {
        return {
          data: null,
          error: "Batas pemakaian AI terkelola tercapai. Coba lagi nanti.",
          provider: "lovable",
          model,
        };
      }
      if (response.status === 402) {
        return {
          data: null,
          error: "Kredit AI terkelola habis. Tambahkan kredit untuk melanjutkan.",
          provider: "lovable",
          model,
        };
      }
      if (!response.ok) {
        const text = await response.text();
        return {
          data: null,
          error: `Lovable AI HTTP ${response.status}: ${text.slice(0, 300)}`,
          provider: "lovable",
          model,
        };
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        return { data: null, error: "Balasan AI kosong", provider: "lovable", model };
      }

      const cleaned = content
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/, "")
        .trim();

      return { data: JSON.parse(cleaned) as T, error: null, provider: "lovable", model };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Gagal memanggil AI terkelola",
        provider: "lovable",
        model,
      };
    }
  },
};
