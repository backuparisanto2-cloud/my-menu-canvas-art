import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, X } from "lucide-react";

import { IMAGE_HEIGHT, IMAGE_WIDTH, type MenuPage } from "@/data/menu-pages";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { shareMenuImage } from "@/lib/share-menu";

const MAX_SCALE = 2.5;

type Transform = { scale: number; x: number; y: number };
const IDENTITY: Transform = { scale: 1, x: 0, y: 0 };

// popstate yang kita picu sendiri (mis. saat menutup) tidak boleh menutup ulang
let suppressPop = 0;
let pushed = false;
let mounted = 0;

export function MenuLightbox({
  pages,
  index,
  onIndexChange,
  onClose,
  isFavorite,
  onToggleFavorite,
}: {
  pages: MenuPage[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const [transform, setTransform] = useState<Transform>(IDENTITY);
  const [drag, setDrag] = useState(0);
  const [animating, setAnimating] = useState(true);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    startDist: number;
    startScale: number;
    startX: number;
    startY: number;
    midX: number;
    midY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const lastTap = useRef(0);
  const surfaceRef = useRef<HTMLDivElement | null>(null);

  const page = pages[index];
  const zoomed = transform.scale > 1.01;

  const go = useCallback(
    (dir: number) => {
      const next = index + dir;
      if (next < 0 || next >= pages.length) return;
      setTransform(IDENTITY);
      onIndexChange(next);
    },
    [index, pages.length, onIndexChange],
  );

  const handlers = useRef({ close: onClose, go });
  handlers.current = { close: onClose, go };

  // kunci scroll halaman + tombol back perangkat
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mounted += 1;
    if (!pushed) {
      pushed = true;
      window.history.pushState({ lightbox: true }, "");
    }
    const onPop = () => {
      pushed = false;
      if (suppressPop > 0) {
        suppressPop -= 1;
        return;
      }
      handlers.current.close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handlers.current.close();
      if (e.key === "ArrowRight") handlers.current.go(1);
      if (e.key === "ArrowLeft") handlers.current.go(-1);
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      mounted -= 1;
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.setTimeout(() => {
        window.removeEventListener("popstate", onPop);
        // hanya mundur bila benar-benar tertutup (bukan remount mode pengembangan)
        if (mounted === 0 && pushed) {
          pushed = false;
          suppressPop += 1;
          window.history.back();
        }
      }, 0);
    };
  }, []);

  const zoomAt = (clientX: number, clientY: number) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    setAnimating(true);
    setTransform((t) => {
      if (t.scale > 1.01) return IDENTITY;
      const k = MAX_SCALE;
      return { scale: k, x: px - (px - t.x) * k, y: py - (py - t.y) * k };
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setAnimating(false);

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [
        { x: number; y: number },
        { x: number; y: number },
      ];
      const rect = surfaceRef.current?.getBoundingClientRect();
      gesture.current = {
        startDist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        startScale: transform.scale,
        startX: transform.x,
        startY: transform.y,
        midX: (a.x + b.x) / 2,
        midY: (a.y + b.y) / 2,
        originX: rect ? (a.x + b.x) / 2 - rect.left : 0,
        originY: rect ? (a.y + b.y) / 2 - rect.top : 0,
      };
    } else if (pointers.current.size === 1) {
      gesture.current = {
        startDist: 0,
        startScale: transform.scale,
        startX: transform.x,
        startY: transform.y,
        midX: e.clientX,
        midY: e.clientY,
        originX: 0,
        originY: 0,
      };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;

    if (pointers.current.size >= 2 && g.startDist) {
      const [a, b] = [...pointers.current.values()] as [
        { x: number; y: number },
        { x: number; y: number },
      ];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const k = Math.min(4, Math.max(1, (dist / g.startDist) * g.startScale)) / g.startScale;
      setTransform({
        scale: g.startScale * k,
        x: g.originX - (g.originX - g.startX) * k,
        y: g.originY - (g.originY - g.startY) * k,
      });
      return;
    }

    const dx = e.clientX - g.midX;
    const dy = e.clientY - g.midY;
    if (zoomed) {
      setTransform({ scale: g.startScale, x: g.startX + dx, y: g.startY + dy });
    } else if (Math.abs(dx) > Math.abs(dy)) {
      setDrag(dx);
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      gesture.current = null;
      setAnimating(true);
      if (!zoomed) {
        if (drag < -60) go(1);
        else if (drag > 60) go(-1);
        setDrag(0);
      }
    }
  };

  const onPointerUpTap = (e: React.PointerEvent) => {
    const now = Date.now();
    const moved = Math.abs(drag) > 8;
    endPointer(e);
    if (moved || pointers.current.size > 0) return;
    if (now - lastTap.current < 300) {
      lastTap.current = 0;
      zoomAt(e.clientX, e.clientY);
    } else {
      lastTap.current = now;
    }
  };

  if (!page) return null;
  const fav = isFavorite(page.id);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95 animate-in fade-in duration-200">
      <div className="flex items-center justify-between px-3 py-3 text-white">
        <button type="button" onClick={onClose} aria-label="Tutup layar penuh" className="rounded-full bg-white/10 p-2.5">
          <X className="h-5 w-5" />
        </button>
        <span className="text-xs font-semibold tracking-wide text-white/80">
          {index + 1} / {pages.length}
        </span>
        <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void shareMenuImage(page)}
          aria-label="Bagikan via WhatsApp"
          className="rounded-full bg-[#25D366] p-2.5 text-white transition-transform active:scale-90 animate-wa-bounce motion-reduce:animate-none"
        >
          <WhatsAppIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => onToggleFavorite(page.id)}
          aria-pressed={fav}
          aria-label={fav ? "Hapus favorit" : "Tandai favorit"}
          className="rounded-full bg-white/10 p-2.5 transition-transform active:scale-90"
        >
          <Heart className={`h-5 w-5 transition-transform duration-200 ${fav ? "fill-[#e03131] text-[#e03131] scale-110" : "text-white"}`} />
        </button>
        </div>
      </div>


      <div
        ref={surfaceRef}
        className="relative flex-1 select-none overflow-hidden"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUpTap}
        onPointerCancel={endPointer}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            transform: `translate3d(${transform.x + drag}px, ${transform.y}px, 0) scale(${transform.scale})`,
            transformOrigin: "0 0",
            transition: animating ? "transform .28s cubic-bezier(.22,.61,.36,1)" : "none",
            willChange: "transform",
          }}
        >
          <img
            key={page.id}
            src={page.url}
            alt={`${page.title} — ${page.subtitle}`}
            width={IMAGE_WIDTH}
            height={IMAGE_HEIGHT}
            draggable={false}
            className="max-h-full max-w-full object-contain animate-in fade-in zoom-in-95 duration-300"
          />
        </div>

        {index > 0 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Gambar sebelumnya"
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white sm:block"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {index < pages.length - 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Gambar berikutnya"
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white sm:block"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      <p className="px-4 pb-5 pt-2 text-center text-[11px] text-white/60">
        Ketuk dua kali untuk memperbesar · geser untuk pindah halaman
      </p>
    </div>
  );
}
