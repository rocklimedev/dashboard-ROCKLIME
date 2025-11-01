// ---------------------------------------------------------------
// imageHelpers.js – returns { buffer: Uint8Array, extension }
// ---------------------------------------------------------------
const placeholderBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export const placeholder = {
  buffer: Uint8Array.from(atob(placeholderBase64), (c) => c.charCodeAt(0)),
  extension: "png",
};

/**
 * Works with:
 *   • data:image/... URLs
 *   • remote URLs (CORS must be allowed)
 *   • broken URLs → placeholder
 */
export const fetchImg = async (src) => {
  if (!src) return placeholder;

  // ---- data URL ------------------------------------------------
  if (src.startsWith("data:")) {
    const m = src.match(/^data:image\/(\w+);base64,(.*)$/);
    if (m) {
      const [, ext, b64] = m;
      const buffer = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      return { buffer, extension: ext };
    }
    return placeholder;
  }

  // ---- remote URL ---------------------------------------------
  try {
    const res = await fetch(src, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const buffer = new Uint8Array(await blob.arrayBuffer());
    const extension = blob.type.split("/").pop() || "png";
    return { buffer, extension };
  } catch (e) {
    console.warn("fetchImg failed → placeholder", src, e);
    return placeholder;
  }
};
