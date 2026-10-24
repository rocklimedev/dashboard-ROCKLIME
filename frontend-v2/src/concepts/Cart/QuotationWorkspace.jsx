import Loader from '../../components/Common/Loader';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reconcileQuotationItems } from '../../components/Quotation/quotationCartHelpers';
import {
  createSessionStorage,
  hasSessionContent,
  newSession,
  readSessions,
  removeClaimedFromSessions,
  sessionKey,
  storeSession,
} from '../../components/Quotation/draftSessions';
import { useGetProfileQuery } from '../../api/userApi';
import { useLazyGetQuotationByIdQuery } from '../../api/quotationApi';
import { quotationCartSnapshot } from '../../components/Quotation/recreateQuotation';
import {
  cartApi,
  useGetQuotationWorkspaceQuery,
  useUpdateQuotationWorkspaceMutation,
} from '../../api/cartApi';

const pendingByUser = new Map();
export default function CartWorkspace({ children, documentType = 'quotation' }) {
  const { data: profile } = useGetProfileQuery();
  const userId = profile?.user?.userId;
  const { data, error, refetch } = useGetQuotationWorkspaceQuery(documentType, {
    skip: !userId,
    refetchOnMountOrArgChange: true,
  });
  const [update] = useUpdateQuotationWorkspaceMutation();
  const [getQuotation] = useLazyGetQuotationByIdQuery();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const dealId = documentType === 'quotation' ? params.get('deal') : null;
  const presetCustomer = params.get('customer');
  const recreateId = documentType === 'quotation' ? params.get('recreate') : null;
  // Temporary edits stay in memory; persisted drafts come from the API.
  const [editorSessions] = useState(createSessionStorage);
  const [workspace, setWorkspace] = useState(null);
  const [busy, setBusy] = useState(false);
  const [initialisationError, setInitialisationError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const initialising = useRef(false),
    state = useRef(null),
    server = useRef(null);
  useEffect(() => {
    if (!data || state.current || initialising.current) return;
    initialising.current = true;
    const initialise = async () => {
      await pendingByUser.get(userId)?.catch(() => {});
      const fresh = await refetch().unwrap();
      server.current = fresh.workspace;
      const bundle = readSessions(editorSessions, userId);
      let active = bundle.sessions?.[documentType] || newSession(documentType);
      let cart = fresh.cart;
      if (!bundle.activeType || bundle.activeType === documentType) {
        active.snapshot.layout = {
          ...active.snapshot.layout,
          localCartItems: reconcileQuotationItems(
            cart.items || [],
            active.snapshot.layout?.localCartItems || [],
          ),
        };
      }
      const newDeal = dealId && active.snapshot.parent?.dealId !== dealId;
      if (newDeal)
        active = newSession(documentType, {
          parent: { selectedCustomer: presetCustomer || '', dealId },
          layout: { localCartItems: [] },
        });
      if (recreateId) {
        const quotation = await getQuotation(recreateId, false).unwrap();
        active = newSession('quotation', quotationCartSnapshot(quotation));
      }
      if ((bundle.activeType && bundle.activeType !== documentType) || newDeal || recreateId) {
        const result = await update({
          sessionMode: true,
          action: 'session',
          documentType,
          activeId: server.current.activeId,
          revision: server.current.revision,
          items: active.snapshot.layout?.localCartItems || [],
        }).unwrap();
        server.current = result.workspace;
        cart = result.cart;
      }
      bundle.activeType = documentType;
      if (recreateId) bundle.sessions = { ...bundle.sessions, quotation: active };
      editorSessions.setItem(sessionKey(userId), JSON.stringify(bundle));
      await dispatch(cartApi.util.upsertQueryData('getCart', userId, { cart }));
      const initial = {
        ...server.current,
        drafts:
          server.current.version === 2
            ? server.current.drafts
            : server.current.drafts.filter((d) => hasSessionContent(d.snapshot)),
        activeId: active.id,
        active,
      };
      state.current = initial;
      setWorkspace(initial);
      if (recreateId) navigate('/cart/quotation', { replace: true });
    };
    const task = initialise()
      .catch((error) =>
        setInitialisationError(
          error?.data?.message || error?.message || 'Could not load the quotation cart',
        ),
      )
      .finally(() => {
        initialising.current = false;
      });
    pendingByUser.set(userId, task);
  }, [
    data,
    refetch,
    dispatch,
    userId,
    dealId,
    presetCustomer,
    update,
    attempt,
    documentType,
    recreateId,
    getQuotation,
    navigate,
    editorSessions,
  ]);
  const onAction = useCallback(
    (action, snapshot, sourceId, extra = {}) => {
      if (action === 'session') {
        try {
          const current = state.current;
          if (snapshot && current?.activeId === sourceId)
            current.active = storeSession(editorSessions, userId, current.active, snapshot);
          return Promise.resolve();
        } catch (error) {
          return Promise.reject(error);
        }
      }
      if (action !== 'session') setBusy(true);
      const task = (pendingByUser.get(userId) || Promise.resolve())
        .catch(() => {})
        .then(async () => {
          const current = state.current;
          if (!current || current.activeId !== sourceId) return;
          let active = current.active;
          if (snapshot) active = storeSession(editorSessions, userId, active, snapshot);
          current.active = active;
          if (
            (action === 'save' || action === 'new') &&
            !hasSessionContent(active.snapshot) &&
            !active.hasChanges
          )
            throw new Error('Add products or enter a field before saving a draft');
          let nextActive = active;
          if (action === 'switch') {
            const saved = current.drafts.find((d) => d.id === extra.targetId);
            if (!saved) throw new Error('Saved draft not found');
            nextActive = {
              ...newSession(saved.documentType || 'quotation', structuredClone(saved.snapshot)),
              savedDraftId: saved.id,
            };
          } else if (action === 'document') {
            nextActive =
              readSessions(editorSessions, userId).sessions?.[extra.documentType] ||
              newSession(extra.documentType);
          } else if (action === 'new' || action === 'complete')
            nextActive = newSession(active.documentType);
          const changing = nextActive.id !== active.id;
          const result = await update({
            ...extra,
            sessionMode: true,
            action: ['switch', 'document'].includes(action) ? 'session' : action,
            snapshot: ['save', 'new'].includes(action) ? active.snapshot : undefined,
            hasChanges: active.hasChanges,
            savedDraftId: active.savedDraftId,
            documentType: active.documentType,
            activeId: server.current.activeId,
            revision: server.current.revision,
            ...(changing ? { items: nextActive.snapshot.layout?.localCartItems || [] } : {}),
          }).unwrap();
          server.current = result.workspace;
          if (action === 'save')
            nextActive = { ...current.active, savedDraftId: result.savedDraftId };
          if (action === 'delete' && extra.targetId === nextActive.savedDraftId)
            nextActive = { ...nextActive, savedDraftId: null };
          if (action === 'complete') {
            const bundle = removeClaimedFromSessions(
              readSessions(editorSessions, userId),
              extra.claimedProductIds || [],
            );
            delete bundle.sessions[active.documentType];
            editorSessions.setItem(sessionKey(userId), JSON.stringify(bundle));
          }
          // A fresh session gets its baseline from the editor's initialized form defaults.
          if (changing) {
            const bundle = readSessions(editorSessions, userId);
            bundle.sessions ||= {};
            delete bundle.sessions[nextActive.documentType];
            if (hasSessionContent(nextActive.snapshot) || nextActive.savedDraftId)
              bundle.sessions[nextActive.documentType] = nextActive;
            bundle.activeType = nextActive.documentType;
            editorSessions.setItem(sessionKey(userId), JSON.stringify(bundle));
          } else nextActive = storeSession(editorSessions, userId, nextActive, nextActive.snapshot);
          const next = { ...result.workspace, activeId: nextActive.id, active: nextActive };
          state.current = next;
          if (changing) {
            await dispatch(cartApi.util.upsertQueryData('getCart', userId, { cart: result.cart }));
            navigate(`/cart/${nextActive.documentType}`, { replace: true });
          }
          setWorkspace(next);
        })
        .finally(() => {
          if (action !== 'session') setBusy(false);
        });
      pendingByUser.set(userId, task);
      return task;
    },
    [dispatch, update, userId, navigate, editorSessions],
  );
  if (error || initialisationError)
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert
            type="error"
            showIcon
            message="Could not open quotation cart"
            description={error?.data?.message || initialisationError}
            action={
              <Button
                onClick={() => {
                  setInitialisationError(false);
                  setAttempt((value) => value + 1);
                  refetch();
                }}
              >
                Retry
              </Button>
            }
          />
        </div>
      </div>
    );
  if (!workspace)
    return (
      <div className="page-wrapper">
        <div className="content">
          <Loader tip="Loading your session…" />
        </div>
      </div>
    );
  return children({ workspace, active: workspace.active, onAction, busy, userId });
}
