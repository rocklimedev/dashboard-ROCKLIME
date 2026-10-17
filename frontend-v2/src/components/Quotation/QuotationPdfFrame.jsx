import { useEffect, useState } from "react";
import { Alert, Spin } from "antd";
import { fetchPdf } from "./quotationPdf";

/**
 * The quotation as the customer receives it: the server-made PDF shown on the
 * page. It reloads when the quotation, the version or the options change.
 */
export default function QuotationPdfFrame({ quotationId, version = null, style = "detailed", cover = true, refreshKey, height = "calc(100vh - 230px)" }) {
  const [state, setState] = useState({ loading: true, url: null, error: null });

  useEffect(() => {
    let url = null;
    let cancelled = false;
    (async () => {
      await null; // state changes happen after the effect, not inside it
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const { blob } = await fetchPdf(quotationId, { style, cover, version });
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
  }, [quotationId, version, style, cover, refreshKey]);

  if (state.error) return <Alert type="error" showIcon message="Could not show the quotation" description={state.error} />;
  return (
    <div style={{ position: "relative", height, minHeight: 520, background: "#525659", borderRadius: 10, overflow: "hidden" }}>
      {state.url && <iframe title="Quotation" src={`${state.url}#view=FitH`} style={{ width: "100%", height: "100%", border: 0 }} />}
      {state.loading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.6)" }}>
          <Spin tip="Making the quotation…" />
        </div>
      )}
    </div>
  );
}
