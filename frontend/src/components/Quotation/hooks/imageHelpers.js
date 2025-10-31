import { Buffer } from "buffer";

export const placeholder = {
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64"
  ),
  extension: "png",
};

export const fetchImg = async (url) => {
  if (!url) return placeholder;
  if (url.startsWith("data:")) {
    const [, ext, b64] = url.match(/^data:image\/(\w+);base64,(.+)$/);
    return { buffer: Buffer.from(b64, "base64"), extension: ext };
  }
  const res = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!res.ok) return placeholder;
  const ct = res.headers.get("content-type");
  const ext = ct.split("/")[1].replace("jpeg", "jpg");
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, extension: ext };
};
