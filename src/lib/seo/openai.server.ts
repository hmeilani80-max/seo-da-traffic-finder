/**
 * Helper OpenAI (server-only).
 *
 * OpenAI HANYA dipakai untuk penalaran semantik (relevansi/urutan).
 * OpenAI TIDAK BOLEH menghasilkan metrik SEO (DR, traffic, volume, KD, rank).
 */

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env["OPENAI_API_KEY"]);
}

export type OpenAiJsonResult<T> = {
  data: T | null;
  error: string | null;
};

/** Panggil OpenAI dan paksa balasan JSON. */
export async function openAiJson<T>(input: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
}): Promise<OpenAiJsonResult<T>> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    return {
      data: null,
      error:
        "OPENAI_API_KEY belum dikonfigurasi di server. Tambahkan secret tersebut untuk mengaktifkan rekomendasi AI.",
    };
  }

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: input.model ?? DEFAULT_MODEL,
        temperature: input.temperature ?? 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { data: null, error: `OpenAI HTTP ${response.status}: ${text.slice(0, 300)}` };
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return { data: null, error: "Balasan OpenAI kosong" };

    return { data: JSON.parse(content) as T, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Gagal memanggil OpenAI",
    };
  }
}
