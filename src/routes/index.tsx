import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Download, Heart, Menu, X } from "lucide-react";

import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { IMAGE_WIDTH, IMAGE_HEIGHT, type MenuPage } from "@/data/menu-pages";
import { getMenuPages } from "@/lib/menu.functions";
import { downloadMenuHtml } from "@/lib/export-menu-html";
import { useFavorites } from "@/hooks/use-favorites";
import { MenuLightbox } from "@/components/menu-lightbox";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { shareMenuImage } from "@/lib/share-menu";
import { preloadNow, preloadSequential } from "@/lib/preload-images";

export const menuPagesQuery = queryOptions({
  queryKey: ["menu-pages"],
  queryFn: () => getMenuPages(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(menuPagesQuery),
  errorComponent: () => (
    <p className="p-6 text-center text-sm text-[#5a3521]">Menu gagal dimuat. Coba muat ulang.</p>
  ),
  notFoundComponent: () => <p className="p-6 text-center text-sm">Halaman tidak ditemukan.</p>,
  head: () => ({
    meta: [
      { title: "Menu Kantin Inyong — Sate Kambing Muda Purwokerto" },
      {
        name: "description",
        content:
          "Daftar menu lengkap Umaeh Inyong Purwokerto: sate kambing muda, gule, tongseng, sate kambing se dunia, legenda, dan smart rice.",
      },
      { property: "og:title", content: "Menu Kantin Inyong — Umaeh Inyong Purwokerto" },
      {
        property: "og:description",
        content: "Sate kambing muda, gule, tongseng, dan menu legenda khas Banyumas.",
      },
    ],
  }),
  component: MenuApp,
});

function MenuApp() {
  const { data: menuPages } = useSuspenseQuery(menuPagesQuery);
  const { isFavorite, toggleFavorite, count } = useFavorites();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > window.innerHeight);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Preload bertahap semua halaman berikutnya setelah halaman pertama siap.
  useEffect(() => {
    const start = () => preloadSequential(menuPages.slice(1).map((p) => p.url));
    if (document.readyState === "complete") {
      const t = window.setTimeout(start, 400);
      return () => window.clearTimeout(t);
    }
    window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  // Tetangga langsung halaman yang sedang dibuka layar penuh dimuat lebih dulu.
  useEffect(() => {
    if (lightbox === null) return;
    preloadNow(
      [menuPages[lightbox + 1], menuPages[lightbox - 1], menuPages[lightbox + 2]]
        .filter(Boolean)
        .map((p) => p!.url),
    );
  }, [lightbox]);

  const goTo = (id: string) => {
    setSidebarOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const listed = onlyFavorites ? menuPages.filter((p) => isFavorite(p.id)) : menuPages;

  return (
    <div className="min-h-screen bg-[#faf5ea]">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Buka daftar halaman"
        className="fixed left-3 top-3 z-40 rounded-full bg-[#5a3521]/90 p-3 text-[#faf5ea] shadow-lg backdrop-blur"
      >
        <Menu className="h-5 w-5" />
      </button>

      <main className="mx-auto flex max-w-3xl flex-col gap-[15px] px-0 py-[15px] sm:gap-6 sm:px-4 sm:py-6">
        {menuPages.map((page, i) => (
          <MenuFigure
            key={page.id}
            page={page}
            index={i}
            priority={i === 0}
            favorite={isFavorite(page.id)}
            onToggle={() => toggleFavorite(page.id)}
            onOpen={() => setLightbox(i)}
            nextUrls={menuPages.slice(i + 1, i + 3).map((p) => p.url)}
          />
        ))}
        <footer className="pb-10 pt-4 text-center text-xs text-[#5a3521]/70">
          Umaeh Inyong · Jl. Gatot Subroto, Hetero Space, Purwokerto · 0851 0075 9000
        </footer>
      </main>

      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Kembali ke atas"
          className="fixed bottom-4 right-4 z-40 rounded-full bg-[#7ba428] p-3 text-white shadow-lg transition-opacity duration-300"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[82%] max-w-xs flex-col bg-[#faf5ea] shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-[#5a3521]/15 px-4 py-3">
              <div>
                <p className="text-base font-bold text-[#5a3521]">Kantin Inyong</p>
                <p className="text-xs text-[#5a3521]/70">Daftar halaman menu</p>
              </div>
              <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu">
                <X className="h-5 w-5 text-[#5a3521]" />
              </button>
            </div>

            <div className="flex gap-2 px-4 py-3">
              <button
                type="button"
                onClick={() => setOnlyFavorites((v) => !v)}
                className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                  onlyFavorites
                    ? "bg-[#7ba428] text-white"
                    : "bg-[#5a3521]/10 text-[#5a3521]"
                }`}
              >
                Favorit saja ({count})
              </button>
              <button
                type="button"
                onClick={() => downloadMenuHtml(menuPages)}
                className="flex items-center gap-1 rounded-full bg-[#5a3521] px-3 py-2 text-xs font-semibold text-[#faf5ea]"
              >
                <Download className="h-4 w-4" /> HTML
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 pb-6">
              {listed.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-[#5a3521]/60">
                  Belum ada halaman favorit.
                </p>
              )}
              {listed.map((page, i) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => goTo(page.id)}
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#5a3521]/8"
                >
                  <span className="mt-0.5 min-w-6 rounded-md bg-[#7ba428]/20 px-1.5 text-center text-xs font-bold text-[#4d6b18]">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#5a3521]">
                      {page.title}
                    </span>
                    <span className="block text-xs text-[#5a3521]/65">{page.subtitle}</span>
                  </span>
                  {isFavorite(page.id) && (
                    <Heart className="mt-0.5 h-4 w-4 shrink-0 fill-[#e03131] text-[#e03131]" />
                  )}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {lightbox !== null && (
        <MenuLightbox
          pages={menuPages}
          index={lightbox}
          onIndexChange={setLightbox}
          onClose={() => setLightbox(null)}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
}

function MenuFigure({
  page,
  index,
  priority,
  favorite,
  onToggle,
  onOpen,
  nextUrls,
}: {
  page: MenuPage;
  index: number;
  priority: boolean;
  favorite: boolean;
  onToggle: () => void;
  onOpen: () => void;
  nextUrls: string[];
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(priority);


  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  // Begitu satu halaman muncul, dua halaman berikutnya disiapkan.
  useEffect(() => {
    if (!visible) return;
    preloadNow(nextUrls);
  }, [visible, nextUrls]);

  return (
    <figure
      id={page.id}
      ref={ref}
      style={{
        transitionDelay: visible ? `${Math.min(index, 4) * 70}ms` : "0ms",
        transform: visible ? "none" : "translate3d(0,52px,0) scale(.955)",
        opacity: visible ? 1 : 0,
        willChange: "transform, opacity",
        contain: "content",
      }}
      className="relative m-0 scroll-mt-0 transition-[opacity,transform] duration-[540ms] ease-[cubic-bezier(.2,.7,.15,1.03)] sm:scroll-mt-2 motion-reduce:!transform-none motion-reduce:!opacity-100 motion-reduce:transition-none"
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Lihat ${page.title} layar penuh`}
        className="block w-full cursor-zoom-in"
      >
        <img
          src={page.url}
          alt={`${page.title} — ${page.subtitle}`}
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          style={{ aspectRatio: `${IMAGE_WIDTH} / ${IMAGE_HEIGHT}` }}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "low"}
          className="block h-auto w-full rounded-none sm:rounded-2xl"
        />
      </button>
      <button
        type="button"
        onClick={() => void shareMenuImage(page)}
        aria-label={`Bagikan ${page.title} via WhatsApp`}
        className="absolute right-3 top-[62px] rounded-full bg-[#25D366] p-2.5 text-white shadow-md transition-transform active:scale-90 animate-wa-bounce motion-reduce:animate-none"
      >
        <WhatsAppIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={favorite}
        aria-label={favorite ? `Hapus favorit ${page.title}` : `Tandai favorit ${page.title}`}
        className="absolute right-3 top-3 rounded-full bg-black/35 p-2.5 backdrop-blur transition-transform active:scale-90"
      >
        <Heart
          className={`h-5 w-5 transition-transform duration-200 ${favorite ? "fill-[#e03131] text-[#e03131] scale-110" : "text-white"}`}
        />
      </button>
    </figure>
  );
}
