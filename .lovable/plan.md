# Halaman Admin Menu

Menambahkan halaman admin terkunci untuk mengelola foto menu, dengan urutan halaman otomatis, kompresi gambar otomatis, dan unduhan ZIP versi statis.

## Yang akan dibuat

**Login admin**
- Halaman `/admin` hanya bisa dibuka setelah masuk dengan email dan sandi.
- Akun dibuat memakai email yang Anda berikan (arisanto@mentarisatria.net.id). Sandi disimpan aman di sistem, tidak di dalam kode.
- Hanya akun itu yang punya hak admin; pengunjung biasa tetap hanya melihat menu.

**Kelola gambar menu**
- Tambah halaman baru (unggah satu atau beberapa gambar sekaligus).
- Hapus halaman.
- Ganti gambar pada halaman yang sudah ada.
- Ubah urutan dengan geser (drag) naik/turun; nomor halaman langsung diperbarui otomatis (01, 02, 03, ...) dan nama berkas mengikuti nomor barunya.
- Sunting judul dan keterangan singkat tiap halaman.

**Kompresi otomatis 20–30 KB WebP**
- Setiap gambar yang diunggah langsung dikonversi ke WebP di perangkat sebelum dikirim.
- Kualitas dicari otomatis sampai ukuran berkas jatuh di rentang 20–30 KB; jika belum masuk rentang, lebar gambar diturunkan bertahap.
- Ukuran akhir tiap berkas ditampilkan di daftar admin, jadi terlihat jelas hasilnya.

**Halaman menu publik ikut berubah**
- Halaman utama membaca daftar menu dari basis data, jadi setiap perubahan di admin langsung terlihat.
- 9 halaman menu yang ada sekarang dipindahkan menjadi data awal, sehingga tampilan tidak berubah setelah perubahan ini.

**Versi rilis dan tombol unduh ZIP**
- Setiap kali Anda menyimpan perubahan, nomor versi naik otomatis (mis. v12) beserta tanggal.
- Tombol "Unduh ZIP" menghasilkan satu berkas ZIP berisi `index.html` versi statis lengkap dengan seluruh gambar di dalam folder `images/`, siap dibuka atau diunggah ke hosting mana pun tanpa server.
- Nama ZIP memuat nomor versi, mis. `menu-inyong-v12.zip`.

## Catatan penting

- Fitur ini butuh basis data dan penyimpanan berkas, jadi Lovable Cloud akan diaktifkan lebih dulu.
- Sandi yang Anda tulis di chat sebaiknya diganti setelah masuk pertama kali, karena sudah pernah terkirim sebagai teks biasa.
- Gambar 20–30 KB berarti kompresi cukup kuat; untuk foto menu berisi teks kecil hasilnya bisa agak lunak. Jika nanti terasa kurang tajam, rentang ukuran bisa dinaikkan.

## Rincian teknis

- Cloud: tabel `menu_pages` (id, position, slug, title, subtitle, image_path, width, height, bytes) + tabel `site_version` (version, updated_at); tabel `user_roles` + fungsi `has_role` untuk hak admin; RLS: baca publik untuk `anon`, tulis hanya admin. GRANT eksplisit untuk setiap tabel baru.
- Storage: bucket publik `menu-images`; unggah dari admin, hapus saat halaman dihapus.
- Konversi WebP dengan `canvas.toBlob` di browser: pencarian biner kualitas 0.4–0.92, lalu penurunan lebar (1131 → 900 → 760) sampai 20–30 KB.
- Reindex: urutan disimpan sebagai `position` berurutan; penyimpanan urutan memakai satu server function yang menulis ulang seluruh posisi dalam satu transaksi (RPC) lalu menaikkan `site_version`.
- Route baru: `src/routes/auth.tsx` (masuk) dan `src/routes/_authenticated/admin.tsx` (kelola).
- `src/data/menu-pages.ts` diganti pembacaan dari Cloud lewat server function publik + TanStack Query; `src/lib/export-menu-html.ts` dipakai ulang untuk isi ZIP.
- ZIP dibuat di sisi klien dengan `jszip`: `index.html` + `images/NN-slug.webp` dengan tautan relatif.
