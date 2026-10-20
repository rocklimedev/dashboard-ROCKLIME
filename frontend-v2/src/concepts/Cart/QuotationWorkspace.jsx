import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Spin } from "antd";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { reconcileQuotationItems } from "../../components/Quotation/quotationCartHelpers";
import { useGetProfileQuery } from "../../api/userApi";
import { cartApi, useGetQuotationWorkspaceQuery, useUpdateQuotationWorkspaceMutation } from "../../api/cartApi";

// Serialize draft operations across route changes, including the outgoing editor's final save.
const pendingByUser = new Map();
const legacyKeys = { quotation: "quotation", order: "order", "purchase-order": "purchaseorder" };
function legacySnapshot(userId, type, items = []) {
  try {
    const parent = JSON.parse(localStorage.getItem(`draft_${legacyKeys[type]}_${userId}`) || "{}");
    const layout = type === "quotation" ? JSON.parse(localStorage.getItem(`cart-draft-${userId}`) || "{}") : {};
    return { parent, layout: { ...layout, localCartItems: items } };
  } catch { return { layout: { localCartItems: items } }; }
}
export default function CartWorkspace({ children, documentType = "quotation" }) {
  const { data: profile } = useGetProfileQuery();
  const userId = profile?.user?.userId;
  const { data, error, refetch } = useGetQuotationWorkspaceQuery(documentType, { skip: !userId, refetchOnMountOrArgChange: true });
  const [update] = useUpdateQuotationWorkspaceMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const dealId = documentType === "quotation" ? params.get("deal") : null;
  const presetCustomer = params.get("customer");
  const [workspace, setWorkspace] = useState(null);
  const [busy, setBusy] = useState(false);
  const [initialisationError, setInitialisationError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const initialising = useRef(false), state = useRef(null);
  useEffect(() => {
    if (!data || state.current || initialising.current) return;
    initialising.current = true;
    const initialise = async () => {
      await pendingByUser.get(userId)?.catch(() => {});
      const fresh = await refetch().unwrap();
      let initial = structuredClone(fresh.workspace), cart = fresh.cart;
      initial.drafts.forEach(draft => { draft.documentType ||= "quotation"; });
      let active = initial.drafts.find(draft => draft.id === initial.activeId);
      if (!initial.revision && !active.snapshot?.parent) active.snapshot = legacySnapshot(userId, active.documentType, cart.items || []);
      active.snapshot.layout = { ...active.snapshot.layout, localCartItems: reconcileQuotationItems(cart.items || [], active.snapshot.layout?.localCartItems || []) };
      const apply = async body => {
        const result = await update({ activeId: initial.activeId, revision: initial.revision, ...body }).unwrap();
        initial = result.workspace; cart = result.cart;
        active = initial.drafts.find(draft => draft.id === initial.activeId);
      };
      if (active.documentType !== documentType) await apply({ action: "document", documentType, snapshot: active.snapshot, initialSnapshot: legacySnapshot(userId, documentType) });
      if (dealId && active.snapshot.parent?.dealId !== dealId) {
        const existing = initial.drafts.find(draft => draft.documentType === "quotation" && draft.snapshot?.parent?.dealId === dealId);
        await apply({ action: existing ? "switch" : "new", targetId: existing?.id, snapshot: active.snapshot, initialSnapshot: { parent: { selectedCustomer: presetCustomer || "", dealId } } });
      }
      await dispatch(cartApi.util.upsertQueryData("getCart", userId, { cart }));
      state.current = initial;
      setWorkspace(initial);
    };
    const task = initialise().catch(() => setInitialisationError(true)).finally(() => { initialising.current = false; });
    pendingByUser.set(userId, task);
  }, [data, refetch, dispatch, userId, dealId, presetCustomer, update, attempt, documentType]);
  const onAction = useCallback((action, snapshot, sourceId, extra = {}) => {
    if (action !== "save") setBusy(true);
    const task = (pendingByUser.get(userId) || Promise.resolve()).catch(() => {}).then(async () => {
      const current = state.current;
      if (!current || current.activeId !== sourceId) return;
      const result = await update({ action, snapshot, activeId: current.activeId, revision: current.revision, ...extra }).unwrap();
      if (result.workspace.activeId !== current.activeId) {
        await dispatch(cartApi.util.upsertQueryData("getCart", userId, { cart: result.cart }));
        const active = result.workspace.drafts.find(draft => draft.id === result.workspace.activeId);
        navigate(`/cart/${active.documentType || "quotation"}`, { replace: true });
      }
      state.current = result.workspace;
      setWorkspace(result.workspace);
    }).finally(() => { if (action !== "save") setBusy(false); });
    pendingByUser.set(userId, task);
    return task;
  }, [dispatch, update, userId, navigate]);
  if (error || initialisationError) return <div className="page-wrapper"><div className="content"><Alert type="error" showIcon message="Could not load saved carts" description={error?.data?.message} action={<Button onClick={() => { setInitialisationError(false); setAttempt(value => value + 1); refetch(); }}>Retry</Button>} /></div></div>;
  if (!workspace) return <div className="page-wrapper"><div className="content"><Spin tip="Loading saved carts…" /></div></div>;
  const active = workspace.drafts.find(draft => draft.id === workspace.activeId);
  return children({ workspace, active, onAction, busy, userId });
}
