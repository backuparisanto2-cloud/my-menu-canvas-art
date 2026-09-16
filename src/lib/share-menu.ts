import type { MenuPage } from "@/data/menu-pages";

function absoluteUrl(url: string) {
  if (typeof window === "undefined") return url;
  return new URL(url, window.location.origin).href;
}

function whatsappFallback(page: MenuPage, url: string) {
  const text = `${page.title} — ${page.subtitle}\n${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
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
      const blob = await res.blob();
      const file = new File([blob], `${page.id}.webp`, {
        type: blob.type || "image/webp",
      });
      if (nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: page.title,
          text: `${page.title} — ${page.subtitle}`,
        });
        return;
      }
    }
  } catch (err) {
    if ((err as DOMException)?.name === "AbortError") return;
  }
  whatsappFallback(page, url);
}
