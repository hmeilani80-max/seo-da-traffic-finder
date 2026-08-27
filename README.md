# Riset Domain Pintar

Buatkan dashboard tools untuk manajemen riset & pembelian backlink domain, dengan fitur berikut:

KONTEKS ALUR KERJA:
User membeli backlink di rajabacklink.com untuk website client arsjadrasjid.com. Setiap kali cek domain, alurnya:
1. User cek apakah domain tersebut sudah pernah dibeli sebelumnya (cek ke semua tabel riwayat)
2. Jika SUDAH pernah dibeli -> catat/tandai di tabel "Domain Sudah Pernah"
3. Jika BELUM pernah -> sistem otomatis riset domain lewat Ahrefs API untuk ambil data DA (Domain Authority/Domain Rating) dan Traffic
4. Jika Traffic = 0 -> masukkan ke tabel "Traffic 0"
5. Jika Traffic > 0 -> tandai sebagai "Sudah Dibeli" dan masukkan ke tabel "Sudah Dibeli"

FITUR YANG DIBUTUHKAN:
- Halaman utama: input/search satu domain atau paste banyak domain sekaligus (bulk check, satu domain per baris)
- Untuk tiap domain yang di-submit, sistem cek dulu ke database (tabel riwayat gabungan) apakah domain sudah pernah muncul di tabel manapun
- Jika belum pernah, panggil Ahrefs API (gunakan API key yang bisa diisi user di halaman Settings) untuk ambil DR (Domain Rating) dan Organic Traffic domain tersebut
- Auto-routing hasil ke salah satu dari 3 tabel berdasarkan aturan di atas: "Domain Sudah Pernah", "Traffic 0", "Sudah Dibeli"
- 3 tabel tersebut ditampilkan sebagai tab/section terpisah di dashboard, masing-masing bisa: sortir, search, export ke CSV, dan hapus baris
- Setiap baris data domain menyimpan: nama domain, DA/DR, Traffic, tanggal dicek, status, catatan (opsional)
- Halaman Settings untuk menyimpan Ahrefs API Key dengan aman
- Dashboard ringkasan di halaman utama: total domain sudah dicek, jumlah per kategori (pie/bar chart sederhana), aktivitas terakhir
- Gunakan Supabase sebagai database (buatkan schema untuk 3 tabel di atas plus tabel log pengecekan)
- Desain bersih, modern, fokus produktivitas (mirip internal tool/admin dashboard), gunakan bahasa Indonesia di seluruh UI

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://seo-domain-finder.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0bcd0b80-3616-45ef-b4e4-bf9a4f18d597).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
