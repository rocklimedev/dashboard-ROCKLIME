import { Tag, Tooltip } from 'antd';

const n = (v) => Number(v || 0).toLocaleString('en-IN');
const shortDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null;

/**
 * Compact live-stock badge for a product line.
 *   need      – quantity wanted on this line (optional): turns amber/red when short
 *   available – on hand minus reserved
 *   reserved  – held for confirmed orders
 *   incoming  – on confirmed purchase orders not yet received
 *   nextDate  – expected date of the next incoming delivery (optional)
 */
export default function StockBadge({
  available = 0,
  reserved = 0,
  incoming = 0,
  lowAt = 10,
  need,
  nextDate,
  compact = false,
}) {
  const avail = Number(available) || 0;
  const want = need == null ? null : Number(need) || 0;
  let color = 'green';
  let label = `${n(avail)} available`;
  if (want != null && want > avail) {
    color = avail + Number(incoming || 0) >= want ? 'orange' : 'red';
    label = avail > 0 ? `Only ${n(avail)} available` : 'Out of stock';
  } else if (avail <= 0) {
    color = Number(incoming) > 0 ? 'orange' : 'red';
    label = 'Out of stock';
  } else if (avail <= lowAt) {
    color = 'orange';
    label = `Low: ${n(avail)} left`;
  }
  const tip = (
    <div style={{ lineHeight: 1.6 }}>
      <div>
        Available to sell: <b>{n(avail)}</b>
      </div>
      <div>Reserved for orders: {n(reserved)}</div>
      <div>
        Incoming on POs: {n(incoming)}
        {nextDate ? ` (next ${shortDate(nextDate)})` : ''}
      </div>
    </div>
  );
  return (
    <Tooltip title={tip}>
      <Tag color={color} style={{ marginInlineEnd: 0, cursor: 'help' }}>
        {label}
        {!compact && Number(incoming) > 0 ? ` · +${n(incoming)} coming` : ''}
      </Tag>
    </Tooltip>
  );
}
