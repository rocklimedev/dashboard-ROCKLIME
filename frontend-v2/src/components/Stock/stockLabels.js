// Plain-language names for stock movements and order statuses.
export const MOVEMENT_LABELS = {
  OPENING: 'Opening balance',
  RESERVE: 'Reserved for order',
  RELEASE: 'Reservation released',
  DISPATCH: 'Dispatched',
  RECEIPT: 'Goods received',
  INCOMING: 'PO confirmed (incoming)',
  INCOMING_CANCEL: 'PO incoming removed',
  RETURN: 'Customer return',
  RETURN_REVERSED: 'Return reversed',
  ADJUST: 'Adjustment',
  DAMAGE: 'Marked damaged',
  WRITE_OFF: 'Damaged written off',
  COUNT: 'Stock count',
  TRANSFER_IN: 'Transfer in',
  TRANSFER_OUT: 'Transfer out',
};

export const ADJUST_REASONS = [
  'Breakage in godown',
  'Found during check',
  'Wrong entry correction',
  'Sample / display',
  'Theft / loss',
  'Opening stock',
];

export const fmtQty = (v) => Number(v || 0).toLocaleString('en-IN');
export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';
export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

/** "+4" / "−2" with sign, blank for 0 */
export const signed = (v) => {
  const x = Number(v || 0);
  if (!x) return '';
  return x > 0 ? `+${fmtQty(x)}` : `−${fmtQty(-x)}`;
};
