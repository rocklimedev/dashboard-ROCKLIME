import { API_URL } from "../../store/config";

const token = () => localStorage.getItem("token") || sessionStorage.getItem("token");

/** Fetches a file from the API with the login and saves or opens it. */
export async function fetchFile(path, { open = false, fallbackName = "file" } = {}) {
  const win = open ? window.open("", "_blank") : null;
  try {
    const r = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token()}` } });
    if (!r.ok) {
      let msg = "Download failed";
      try {
        msg = (await r.json()).message || msg;
      } catch {
        /* not JSON */
      }
      throw new Error(msg);
    }
    const name = /filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") || "")?.[1] || fallbackName;
    const url = URL.createObjectURL(await r.blob());
    if (win) {
      win.location.href = url;
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) {
    if (win) win.close();
    throw e;
  }
}
