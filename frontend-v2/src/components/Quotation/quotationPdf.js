import { API_URL } from "../../store/config";

export const token = () => localStorage.getItem("token") || sessionStorage.getItem("token");

// cover: true / false, or null to follow the "cover page" setting
export async function fetchPdf(id, { style = "detailed", cover = null, version = null } = {}) {
  const p = new URLSearchParams({ style });
  if (cover != null) p.set("cover", cover ? "1" : "0");
  if (version) p.set("version", version);
  const r = await fetch(`${API_URL}/quotation/${id}/pdf?${p}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!r.ok) {
    let msg = "Could not make the PDF";
    try {
      msg = (await r.json()).message || msg;
    } catch {
      /* not JSON */
    }
    throw new Error(msg);
  }
  const name =
    /filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") || "")?.[1] || "Quotation.pdf";
  return { blob: await r.blob(), name };
}

/** Downloads the server-made PDF of a quotation. */
export async function downloadQuotationPdf(id, opts) {
  const { blob, name } = await fetchPdf(id, opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}


/** PDF of a quotation that is not saved yet (cart preview), in the same format. */
export async function fetchDraftPdf(draft, { style = "detailed", cover = null } = {}) {
  const r = await fetch(`${API_URL}/quotation/preview-pdf`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ draft, style, cover }),
  });
  if (!r.ok) {
    let msg = "Could not make the preview";
    try {
      msg = (await r.json()).message || msg;
    } catch {
      /* not JSON */
    }
    throw new Error(msg);
  }
  return r.blob();
}
