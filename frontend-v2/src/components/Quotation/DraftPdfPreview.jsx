import { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Modal, Segmented, Space, Spin } from 'antd';
import { fetchDraftPdf } from './quotationPdf';

/**
 * Preview of the quotation being built in the cart, made by the server in the
 * same format the customer will receive. Nothing is saved.
 */
export default function DraftPdfPreview({ open, onClose, getDraft }) {
  const [style, setStyle] = useState('detailed');
  const [cover, setCover] = useState(true);
  const [state, setState] = useState({ loading: false, url: null, error: null });

  useEffect(() => {
    if (!open) return undefined;
    let url = null;
    let cancelled = false;
    (async () => {
      await null; // state changes happen after the effect, not inside it
      const { payload, error } = getDraft() || {};
      if (error) return setState({ loading: false, url: null, error });
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const blob = await fetchDraftPdf(payload, { style, cover });
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
    // getDraft reads the current cart; re-run only when the dialog opens or the options change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, style, cover]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Quotation preview"
      width="min(1000px, 96vw)"
      zIndex={2000}
      footer={
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <Space>
            <Segmented
              value={style}
              onChange={setStyle}
              options={[
                { value: 'detailed', label: 'With photos' },
                { value: 'compact', label: 'Compact' },
              ]}
            />
            <Checkbox checked={cover} onChange={(e) => setCover(e.target.checked)}>
              Cover page
            </Checkbox>
          </Space>
          <Button onClick={onClose}>Close</Button>
        </Space>
      }
    >
      {state.error ? (
        <Alert type="warning" showIcon message={state.error} />
      ) : state.loading || !state.url ? (
        <div
          style={{
            height: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spin tip="Making the preview…" />
        </div>
      ) : (
        <iframe
          title="Quotation preview"
          src={state.url}
          style={{ width: '100%', height: '75vh', border: 0 }}
        />
      )}
    </Modal>
  );
}
