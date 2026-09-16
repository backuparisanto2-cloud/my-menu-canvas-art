export type EncodedImage = {
  blob: Blob;
  width: number;
  height: number;
};

const MIN_BYTES = 20 * 1024;
const MAX_BYTES = 30 * 1024;

function toCanvas(bitmap: ImageBitmap, width: number) {
  const scale = width / bitmap.width;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function encode(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Gagal membuat gambar WebP"))),
      "image/webp",
      quality,
    );
  });
}

/**
 * Ubah berkas gambar apa pun menjadi WebP berukuran 20–30 KB.
 * Kualitas dicari lewat binary search; bila masih terlalu besar, lebar diturunkan.
 */
export async function encodeMenuImage(file: File): Promise<EncodedImage> {
  const bitmap = await createImageBitmap(file);
  let width = Math.min(bitmap.width, 1131);
  let best: Blob | null = null;
  let bestCanvas: HTMLCanvasElement | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const canvas = toCanvas(bitmap, width);
    let low = 0.2;
    let high = 0.95;
    let candidate: Blob | null = null;

    for (let i = 0; i < 8; i += 1) {
      const q = (low + high) / 2;
      const blob = await encode(canvas, q);
      if (blob.size > MAX_BYTES) {
        high = q;
      } else {
        candidate = blob;
        if (blob.size >= MIN_BYTES) break;
        low = q;
      }
    }

    if (candidate) {
      best = candidate;
      bestCanvas = canvas;
      if (candidate.size >= MIN_BYTES) break;
      // Sudah di bawah target: berhenti, kualitas maksimum sudah tercapai.
      break;
    }

    // Semua kualitas masih di atas 30 KB → kecilkan lebar.
    width = Math.round(width * 0.8);
    if (width < 320) {
      best = await encode(canvas, 0.2);
      bestCanvas = canvas;
      break;
    }
  }

  bitmap.close?.();
  if (!best || !bestCanvas) throw new Error("Gagal mengompres gambar");
  return { blob: best, width: bestCanvas.width, height: bestCanvas.height };
}
