import { useCallback, useEffect, useRef, useState } from 'react';
import { createStockCountDraft } from '../../utils/stockCountDraft';

export default function useStockCountDraft({ countId, userId, data, enabled, save }) {
  const controller = useRef(null);
  const latest = useRef({ data, enabled, save });
  const [state, setState] = useState({
    edits: {},
    pendingCount: 0,
    status: 'Loading draft…',
    saving: false,
    ready: false,
  });
  useEffect(() => {
    latest.current = { data, enabled, save };
  }, [data, enabled, save]);
  const loaded = Boolean(data?.data && (enabled || data.data.status !== 'DRAFT'));
  useEffect(() => {
    if (!userId || !loaded) return;
    let cancelled = false;
    const draft = createStockCountDraft({
      key: `stock-count-draft:${userId}:${countId}`,
      storage: {
        getItem: (key) => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
        removeItem: (key) => localStorage.removeItem(key),
      },
      save: (lines) => latest.current.save({ id: countId, lines }).unwrap(),
      onChange: (next) => {
        if (!cancelled) setState(next);
      },
    });
    controller.current = draft;
    // Restore after effects have installed the latest response and permissions.
    void Promise.resolve().then(() => {
      if (cancelled) return;
      if (latest.current.enabled) draft.restore(latest.current.data?.lines || []);
      else
        draft.receive(
          latest.current.data?.lines || [],
          false,
          latest.current.data?.data?.status !== 'DRAFT',
        );
    });
    const reconnect = () => {
      void draft.flush();
    };
    window.addEventListener('online', reconnect);
    return () => {
      cancelled = true;
      draft.dispose();
      if (controller.current === draft) controller.current = null;
      window.removeEventListener('online', reconnect);
    };
  }, [countId, userId, loaded]);
  useEffect(() => {
    void Promise.resolve().then(() =>
      controller.current?.receive(data?.lines || [], enabled, data?.data?.status !== 'DRAFT'),
    );
  }, [data, enabled, state.pendingCount]);
  const edit = useCallback((productId, value) => controller.current?.edit(productId, value), []);
  const flush = useCallback(() => controller.current?.flush() ?? Promise.resolve(false), []);
  return { ...state, edit, flush };
}
