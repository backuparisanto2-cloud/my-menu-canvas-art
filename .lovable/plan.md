# Halaman Menu Penuh Layar + Jarak 15 px + Transisi Lebih Jelas

## Yang akan berubah

1. **Gambar menutupi layar penuh**
   - Di ponsel, foto menu dibuat selebar layar tanpa sisa ruang di kiri/kanan (padding samping dihilangkan) dan sudut membulat dilepas agar benar-benar mentok tepi.
   - Di layar besar (tablet/desktop) tetap ada batas lebar dan sudut membulat seperti sekarang, supaya tidak terlalu melebar.
   - Catatan: tinggi gambar mengikuti proporsi asli foto, jadi satu halaman mengisi lebar penuh; tinggi tidak dipaksa agar foto tidak terpotong.

2. **Jarak antar halaman 15 px**
   - Jarak vertikal antar foto disetel tepat 15 px di ponsel (tetap lebih lega di layar besar).

3. **Transisi masuk yang lebih jelas tapi ringan**
   - Setiap halaman muncul dengan naik-halus + memudar, jarak gerak sedikit diperbesar agar terasa jelas, durasi dipercepat (sekitar 0,42 detik) agar tetap ringan dan cepat.
   - Jeda antar halaman berurutan dipendekkan supaya scroll tidak terasa menunggu.
   - Tetap hormati pengaturan "kurangi animasi" pada perangkat.

## Detail teknis

- `src/routes/index.tsx`
  - Kontainer utama: `gap-[15px] px-0 py-[15px] sm:gap-6 sm:px-4 sm:py-6`.
  - `<img>`: `rounded-none sm:rounded-2xl`, tetap `w-full h-auto` dengan `aspectRatio` yang ada.
  - `figure`: `scroll-mt-0 sm:scroll-mt-2`; transisi jadi `duration-[420ms]`, offset awal `translate3d(0,26px,0) scale(.99)`, `transitionDelay` `Math.min(index,2) * 35ms`.
  - Tombol favorit/WhatsApp tetap di posisi sekarang (kanan, WhatsApp 10 px di bawah favorit); offset kanan disesuaikan agar tidak menempel tepi saat gambar penuh.
- Tidak ada perubahan pada logika favorit, lightbox, maupun berbagi WhatsApp.

## Verifikasi

Cek di pratinjau ukuran ponsel: gambar mentok tepi kiri-kanan, jarak antar halaman 15 px, animasi muncul terasa jelas namun cepat, tanpa error.
