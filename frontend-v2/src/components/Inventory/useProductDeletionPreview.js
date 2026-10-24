import { useEffect, useState } from 'react';
import { usePreviewProductDeletionMutation } from '../../api/inventoryBulkApi';

export default function useProductDeletionPreview(products, enabled) {
  const [loadPreview] = usePreviewProductDeletionMutation();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const ids = JSON.stringify(products.map((product) => product.productId).sort());
  const [previousEnabled, setPreviousEnabled] = useState(enabled);
  // A previous opening must not authorize a new deletion.
  if (previousEnabled !== enabled) {
    setPreviousEnabled(enabled);
    setResult(null);
  }
  const current = result?.ids === ids && result?.attempt === attempt ? result : null;

  useEffect(() => {
    if (!enabled || !JSON.parse(ids).length) return;
    let active = true;
    const request = loadPreview(JSON.parse(ids));
    request.unwrap().then(
      (report) => {
        if (active) setResult({ ids, attempt, report });
      },
      (error) => {
        if (active)
          setResult({
            ids,
            attempt,
            failure: error?.data?.message || 'Reference checks failed. Retry before deleting.',
          });
      },
    );
    return () => {
      active = false;
      request.abort();
    };
  }, [ids, attempt, enabled, loadPreview]);

  return {
    report: current?.report,
    failure: current?.failure,
    retry: () => setAttempt((value) => value + 1),
  };
}
