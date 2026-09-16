import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "inyong-fav-v1";
export const FAVORITE_TTL_MS = 60 * 60 * 1000;

type FavoriteMap = Record<string, number>;

function prune(map: FavoriteMap, now = Date.now()): FavoriteMap {
  const next: FavoriteMap = {};
  for (const [id, ts] of Object.entries(map)) {
    if (typeof ts === "number" && now - ts < FAVORITE_TTL_MS) next[id] = ts;
  }
  return next;
}

function read(): FavoriteMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as FavoriteMap;
    if (!parsed || typeof parsed !== "object") return {};
    return prune(parsed);
  } catch {
    return {};
  }
}

function sameKeys(a: FavoriteMap, b: FavoriteMap) {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => k in b);
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteMap>({});
  const hydrated = useRef(false);

  useEffect(() => {
    const stored = read();
    hydrated.current = true;
    if (Object.keys(stored).length) setFavorites(stored);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      /* penyimpanan penuh atau ditolak */
    }
  }, [favorites]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFavorites((prev) => {
        const next = prune(prev);
        return sameKeys(prev, next) ? prev : next;
      });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prune(prev);
      if (next[id]) delete next[id];
      else next[id] = Date.now();
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => Boolean(favorites[id]), [favorites]);

  return {
    favorites,
    favoriteIds: Object.keys(favorites),
    count: Object.keys(favorites).length,
    isFavorite,
    toggleFavorite,
  };
}
