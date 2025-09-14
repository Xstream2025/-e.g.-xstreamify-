// public/js/segmentation.js
// Load MediaPipe Selfie Segmentation and export a helper that returns
// a transparent cutout as a compact WebP data URL.

const MP_SRC =
  "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";

let _mpLoaded = null;
function loadScriptOnce(src) {
  if (_mpLoaded) return _mpLoaded;
  _mpLoaded = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load MediaPipe"));
    document.head.appendChild(s);
  });
  return _mpLoaded;
}
async function ensureMediaPipe() {
  if (!window.SelfieSegmentation) await loadScriptOnce(MP_SRC);
}

// Utility: draw <img> to canvas with max width and return the canvas
function drawToCanvas(img, maxW = 384) {
  const scale = Math.min(1, maxW / (img.naturalWidth || img.width || maxW));
  const w = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  return c;
}

// Convert canvas to WebP (alpha) and fall back to PNG if needed
function canvasToAlphaDataURL(c, target = "image/webp", quality = 0.85) {
  try {
    const webp = c.toDataURL(target, quality);
    if (webp && webp.startsWith("data:image/webp")) return webp;
  } catch {}
  return c.toDataURL("image/png");
}

/**
 * Returns a transparent cutout (data URL) from an <img>.
 * - Downscales large images first for speed/size.
 * - Produces WebP with alpha when supported.
 */
export async function createCutoutFromImage(img, maxW = 384) {
  try {
    await ensureMediaPipe();

    // Downscale first
    const srcCanvas = drawToCanvas(img, maxW);

    // Init MediaPipe
    const segmenter = new window.SelfieSegmentation({
      locateFile: (f) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`,
    });
    segmenter.setOptions({ modelSelection: 1 });

    const segmentationMask = await new Promise((resolve, reject) => {
      segmenter.onResults((res) => resolve(res.segmentationMask));
      segmenter.send({ image: srcCanvas });
    });

    // Compose cutout with transparency
    const out = document.createElement("canvas");
    out.width = srcCanvas.width;
    out.height = srcCanvas.height;
    const ctx = out.getContext("2d");
    ctx.save();
    ctx.drawImage(segmentationMask, 0, 0, out.width, out.height);
    ctx.globalCompositeOperation = "source-in";
    ctx.drawImage(srcCanvas, 0, 0, out.width, out.height);
    ctx.restore();

    return canvasToAlphaDataURL(out, "image/webp", 0.85);
  } catch (e) {
    console.warn("[segmentation] failed:", e);
    return null;
  }
}

// Also export a helper to downscale the original as a compact fallback
export function downscaleImageToDataURL(img, maxW = 384) {
  const c = drawToCanvas(img, maxW);
  return canvasToAlphaDataURL(c, "image/webp", 0.85);
}
