// public/js/segmentation.js
// Background removal → transparent cutout (compact WebP) + downscale helper.

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

function drawToCanvas(img, maxW = 384) {
  const w0 = img.naturalWidth || img.width, h0 = img.naturalHeight || img.height;
  const scale = Math.min(1, maxW / Math.max(1, w0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  return c;
}
function canvasToAlphaDataURL(c, type = "image/webp", q = 0.85) {
  try {
    const webp = c.toDataURL(type, q);
    if (webp.startsWith("data:image/webp")) return webp;
  } catch {}
  return c.toDataURL("image/png");
}

export async function createCutoutFromImage(img, maxW = 384) {
  try {
    await ensureMediaPipe();
    const srcCanvas = drawToCanvas(img, maxW);

    const segmenter = new window.SelfieSegmentation({
      locateFile: (f) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`,
    });
    segmenter.setOptions({ modelSelection: 1 });

    const segmentationMask = await new Promise((resolve) => {
      segmenter.onResults((res) => resolve(res.segmentationMask));
      segmenter.send({ image: srcCanvas });
    });

    const out = document.createElement("canvas");
    out.width = srcCanvas.width; out.height = srcCanvas.height;
    const ctx = out.getContext("2d");
    ctx.save();
    ctx.drawImage(segmentationMask, 0, 0, out.width, out.height);
    ctx.globalCompositeOperation = "source-in";
    ctx.drawImage(srcCanvas, 0, 0, out.width, out.height);
    ctx.restore();

    return canvasToAlphaDataURL(out, "image/webp", 0.85);
  } catch (e) {
    console.warn("[segmentation] failed, using fallback:", e);
    return null;
  }
}

export function downscaleImageToDataURL(img, maxW = 384) {
  const c = drawToCanvas(img, maxW);
  return canvasToAlphaDataURL(c, "image/webp", 0.85);
}
