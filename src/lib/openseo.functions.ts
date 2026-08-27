import { createServerFn } from "@tanstack/react-start";

export type OpenSEOConfigResult = {
  configured: boolean;
  message: string;
};

/**
 * Cek apakah OpenSEO API key sudah tersimpan di environment server.
 * OpenSEO adalah tool riset berbasis MCP/agent. Key ini tersedia untuk server
 * jika ingin membangun integrasi riset SEO lebih lanjut.
 */
export const checkOpenSEOConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<OpenSEOConfigResult> => {
    const key = process.env["OPENSEO_API_KEY"];
    if (!key) {
      return {
        configured: false,
        message:
          "OpenSEO API key belum dikonfigurasi. Tambahkan secret OPENSEO_API_KEY di Project Settings.",
      };
    }

    return {
      configured: true,
      message:
        "OpenSEO API key sudah tersimpan di server. Integrasi riset SEO dapat dibangun di atas kredensial ini.",
    };
  },
);
