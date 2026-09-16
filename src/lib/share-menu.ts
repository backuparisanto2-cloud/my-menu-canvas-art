import type { MenuPage } from "@/data/menu-pages";

function absoluteUrl(url: string) {
  if (typeof window === "undefined") return url;
  return new URL(url, window.location.origin).href;
}

function whatsappFallback(page: MenuPage, url: string) {
  const text = `${page.title} — ${page.subtitle}\n${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}

function extFor(type: string) {
  if (type.includes("png")) return "png";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  return "webp";
}

/** Bagikan gambar menu: kirim berkas lewat menu berbagi ponsel, atau buka WhatsApp. */
export async function shareMenuImage(page: MenuPage) {
  const url = absoluteUrl(page.url);
  try {
    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
    };
    if (nav.share && nav.canShare) {
      const res = await fetch(page.url);
      if (!res.ok) throw new Error(`Gagal memuat gambar: ${res.status}`);
      const blob = await res.blob();
      // Pastikan MIME valid; andalkan tipe dari respons, default image/webp.
      const type = blob.type.startsWith("image/") ? blob.type : "image/webp";
      const file = new File([blob], `${page.id}.${extFor(type)}`, { type });
      // File gambar didahulukan: WhatsApp menerima gambar, bukan teks.
      if (nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: page.title,
          text: `${page.title} — ${page.subtitle}`,
        });
        return;
      }
      // Beberapa browser menolak files tapi menerima URL gambar sebagai teks.
      if (nav.canShare({ url })) {
        await nav.share({
          title: page.title,
          text: `${page.title} — ${page.subtitle}`,
          url,
        });
        return;
      }
    }
  } catch (err) {
    if ((err as DOMException)?.name === "AbortError") return;
  }
  whatsappFallback(page, url);
}
