import { useEffect, useState } from "react";
import { Alert, Spin } from "antd";
import { fetchPdf } from "./quotationPdf";

/**
 * The quotation as the customer receives it: the server-made PDF shown on the
 * page. It reloads when the quotation, the version or the options change.
 */
export default function QuotationPdfFrame({ resourcePath = null, documentLabel = "Quotation", quotationId, version = null, style = "detailed", cover = true, exportOptions, pageOrder, onPagesChange, refreshKey, height = "calc(100vh - 230px)" }) {
  const [state, setState] = useState({ loading: true, url: null, error: null });

  useEffect(() => {
    let url = null;
    let cancelled = false;
    (async () => {
      await null; // state changes happen after the effect, not inside it
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const { blob, pages } = await fetchPdf(quotationId, { style, cover, version, exportOptions, pageOrder, resourcePath, documentLabel });
        if (!cancelled) onPagesChange?.(pages);
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
  }, [quotationId, version, style, cover, exportOptions, pageOrder, onPagesChange, refreshKey, resourcePath, documentLabel]);

  if (state.error) return <Alert type="error" showIcon message={`Could not show the ${documentLabel.toLowerCase()}`} description={state.error} />;
  return (
    <div style={{ position: "relative", height, minHeight: 520, background: "#525659", borderRadius: 10, overflow: "hidden" }}>
      {state.url && <iframe title={documentLabel} src={`${state.url}#view=FitH`} style={{ width: "100%", height: "100%", border: 0 }} />}
      {state.loading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.6)" }}>
          <Spin tip={`Making the ${documentLabel.toLowerCase()}…`} />
        </div>
      )}
    </div>
  );
}
