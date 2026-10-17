import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import {
  useGetPurchaseOrderReceiptsQuery,
  useReceivePurchaseOrderMutation,
  useUpdatePurchaseOrderStatusMutation,
} from "../../api/poApi";
import { useGetWarehousesQuery } from "../../api/stockApi";
import useCan from "../../utils/useCan";
import { fmtDateTime, fmtQty } from "./stockLabels";

const { Text } = Typography;

const STATUS_HELP = {
  pending: "Not confirmed yet — nothing counts as incoming.",
  in_negotiation: "In negotiation — nothing counts as incoming.",
  confirmed: "Confirmed — quantities count as Incoming stock until received.",
  partial_delivered: "Part received — the rest still counts as Incoming.",
  delivered: "Fully received.",
  cancelled: "Cancelled — nothing incoming.",
};

/** Receive goods against a purchase order (goods receipt / GRN), part quantities allowed. */
export default function PoReceivingPanel({ po }) {
  const can = useCan();
  const id = po?.id;
  const { data, isFetching, refetch } = useGetPurchaseOrderReceiptsQuery(id, {
    skip: !id,
    refetchOnMountOrArgChange: true,
  });
  const { data: whData } = useGetWarehousesQuery();
  const warehouses = (whData?.data || []).filter((w) => w.active !== false);
  const [receive, { isLoading }] = useReceivePurchaseOrderMutation();
  const [setStatus, { isLoading: statusLoading }] = useUpdatePurchaseOrderStatusMutation();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState({});
  const [bad, setBad] = useState({});
  const [warehouseId, setWarehouseId] = useState();
  const [notes, setNotes] = useState("");

  const remaining = data?.remaining || [];
  const due = remaining.filter((r) => r.quantity > 0);
  const canReceive = ["confirmed", "partial_delivered"].includes(po?.status) && due.length > 0;
  const canEdit = can("purchase_orders", "edit");

  const openModal = () => {
    setQty(Object.fromEntries(due.map((r) => [r.productId, r.quantity])));
    setBad({});
    setNotes("");
    setOpen(true);
  };
  const submit = async () => {
    const items = due
      .map((r) => ({ productId: r.productId, quantity: Number(qty[r.productId]) || 0, damaged: Number(bad[r.productId]) || 0 }))
      .filter((i) => i.quantity + i.damaged > 0);
    if (!items.length) return message.warning("Enter at least one quantity received");
    try {
      const r = await receive({ id, items, warehouseId: warehouseId || warehouses[0]?.id, notes }).unwrap();
      message.success(
        `${r.message}${r.ordersFilled ? ` · ${r.ordersFilled} waiting order(s) got stock` : ""}`,
      );
      setOpen(false);
      refetch();
    } catch (e) {
      message.error(e?.data?.message || "Could not record the receipt");
    }
  };
  const confirm = async () => {
    try {
      await setStatus({ id, status: "confirmed" }).unwrap();
      message.success("PO confirmed — quantities now show as incoming stock");
    } catch (e) {
      message.error(e?.data?.message || "Could not confirm");
    }
  };

  if (!po) return null;
  return (
    <Card
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <InboxOutlined /> Receiving
          <Tag>{String(po.status || "").replace("_", " ")}</Tag>
        </Space>
      }
      extra={
        canEdit && (
          <Space>
            {["pending", "in_negotiation"].includes(po.status) && (
              <Button onClick={confirm} loading={statusLoading}>
                Confirm PO
              </Button>
            )}
            {canReceive && (
              <Button type="primary" onClick={openModal}>
                Receive goods
              </Button>
            )}
          </Space>
        )
      }
    >
      <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
        {STATUS_HELP[po.status] || ""}
      </Text>
      <Table
        size="small"
        rowKey="productId"
        loading={isFetching}
        pagination={false}
        dataSource={remaining}
        columns={[
          { title: "Product", dataIndex: "productName" },
          { title: "Ordered", dataIndex: "ordered", align: "right", render: fmtQty },
          { title: "Received", dataIndex: "received", align: "right", render: fmtQty },
          {
            title: "Still due",
            dataIndex: "quantity",
            align: "right",
            render: (v) => (v ? <Text strong>{fmtQty(v)}</Text> : <Tag color="green">Complete</Tag>),
          },
        ]}
      />
      {(data?.receipts || []).length > 0 && (
        <>
          <Text strong style={{ display: "block", margin: "16px 0 8px" }}>
            Goods receipts
          </Text>
          <Table
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={data.receipts}
            columns={[
              { title: "GRN", dataIndex: "grnNo" },
              { title: "Received", dataIndex: "receivedAt", render: fmtDateTime },
              {
                title: "Items",
                dataIndex: "items",
                render: (items = []) =>
                  items.map((i) => (
                    <div key={i.id}>
                      {i.productName}: {fmtQty(i.quantity)}
                      {i.damaged ? <Text type="danger"> + {fmtQty(i.damaged)} damaged</Text> : null}
                    </div>
                  )),
              },
              { title: "Notes", dataIndex: "notes" },
            ]}
          />
        </>
      )}
      <Modal
        open={open}
        title={`Receive goods · ${po.poNumber}`}
        onCancel={() => setOpen(false)}
        onOk={submit}
        okText="Record receipt"
        confirmLoading={isLoading}
        width={720}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Good pieces go on hand and fill waiting orders first (oldest first). Damaged pieces are kept apart."
        />
        {due.length ? (
          <Table
            size="small"
            rowKey="productId"
            pagination={false}
            dataSource={due}
            columns={[
              { title: "Product", dataIndex: "productName" },
              { title: "Due", dataIndex: "quantity", align: "right", render: fmtQty, width: 70 },
              {
                title: "Received good",
                width: 130,
                render: (_, r) => (
                  <InputNumber
                    min={0}
                    max={r.quantity}
                    precision={0}
                    value={qty[r.productId]}
                    onChange={(v) => setQty((q) => ({ ...q, [r.productId]: v }))}
                  />
                ),
              },
              {
                title: "Damaged",
                width: 110,
                render: (_, r) => (
                  <InputNumber
                    min={0}
                    max={r.quantity}
                    precision={0}
                    value={bad[r.productId]}
                    onChange={(v) => setBad((q) => ({ ...q, [r.productId]: v }))}
                  />
                ),
              },
            ]}
          />
        ) : (
          <Empty description="Nothing left to receive" />
        )}
        <Space style={{ marginTop: 12, width: "100%" }} direction="vertical">
          {warehouses.length > 1 && (
            <Select
              value={warehouseId || warehouses[0]?.id}
              onChange={setWarehouseId}
              style={{ width: 240 }}
              options={warehouses.map((w) => ({ value: w.id, label: `Into: ${w.name}` }))}
            />
          )}
          <Input.TextArea
            rows={2}
            placeholder="Notes (vehicle, challan no., remarks)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Space>
      </Modal>
    </Card>
  );
}
