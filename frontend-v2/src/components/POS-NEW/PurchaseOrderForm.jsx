// Purchase order checkout: vendor (with its GST and address), deliver-to
// godown, dates, terms, freight, notes and the lines (qty, rate, discount,
// GST %). Totals use the same maths as the server and the PO PDF (utils/poMath).
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, DatePicker, Divider, Empty, Form, Image, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography, message } from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined, DeleteOutlined, EditOutlined, ShopOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { poTotals } from "../../utils/poMath";
import { inr } from "../../utils/quotationMath";
import { useUpdateVendorMutation } from "../../api/vendorApi";
import { useGetWarehousesQuery } from "../../api/stockApi";
import { useGetSettingsQuery } from "../../api/settingsApi";

const { Text, Title } = Typography;
const GST = [0, 5, 12, 18, 28];

function VendorDetailsModal({ vendor, open, onClose }) {
  const [form] = Form.useForm();
  const [save, { isLoading }] = useUpdateVendorMutation();
  useEffect(() => {
    if (open && vendor) form.setFieldsValue(vendor);
  }, [open, vendor, form]);
  return (
    <Modal
      open={open}
      title={`Vendor details · ${vendor?.vendorName || ""}`}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Save"
      confirmLoading={isLoading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={async (v) => {
          try {
            await save({ id: vendor.id, updatedVendor: { vendorId: vendor.vendorId, vendorName: vendor.vendorName, brandId: vendor.brandId, brandSlug: vendor.brandSlug, ...v } }).unwrap();
            message.success("Vendor saved");
            onClose();
          } catch (e) {
            message.error(e?.data?.message || "Could not save");
          }
        }}
      >
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="gstin" label="GSTIN" normalize={(x) => (x || "").toUpperCase().trim()}>
              <Input placeholder="07AABCC1234D1Z5" maxLength={15} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="paymentTerms" label="Usual payment terms">
              <Input placeholder="e.g. 30 days from invoice" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="address" label="Address">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col span={9}>
            <Form.Item name="city" label="City">
              <Input />
            </Form.Item>
          </Col>
          <Col span={9}>
            <Form.Item name="state" label="State" tooltip="Decides CGST + SGST (same state) or IGST">
              <Input placeholder="Delhi" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="pincode" label="PIN">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="contactPerson" label="Contact person">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="phone" label="Phone">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="email" label="Email">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

const PurchaseOrderForm = ({
  purchaseOrderData,
  setPurchaseOrderData,
  selectedVendor,
  setSelectedVendor,
  vendors = [],
  isVendorsLoading = false,
  cartItems = [],
  setActiveTab,
  handleCreateDocument,
}) => {
  const [editVendor, setEditVendor] = useState(false);
  const { data: whData } = useGetWarehousesQuery();
  const warehouses = whData?.data || [];
  const { data: settingsData } = useGetSettingsQuery();
  const company = settingsData?.data?.company || {};
  const purchase = settingsData?.data?.purchase || {};
  const vendor = (Array.isArray(vendors) ? vendors : []).find((v) => (v.id || v._id) === selectedVendor);
  const set = (patch) => setPurchaseOrderData((prev) => ({ ...prev, ...patch }));

  // cart → PO lines (first time on this tab)
  useEffect(() => {
    if (!cartItems?.length || (purchaseOrderData?.items?.length || 0) > 0) return;
    setPurchaseOrderData((prev) => ({
      ...prev,
      items: cartItems.map((item) => ({
        productId: item.productId || item.id,
        name: item.name || "Unnamed product",
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.price || item.mrp || item.unitPrice || 0),
        mrp: Number(item.mrp || item.price || 0),
        discount: 0,
        discountType: "percent",
        tax: 18,
        imageUrl: item.imageUrl || item.images?.[0],
        productCode: item.product_code || item.code || "",
      })),
    }));
  }, [cartItems, purchaseOrderData?.items?.length, setPurchaseOrderData]);

  // vendor's usual payment terms fill in when the vendor is chosen
  useEffect(() => {
    if (vendor && !purchaseOrderData.paymentTermsTouched) set({ paymentTerms: vendor.paymentTerms || purchase.paymentTerms || "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor?.id, purchase.paymentTerms]);

  const items = purchaseOrderData?.items || [];
  const norm = (x) => String(x || "").trim().toLowerCase();
  const interState = Boolean(vendor?.state && company.state && norm(vendor.state) !== norm(company.state));
  const t = useMemo(() => poTotals({ items, freight: Number(purchaseOrderData.freight) || 0, interState }), [items, purchaseOrderData.freight, interState]);

  const updateItem = (index, patch) =>
    setPurchaseOrderData((prev) => {
      const next = [...(prev.items || [])];
      next[index] = { ...next[index], ...patch };
      return { ...prev, items: next };
    });
  const removeItem = (index) => setPurchaseOrderData((prev) => ({ ...prev, items: (prev.items || []).filter((_, i) => i !== index) }));
  const setAllGst = (rate) => setPurchaseOrderData((prev) => ({ ...prev, items: (prev.items || []).map((i) => ({ ...i, tax: rate })) }));

  if (!items.length) {
    return (
      <Card>
        <Empty description="Add products to the cart first" />
        <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => setActiveTab?.("cart")} block>
          Back to cart
        </Button>
      </Card>
    );
  }

  const columns = [
    {
      title: "Product",
      render: (_, r) => (
        <Space>
          {r.imageUrl ? <Image src={r.imageUrl} width={38} height={38} preview={false} style={{ objectFit: "contain" }} /> : null}
          <div>
            <div>{r.name}</div>
            {r.productCode && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {r.productCode}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    { title: "Qty", width: 80, render: (_, r, i) => <InputNumber size="small" min={1} value={r.quantity} onChange={(v) => updateItem(i, { quantity: v || 1 })} style={{ width: "100%" }} /> },
    { title: "Rate (₹)", width: 110, render: (_, r, i) => <InputNumber size="small" min={0} value={r.unitPrice} onChange={(v) => updateItem(i, { unitPrice: v || 0 })} style={{ width: "100%" }} /> },
    {
      title: "Discount",
      width: 140,
      render: (_, r, i) => (
        <Space.Compact size="small">
          <InputNumber size="small" min={0} value={r.discount} onChange={(v) => updateItem(i, { discount: v || 0 })} style={{ width: 70 }} />
          <Select size="small" value={r.discountType || "percent"} onChange={(v) => updateItem(i, { discountType: v })} style={{ width: 62 }} options={[{ value: "percent", label: "%" }, { value: "fixed", label: "₹/pc" }]} />
        </Space.Compact>
      ),
    },
    { title: "GST", width: 82, render: (_, r, i) => <Select size="small" value={Number(r.tax) || 0} onChange={(v) => updateItem(i, { tax: v })} style={{ width: "100%" }} options={GST.map((g) => ({ value: g, label: `${g}%` }))} /> },
    { title: "Amount", width: 110, align: "right", render: (_, r, i) => <Text strong>{inr(t.lines[i]?.net || 0)}</Text> },
    { width: 40, render: (_, __, i) => <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeItem(i)} /> },
  ];

  const missingVendorInfo = vendor && (!vendor.gstin || !vendor.state);

  return (
    <Row gutter={16}>
      <Col xs={24} lg={16}>
        <Card style={{ borderRadius: 12 }}>
          <Title level={5} style={{ marginTop: 0 }}>
            Purchase order
          </Title>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Text strong>Vendor *</Text>
              <Select
                style={{ width: "100%", marginTop: 4 }}
                value={selectedVendor || undefined}
                onChange={setSelectedVendor}
                loading={isVendorsLoading}
                showSearch
                optionFilterProp="label"
                placeholder="Choose vendor"
                options={(Array.isArray(vendors) ? vendors : []).map((v) => ({ value: v.id || v._id, label: v.vendorName || "Unnamed vendor" }))}
              />
              {vendor && (
                <div className="po-vendor-card">
                  <ShopOutlined />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div>{[vendor.address, vendor.city, vendor.state].filter(Boolean).join(", ") || <Text type="secondary">No address</Text>}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {[vendor.gstin ? `GSTIN ${vendor.gstin}` : "No GSTIN", vendor.contactPerson, vendor.phone].filter(Boolean).join(" · ")}
                    </Text>
                  </div>
                  <Button size="small" type="link" icon={<EditOutlined />} onClick={() => setEditVendor(true)}>
                    Edit
                  </Button>
                </div>
              )}
            </Col>
            <Col xs={24} md={12}>
              <Text strong>Deliver to</Text>
              <Select
                style={{ width: "100%", marginTop: 4 }}
                value={purchaseOrderData.warehouseId || warehouses.find((w) => w.isDefault)?.id}
                onChange={(v) => set({ warehouseId: v })}
                placeholder="Main godown"
                options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
              />
            </Col>
          </Row>
          {missingVendorInfo && (
            <Alert
              style={{ marginTop: 10 }}
              type="info"
              showIcon
              message="Add the vendor's GSTIN and state so the PO shows the right tax (CGST + SGST or IGST)."
              action={
                <Button size="small" onClick={() => setEditVendor(true)}>
                  Add details
                </Button>
              }
            />
          )}

          <Row gutter={12} style={{ marginTop: 12 }}>
            <Col xs={24} md={8}>
              <Text strong>Deliver by</Text>
              <DatePicker
                style={{ width: "100%", marginTop: 4 }}
                format="D MMM YYYY"
                value={purchaseOrderData.expectDeliveryDate ? dayjs(purchaseOrderData.expectDeliveryDate) : null}
                onChange={(d) => set({ expectDeliveryDate: d ? d.format("YYYY-MM-DD") : null })}
                disabledDate={(d) => d && d < dayjs().startOf("day")}
              />
              <Space size={4} style={{ marginTop: 4 }}>
                {[3, 7, 15].map((n) => (
                  <Tag key={n} style={{ cursor: "pointer" }} onClick={() => set({ expectDeliveryDate: dayjs().add(n, "day").format("YYYY-MM-DD") })}>
                    +{n} days
                  </Tag>
                ))}
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Text strong>Vendor's quote / ref no.</Text>
              <Input style={{ marginTop: 4 }} value={purchaseOrderData.vendorRef} onChange={(e) => set({ vendorRef: e.target.value })} placeholder="e.g. SGT/Q/2391" />
            </Col>
            <Col xs={24} md={8}>
              <Text strong>Freight (₹)</Text>
              <InputNumber style={{ width: "100%", marginTop: 4 }} min={0} value={purchaseOrderData.freight} onChange={(v) => set({ freight: v || 0 })} placeholder="0" />
            </Col>
            <Col xs={24} md={12} style={{ marginTop: 10 }}>
              <Text strong>Payment terms</Text>
              <Input style={{ marginTop: 4 }} value={purchaseOrderData.paymentTerms} onChange={(e) => set({ paymentTerms: e.target.value, paymentTermsTouched: true })} placeholder={purchase.paymentTerms} />
            </Col>
            <Col xs={24} md={12} style={{ marginTop: 10 }}>
              <Text strong>Delivery terms</Text>
              <Input style={{ marginTop: 4 }} value={purchaseOrderData.deliveryTerms} onChange={(e) => set({ deliveryTerms: e.target.value })} placeholder={purchase.deliveryTerms} />
            </Col>
            <Col span={24} style={{ marginTop: 10 }}>
              <Text strong>Notes for the vendor</Text>
              <Input.TextArea style={{ marginTop: 4 }} rows={2} value={purchaseOrderData.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Delivery timing, packing, contact at site…" />
            </Col>
          </Row>

          <Divider style={{ margin: "16px 0 10px" }} />
          <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 8 }} wrap>
            <Text strong>
              {items.length} product{items.length === 1 ? "" : "s"}
            </Text>
            <Space size={4}>
              <Text type="secondary">GST for all:</Text>
              {GST.map((g) => (
                <Tag key={g} style={{ cursor: "pointer" }} onClick={() => setAllGst(g)}>
                  {g}%
                </Tag>
              ))}
            </Space>
          </Space>
          <Table size="small" columns={columns} dataSource={items} rowKey={(r, i) => `${r.productId}-${i}`} pagination={false} scroll={{ x: 720 }} />
        </Card>
      </Col>

      <Col xs={24} lg={8}>
        <Card style={{ borderRadius: 12, position: "sticky", top: 80 }} title="Summary">
          {[
            ["Value before discount", t.subTotal],
            ["Discount", -t.discount],
            ["Freight", t.freight],
            ["Taxable value", t.taxableValue, true],
            ...(interState ? [["IGST", t.igst]] : [["CGST", t.cgst], ["SGST", t.sgst]]),
            ["Round off", t.roundOff],
          ].map(([k, v, bold]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f3f3" }}>
              <Text strong={bold} type={k === "Round off" ? "secondary" : undefined}>
                {k}
              </Text>
              <Text strong={bold} style={{ color: v < 0 ? "#cf1322" : undefined }}>
                {v < 0 ? "− " : ""}
                {inr(Math.abs(v))}
              </Text>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, padding: "12px 14px", background: "#d7232f", borderRadius: 10, color: "#fff" }}>
            <span style={{ letterSpacing: "0.08em", fontSize: 12, textTransform: "uppercase" }}>PO total</span>
            <span style={{ fontSize: 20, fontWeight: 600 }}>{inr(t.grandTotal)}</span>
          </div>
          <Text type="secondary" style={{ display: "block", marginTop: 6, fontSize: 12 }}>
            {interState ? "Vendor in another state: IGST" : "Same state: CGST + SGST"}
          </Text>
          <Button type="primary" block size="large" icon={<CheckCircleOutlined />} style={{ marginTop: 14 }} onClick={handleCreateDocument} disabled={!selectedVendor || !items.length}>
            Create purchase order
          </Button>
          <Button block style={{ marginTop: 8 }} onClick={() => setActiveTab?.("cart")}>
            Back to cart
          </Button>
        </Card>
      </Col>
      <VendorDetailsModal vendor={vendor} open={editVendor} onClose={() => setEditVendor(false)} />
    </Row>
  );
};

export default React.memo(PurchaseOrderForm);
