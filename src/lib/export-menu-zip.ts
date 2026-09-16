import JSZip from "jszip";

import type { MenuPage } from "@/data/menu-pages";
import { buildMenuHtml } from "@/lib/export-menu-html";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Unduh ZIP halaman statis: index.html + folder images berisi seluruh gambar. */
export async function downloadMenuZip(pages: MenuPage[], version: number) {
  const zip = new JSZip();
  const images = zip.folder("images")!;

  const rewritten: MenuPage[] = [];
  for (const [i, page] of pages.entries()) {
    const name = `${pad(i + 1)}-${page.id}.webp`;
    const res = await fetch(page.url);
    if (!res.ok) throw new Error(`Gagal memuat gambar ${page.id}`);
    images.file(name, await res.blob());
    rewritten.push({ ...page, url: `images/${name}` });
  }

  zip.file("index.html", buildMenuHtml(rewritten));
  zip.file(
    "versi.txt",
    `Menu Kantin Inyong\nVersi build: ${version}\nDibuat: ${new Date().toISOString()}\nJumlah halaman: ${pages.length}\n`,
  );

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `menu-kantin-inyong-v${version}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
