# Panduan Mengisi Environment Variables di Vercel

## Tujuan
Men-deploy project TanStack Start ini ke Vercel secara terpisah, sambil tetap menggunakan Lovable Cloud sebagai backend Supabase.

## Variabel yang Wajib Diisi di Vercel

Buka dashboard Vercel → project kamu → **Settings** → **Environment Variables**, lalu tambahkan variabel berikut.

### 1. Supabase (Lovable Cloud)

| Nama | Nilai | Keterangan |
|------|-------|------------|
| `SUPABASE_URL` | URL Supabase project | Sama dengan `VITE_SUPABASE_URL` |
| `SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key | Sama dengan `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `VITE_SUPABASE_URL` | URL Supabase project | Dibaca oleh kode client-side |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key | Dibaca oleh kode client-side |

Cara mendapatkan nilai:
- Buka **Project Settings → Backend/Supabase** di Lovable.
- Salin Supabase URL dan publishable/anon key.
- Paste ke semua empat variabel di atas (duplikasi sengaja, karena server dan client membaca nama berbeda).

### 2. SEO & AI Providers

| Nama | Nilai | Keterangan |
|------|-------|------------|
| `APIFY_TOKEN` | Token dari Apify Console | Prioritas; atau gunakan `APIFY_API_KEY` |
| `APIFY_API_KEY` | API key Apify alternatif | Fallback jika `APIFY_TOKEN` kosong |
| `OPENAI_API_KEY` | `sk-...` dari platform.openai.com | Wajib diawali `sk-`, bukan key OpenSEO |

Cara mendapatkan nilai:
- **Apify**: https://console.apify.com → Settings → API & Integrations → copy API token.
- **OpenAI**: https://platform.openai.com/api-keys → buat new secret key → copy key yang diawali `sk-`.

### 3. Lovable (opsional, hanya jika pakai fitur khusus)

| Nama | Nilai | Keterangan |
|------|-------|------------|
| `LOVABLE_API_KEY` | API key dari Lovable | Hanya diperlukan untuk fitur Lovable-specific |

## Batasan Penting: Lovable Cloud

- **SUPABASE_SERVICE_ROLE_KEY tidak tersedia di Lovable Cloud**. Jangan membuat placeholder atau key palsu.
- Semua operasi database di aplikasi ini sudah dirancang menggunakan **authenticated user token** melalui `requireSupabaseAuth`, sehingga service role key tidak diperlukan untuk fitur normal.
- Jika di masa depan kamu butuh admin/cron job yang bypass RLS, kamu harus pindah ke **Supabase eksternal** (self-managed), bukan Lovable Cloud.

## Build Settings di Vercel

Project ini menggunakan TanStack Start + Nitro + Cloudflare Workers target. Di Vercel:

- **Framework Preset**: pilih `Other`
- **Build Command**: sesuaikan dengan `package.json`, biasanya `npm run build` atau `bun run build`
- **Output Directory**: biarkan default (`dist` atau `.output`, tergantung adapter)
- **Install Command**: `npm install` atau `bun install`

Catatan: karena target build aslinya adalah Cloudflare Worker, deploy ke Vercel mungkin memerlukan adapter Vercel Edge atau penyesuaian `vite.config.ts`. Jika build gagal karena target Worker, kita perlu menambahkan adapter Vercel di tahap berikutnya.

## Environment Target

Pastikan setiap variabel di-apply ke environment yang sesuai:
- **Production**: untuk deploy live.
- **Preview**: untuk deploy branch/preview URL.
- **Development**: jika kamu juga pakai Vercel CLI untuk local dev.

## Langkah Verifikasi Setelah Deploy

1. Deploy ke Vercel.
2. Buka preview URL.
3. Coba login (Supabase auth harus tetap berfungsi karena publishable key sudah benar).
4. Coba fitur Domain Research atau Keyword Research untuk memastikan Apify/OpenAI terhubung.
5. Cek Vercel Runtime Logs jika ada error 401/500.

## Blocker yang Mungkin Muncul

- Jika build gagal karena target Cloudflare Worker, kita perlu mengganti adapter di `vite.config.ts`.
- Jika Supabase auth gagal, periksa apakah URL/key sudah benar dan tidak ada whitespace.
- Jika OpenAI error 401, pastikan key diawali `sk-` dan bukan key OpenSEO (`oseo_...`).
