# Perbaikan Login pada Domain Kustom

## Temuan terverifikasi

- `seocenter.demohq.xyz` aktif, menjadi domain utama, dan DNS-nya tersambung.
- Backend serta layanan login sedang sehat.
- Login Email berhasil mencapai backend dari versi preview.
- File aplikasi yang saat ini tayang di domain kustom masih berisi alamat backend placeholder. Karena itu form login/daftar di domain kustom tidak terhubung ke backend yang benar.
- Domain kustom sudah termasuk dalam daftar alamat yang diizinkan untuk pengalihan autentikasi.

## Rencana

1. Pastikan konfigurasi build publik menggunakan URL dan publishable key backend Lovable Cloud yang dikelola project, tanpa menaruh secret di browser atau mengubah file integrasi yang dibuat otomatis.
2. Publikasikan ulang versi terbaru ke domain utama `seocenter.demohq.xyz` agar bundle lama yang berisi placeholder tergantikan.
3. Periksa file aplikasi yang baru tayang dan pastikan placeholder sudah tidak ada serta koneksi menuju backend project yang benar.
4. Uji langsung di domain kustom:
   - halaman `/auth` terbuka;
   - login Email berhasil dan masuk ke dashboard;
   - sesi tetap aktif setelah refresh;
   - mode daftar dapat mengirim permintaan ke layanan login tanpa error koneksi.
5. Jika login masih gagal setelah koneksi benar, gunakan respons login aktual untuk memperbaiki konfigurasi Email saja; tidak mengubah data, tabel, atau alur SEO.

## Batasan

- Tidak memindahkan hosting ke Vercel.
- Tidak mengubah data produksi atau membuat migrasi database.
- Tidak mengubah alur SEO, Apify, OpenAI, maupun integrasi legacy.
- Tidak mengekspos kunci rahasia ke frontend.

## Hasil yang diharapkan

`https://seocenter.demohq.xyz/auth` memakai backend project yang benar dan login/daftar Email dapat digunakan dari domain kustom.
