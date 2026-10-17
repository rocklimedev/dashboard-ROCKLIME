import { Alert, Steps, Typography } from "antd";

const { Text } = Typography;

// The order's road from confirmation to closing. Dispatched/Delivered are
// reached through real dispatches; the stepper only explains, it does not move.
const STEPS = [
  { key: "PREPARING", title: "Confirmed", statuses: ["PREPARING"] },
  { key: "CHECKING", title: "Checked", statuses: ["CHECKING"] },
  { key: "INVOICE", title: "Invoiced", statuses: ["INVOICE"] },
  { key: "DISPATCHED", title: "Dispatched", statuses: ["PARTIALLY_DISPATCHED", "DISPATCHED"] },
  { key: "DELIVERED", title: "Delivered", statuses: ["PARTIALLY_DELIVERED", "DELIVERED"] },
  { key: "CLOSED", title: "Closed", statuses: ["CLOSED"] },
];

const indexOf = (status) => STEPS.findIndex((s) => s.statuses.includes(status));

/**
 * What still stands between the order and its next step, in plain words.
 * Mirrors the server's rules for closing (all dispatched + invoice, gate pass,
 * receiving document).
 */
function nextNeeds(order, { remainingQty, due }) {
  const s = order.status;
  const out = [];
  if (s === "DRAFT") return ["Confirm the order (set it to Preparing) to reserve stock."];
  if (["PREPARING", "CHECKING", "INVOICE"].includes(s) && remainingQty > 0) out.push(`${remainingQty} item(s) still to dispatch.`);
  if (["PARTIALLY_DISPATCHED"].includes(s) && remainingQty > 0) out.push(`${remainingQty} item(s) still to dispatch.`);
  if (["DISPATCHED", "PARTIALLY_DELIVERED"].includes(s)) out.push("Mark each dispatch delivered once the customer receives it.");
  if (!["CLOSED", "CANCELED"].includes(s)) {
    if (!order.invoiceLink) out.push("Invoice not uploaded.");
    if (!order.gatePassLink && ["DISPATCHED", "PARTIALLY_DISPATCHED", "DELIVERED", "PARTIALLY_DELIVERED"].includes(s)) out.push("Gate pass not uploaded.");
    if (!order.receivingDocumentLink && ["DELIVERED", "PARTIALLY_DELIVERED"].includes(s)) out.push("Receiving document not uploaded (needed to close).");
  }
  if (due > 0.5 && !["DRAFT", "CANCELED"].includes(s)) out.push(`₹${Math.round(due).toLocaleString("en-IN")} still to be collected.`);
  return out;
}

export default function OrderProgress({ order, dispatches = [], due = 0 }) {
  if (!order) return null;
  const s = order.status;
  if (["CANCELED", "RETURNED", "ONHOLD"].includes(s)) {
    return (
      <Alert
        style={{ margin: "12px 0" }}
        type={s === "ONHOLD" ? "warning" : "error"}
        showIcon
        message={
          s === "ONHOLD"
            ? "On hold — stock stays reserved for 7 days, then it is released."
            : s === "CANCELED"
              ? "Cancelled — reserved stock has been released."
              : "Returned — see credit notes below."
        }
      />
    );
  }
  const lines = Array.isArray(order.products) ? order.products : [];
  const ordered = lines.reduce((a, l) => a + (Number(l.quantity) || 0), 0);
  const shipped = dispatches
    .filter((d) => d.status !== "RETURNED")
    .reduce((a, d) => a + (d.items || []).reduce((b, i) => b + (Number(i.quantity) || 0), 0), 0);
  const remainingQty = Math.max(ordered - shipped, 0);
  const current = s === "DRAFT" ? -1 : indexOf(s);
  const needs = nextNeeds(order, { remainingQty, due });
  const partial = ["PARTIALLY_DISPATCHED", "PARTIALLY_DELIVERED"].includes(s);

  return (
    <div style={{ margin: "12px 0 16px" }}>
      <Steps
        size="small"
        current={Math.max(current, 0)}
        status={s === "DRAFT" ? "wait" : partial ? "process" : s === "CLOSED" ? "finish" : "process"}
        items={STEPS.map((st, i) => ({
          title: st.title,
          description:
            i === 3 && ordered
              ? `${Math.min(shipped, ordered)} of ${ordered}`
              : i === current && partial
                ? "part"
                : undefined,
        }))}
        responsive
      />
      {needs.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <Text type="secondary">Before the next step: </Text>
          <Text>{needs.join(" ")}</Text>
        </div>
      )}
    </div>
  );
}
