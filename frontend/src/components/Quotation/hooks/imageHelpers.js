// imageHelpers.js
const placeholderBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export const placeholder = {
  buffer: Uint8Array.from(atob(placeholderBase64), (c) => c.charCodeAt(0)),
  extension: "png",
};

export const fetchImg = async (src) => {
  if (!src || typeof src !== "string") {
    return placeholder;
  }

  // 1. Data URL handling
  if (src.startsWith("data:image/")) {
    const match = src.match(/^data:image\/([a-zA-Z0-9]+);base64,(.*)$/);
    if (match) {
      const [, extRaw, base64] = match;
      let extension = extRaw.toLowerCase();
      // Normalize common variations
      if (extension === "jpg") extension = "jpeg";
      try {
        const binary = atob(base64);
        const buffer = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          buffer[i] = binary.charCodeAt(i);
        }
        return { buffer, extension };
      } catch (err) {}
    }
    return placeholder;
  }

  // 2. Remote URL
  try {
    const response = await fetch(src, {
      method: "GET",
      mode: "cors",
      cache: "default", // helps with repeated fetches
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    let extension = "png";

    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      extension = "jpeg";
    } else if (contentType.includes("png")) {
      extension = "png";
    } else if (contentType.includes("webp")) {
      extension = "webp"; // Excel 2016+ supports webp
    } else if (contentType.includes("gif")) {
      extension = "gif";
    }

    // Fallback from URL extension if MIME is generic
    if (extension === "png") {
      const urlExt = src.split(".").pop()?.toLowerCase();
      if (["jpg", "jpeg", "png", "webp", "gif"].includes(urlExt)) {
        extension = urlExt === "jpg" ? "jpeg" : urlExt;
      }
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    if (buffer.length < 100) {
      throw new Error("Image too small / empty");
    }

    return { buffer, extension };
  } catch (err) {
    return placeholder;
  }
};
