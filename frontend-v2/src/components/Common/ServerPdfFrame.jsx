import { useEffect, useState } from "react";
import { Alert, Spin } from "antd";
import { API_URL } from "../../store/config";
import { token } from "../Quotation/quotationPdf";

/** Shows a server-made PDF (path under /api) on the page; reloads when refreshKey changes. */
export default function ServerPdfFrame({ path, refreshKey, loadPdf, onPdfLoad, height = "calc(100vh - 260px)" }) {
  const [state, setState] = useState({ loading: true, url: null, error: null });
  useEffect(() => {
    let url = null;
    let cancelled = false;
    (async () => {
      await null;
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        let blob;
        if (loadPdf) {
          const result = await loadPdf();
          if (cancelled) return;
          blob = result.blob;
          onPdfLoad?.(result);
        } else {
        const r = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token()}` } });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || "Could not make the PDF");
        blob = await r.blob();
        }
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setState({ loading: false, url, error: null });
      } catch (e) {
        if (!cancelled) setState({ loading: false, url: null, error: e.message });
      }
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [path, refreshKey, loadPdf, onPdfLoad]);
  if (state.error) return <Alert type="error" showIcon message={state.error} />;
  return (
    <div style={{ position: "relative", height, minHeight: 520, background: "#525659", borderRadius: 10, overflow: "hidden" }}>
      {state.url && <iframe title="Document" src={`${state.url}#view=FitH`} style={{ width: "100%", height: "100%", border: 0 }} />}
      {state.loading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.6)" }}>
          <Spin />
        </div>
      )}
    </div>
  );
}
