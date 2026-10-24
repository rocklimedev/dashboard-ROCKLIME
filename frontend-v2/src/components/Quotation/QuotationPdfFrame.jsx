import Loader from '../Common/Loader';
import './QuotationPdfFrame.styles.css';
import { useEffect, useState } from 'react';
import { Alert } from 'antd';
import { fetchPdf } from './quotationPdf';

/**
 * The quotation as the customer receives it: the server-made PDF shown on the
 * page. It reloads when the quotation, the version or the options change.
 */
export default function QuotationPdfFrame({
  resourcePath = null,
  documentLabel = 'Quotation',
  quotationId,
  version = null,
  style = 'detailed',
  cover = true,
  exportOptions,
  pageOrder,
  onPagesChange,
  refreshKey,
  height = 'calc(100vh - 230px)',
}) {
  const [state, setState] = useState({ loading: true, url: null, error: null });

  useEffect(() => {
    let url = null;
    let cancelled = false;
    (async () => {
      await null; // state changes happen after the effect, not inside it
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const { blob, pages } = await fetchPdf(quotationId, {
          style,
          cover,
          version,
          exportOptions,
          pageOrder,
          resourcePath,
          documentLabel,
        });
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
  }, [
    quotationId,
    version,
    style,
    cover,
    exportOptions,
    pageOrder,
    onPagesChange,
    refreshKey,
    resourcePath,
    documentLabel,
  ]);

  if (state.error)
    return (
      <Alert
        type="error"
        showIcon
        message={`Could not show the ${documentLabel.toLowerCase()}`}
        description={state.error}
      />
    );
  return (
    <div className="fv2-quotationpdfframe-5ab9cb4472" style={{ height }}>
      {state.url && (
        <iframe
          className="fv2-quotationpdfframe-1f0875abd5"
          title={documentLabel}
          src={`${state.url}#view=FitH`}
        />
      )}
      {state.loading && (
        <div className="fv2-quotationpdfframe-c75dd52973">
          <Loader tip={`Making the ${documentLabel.toLowerCase()}…`} />
        </div>
      )}
    </div>
  );
}
