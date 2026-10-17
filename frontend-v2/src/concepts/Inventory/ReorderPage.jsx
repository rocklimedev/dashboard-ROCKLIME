import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Checkbox, DatePicker, Empty, InputNumber, Select, Space, Table, Tag, Tooltip, Typography, message } from "antd";
import { ShoppingCartOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useGetReorderSuggestionsQuery } from "../../api/stockApi";
import { useCreatePurchaseOrderMutation } from "../../api/poApi";
import { useGetVendorsQuery } from "../../api/vendorApi";
import useCan from "../../utils/useCan";

const { Title, Text } = Typography;
const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

/** Inventory → Reorder: what to buy, grouped by vendor, one click to a draft purchase order. */
export default function ReorderPage() {
  const navigate = useNavigate();
  const can = useCan();
  const { data, isFetching, refetch } = useGetReorderSuggestionsQuery();
  const { data: vendorsRaw } = useGetVendorsQuery();
  const vendors = Array.isArray(vendorsRaw) ? vendorsRaw : vendorsRaw?.vendors || vendorsRaw?.data || [];
  const [createPO, { isLoading: creating }] = useCreatePurchaseOrderMutation();
  // edits per product: { qty, price, picked }
  const [edit, setEdit] = useState({});
  const [vendorFor, setVendorFor] = useState({}); // group key → chosen vendor (for products without one)
  const [expect, setExpect] = useState(dayjs().add(7, "day"));
  const groups = useMemo(() => data?.data || [], [data]);

  const row = (p) => ({ qty: p.suggest, price: p.unitPrice || null, picked: true, ...(edit[p.productId] || {}) });
  const set = (pid, patch) => setEdit((e) => ({ ...e, [pid]: { ...(e[pid] || {}), ...patch } }));

  const makePO = async (g) => {
    const vendorId = g.vendorId || vendorFor[g.vendorName];
    if (!vendorId) return message.error("Pick the vendor to order these from");
    const items = g.items
      .map((p) => ({ p, r: row(p) }))
      .filter(({ r }) => r.picked && r.qty > 0)
      .map(({ p, r }) => ({ productId: p.productId, quantity: r.qty, unitPrice: r.price, mrp: p.sellingPrice || r.price }));
    if (!items.length) return message.error("Tick at least one product");
    if (items.some((i) => !(i.unitPrice > 0))) return message.error("Enter a price for every ticked product");
    try {
      const r = await createPO({ vendorId, items, expectDeliveryDate: expect.format("YYYY-MM-DD") }).unwrap();
      const id = r?.purchaseOrder?.id || r?.po?.id || r?.data?.id || r?.id;
      message.success(`Draft purchase order ${r?.purchaseOrder?.poNumber || r?.po?.poNumber || ""} created — check prices, then confirm it`);
      if (id) navigate(`/po/${id}`);
      else refetch();
    } catch (e) {
      message.error(e?.data?.message || "Could not create the purchase order");
    }
  };

  const urgentTotal = groups.reduce((a, g) => a + g.urgent, 0);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
          <div>
            <Title level={3} style={{ marginBottom: 0 }}>
              Reorder
            </Title>
            <Text type="secondary">
              Products at or below their reorder point (alert quantity, or 10), counting stock on order and pieces customers are waiting for.
            </Text>
          </div>
          <Space>
            <span>
              <Text type="secondary">Expected by </Text>
              <DatePicker value={expect} onChange={(d) => d && setExpect(d)} format="D MMM YYYY" allowClear={false} />
            </span>
            <Button icon={<ReloadOutlined />} onClick={refetch} loading={isFetching}>
              Refresh
            </Button>
          </Space>
        </div>
        {urgentTotal > 0 && (
          <Alert
            style={{ marginTop: 12 }}
            type="error"
            showIcon
            message={`${urgentTotal} product(s) are out of stock with customers waiting — order these first.`}
          />
        )}
        {!isFetching && !groups.length && (
          <Card style={{ marginTop: 16 }}>
            <Empty description="Nothing to reorder — every product is above its reorder point." />
          </Card>
        )}
        {groups.map((g) => {
          const picked = g.items.filter((p) => row(p).picked);
          const value = picked.reduce((a, p) => a + (row(p).price || 0) * (row(p).qty || 0), 0);
          return (
            <Card
              key={g.vendorId || g.vendorName}
              style={{ marginTop: 16 }}
              title={
                <Space wrap>
                  <span>{g.vendorName}</span>
                  <Tag>{g.items.length} product(s)</Tag>
                  {g.urgent > 0 && <Tag color="red">{g.urgent} urgent</Tag>}
                </Space>
              }
              extra={
                can("purchase_orders", "write") && (
                  <Space>
                    {!g.vendorId && (
                      <Select
                        placeholder="Order from…"
                        style={{ width: 220 }}
                        showSearch
                        optionFilterProp="label"
                        value={vendorFor[g.vendorName]}
                        onChange={(v) => setVendorFor((x) => ({ ...x, [g.vendorName]: v }))}
                        options={vendors.map((v) => ({ value: v.id, label: v.vendorName }))}
                      />
                    )}
                    <Text type="secondary">{inr(value)}</Text>
                    <Button type="primary" icon={<ShoppingCartOutlined />} loading={creating} onClick={() => makePO(g)}>
                      Draft PO ({picked.length})
                    </Button>
                  </Space>
                )
              }
            >
              <Table
                size="small"
                rowKey="productId"
                pagination={false}
                dataSource={g.items}
                scroll={{ x: 900 }}
                columns={[
                  {
                    title: "",
                    key: "pick",
                    width: 36,
                    render: (_, p) => <Checkbox checked={row(p).picked} onChange={(e) => set(p.productId, { picked: e.target.checked })} />,
                  },
                  {
                    title: "Product",
                    key: "name",
                    render: (_, p) => (
                      <div>
                        <Link to={`/product/${p.productId}`}>{p.name}</Link> {p.urgent && <Tag color="red">Customers waiting</Tag>}
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {[p.code, p.brand].filter(Boolean).join(" · ")}
                          </Text>
                        </div>
                      </div>
                    ),
                  },
                  { title: "Available", dataIndex: "available", align: "right", render: (v) => <Text type={v <= 0 ? "danger" : undefined}>{v}</Text> },
                  { title: "On order", dataIndex: "incoming", align: "right" },
                  { title: "Waiting", dataIndex: "waiting", align: "right", render: (v) => (v ? <Text type="danger">{v}</Text> : "—") },
                  { title: "Reorder at", dataIndex: "reorderPoint", align: "right" },
                  {
                    title: "Order qty",
                    key: "qty",
                    width: 110,
                    render: (_, p) => <InputNumber min={1} value={row(p).qty} onChange={(v) => set(p.productId, { qty: v })} style={{ width: 90 }} />,
                  },
                  {
                    title: "Unit price",
                    key: "price",
                    width: 150,
                    render: (_, p) => (
                      <Tooltip title={`From ${p.priceFrom}`}>
                        <InputNumber
                          min={0}
                          prefix="₹"
                          value={row(p).price}
                          onChange={(v) => set(p.productId, { price: v })}
                          status={!row(p).price ? "error" : p.lastPrice ? undefined : "warning"}
                          style={{ width: 130 }}
                        />
                      </Tooltip>
                    ),
                  },
                ]}
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
