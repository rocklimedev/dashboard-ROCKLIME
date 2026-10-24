import Loader from './Loader';
import './ServerPdfFrame.styles.css';
import { useEffect, useState } from 'react';
import { Alert } from 'antd';
import { API_URL } from '../../store/config';
import { token } from '../Quotation/quotationPdf';

/** Shows a server-made PDF (path under /api) on the page; reloads when refreshKey changes. */
export default function ServerPdfFrame({
  path,
  refreshKey,
  loadPdf,
  onPdfLoad,
  height = 'calc(100vh - 260px)',
}) {
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
          const r = await fetch(`${API_URL}${path}`, {
            headers: { Authorization: `Bearer ${token()}` },
          });
          if (!r.ok)
            throw new Error((await r.json().catch(() => ({}))).message || 'Could not make the PDF');
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
    <div className="fv2-serverpdfframe-dbd877a046" style={{ height }}>
      {state.url && (
        <iframe
          className="fv2-serverpdfframe-8b9b8660fa"
          title="Document"
          src={`${state.url}#view=FitH`}
        />
      )}
      {state.loading && (
        <div className="fv2-serverpdfframe-9e3e3f0d15">
          <Loader />
        </div>
      )}
    </div>
  );
}
