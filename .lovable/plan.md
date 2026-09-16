# Perbaikan tombol WhatsApp: posisi, bounce tombol penuh, dan kirim gambar

## Perubahan

### 1. Posisi tombol WhatsApp pada kartu menu (src/routes/index.tsx)
- Ubah `top-[57px]` menjadi `top-[62px]` pada tombol WhatsApp di tiap kartu menu,
  sehingga jaraknya tepat 10 px di bawah tombol favorit (yang tetap di `top-3`).

### 2. Bounce pada keseluruhan tombol (src/routes/index.tsx dan src/components/menu-lightbox.tsx)
- Pindahkan class animasi `animate-wa-bounce` dari ikon WhatsApp ke tombol
  lingkaran hijau, sehingga tombol + logo bergerak bersama sebagai satu kesatuan.
- Turunkan amplitudo bounce di `src/styles.css` (keyframes `wa-bounce`) agar
  gerakannya lebih halus/rendah, dan pertahankan `motion-reduce:animate-none`.

### 3. Pastikan yang dibagikan adalah gambarnya (src/lib/share-menu.ts)
- Perkuat alur berbagi file: fetch gambar, tetapkan nama berkas & MIME sesuai
  tipe gambar asli (webp/jpeg/png), lalu bagikan lewat `navigator.share`
  dengan `files: [file]` sehingga WhatsApp menerima gambar, bukan teks.
- Jika perangkat tidak mendukung berbagi file, fallback tetap membuka WhatsApp
  dengan tautan gambar (perilaku terbaik yang mungkin di perangkat tersebut).

## Verifikasi
- Playwright viewport mobile: cek jarak tombol WhatsApp vs favorit (10 px),
  tombol yang beranimasi adalah lingkaran hijau utuh, tanpa error console.
- Cek console/network saat klik share untuk memastikan blob gambar diambil
  dan panggilan share membawa file.
