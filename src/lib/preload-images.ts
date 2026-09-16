const done = new Set<string>();
let chainRunning = false;

function idle(cb: () => void, timeout = 1200) {
  if (typeof window === "undefined") return;
  const ric = (window as unknown as { requestIdleCallback?: (c: () => void, o?: { timeout: number }) => number })
    .requestIdleCallback;
  if (ric) ric(cb, { timeout });
  else window.setTimeout(cb, 200);
}

/** Muat satu gambar ke cache browser (prioritas rendah). */
export function preloadImage(url: string): Promise<void> {
  if (typeof window === "undefined" || done.has(url)) return Promise.resolve();
  done.add(url);
  return new Promise((resolve) => {
    const img = new Image();
    (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "low";
    img.decoding = "async";
    img.onload = img.onerror = () => resolve();
    img.src = url;
  });
}

/** Muat beberapa gambar segera (untuk tetangga langsung, mis. saat layar penuh). */
export function preloadNow(urls: string[]) {
  urls.forEach((u) => void preloadImage(u));
}

/**
 * Preload bertahap: satu per satu, berurutan, hanya saat browser idle
 * sehingga tidak mengganggu render maupun gambar yang sedang terlihat.
 */
export function preloadSequential(urls: string[]) {
  if (typeof window === "undefined" || chainRunning) return;
  const queue = urls.filter((u) => !done.has(u));
  if (!queue.length) return;
  chainRunning = true;
  const next = () => {
    const url = queue.shift();
    if (!url) {
      chainRunning = false;
      return;
    }
    void preloadImage(url).then(() => idle(next));
  };
  idle(next);
}
