import { useState } from "react";
import { Alert, Button, Card, DatePicker, Descriptions, Empty, Modal, Space, Table, Tag, Tooltip, Typography, message } from "antd";
import { FileDoneOutlined, FilePdfOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useCreateInvoiceMutation, useGetOrderInvoicesQuery, usePreviewInvoiceMutation } from "../../api/invoicesApi";
import useCan from "../../utils/useCan";
import { fetchFile } from "./invoiceFiles";

const { Text } = Typography;
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Order page → GST invoices made for this order, what is still to bill, and "Make invoice". */
export default function OrderInvoicesCard({ orderId }) {
  const can = useCan();
  const { data, isFetching } = useGetOrderInvoicesQuery(orderId, { skip: !orderId });
  const [preview, { isLoading: previewing }] = usePreviewInvoiceMutation();
  const [create, { isLoading: creating }] = useCreateInvoiceMutation();
  const [draft, setDraft] = useState(null);
  const [date, setDate] = useState(dayjs());
  const [busy, setBusy] = useState(null);

  const remaining = (data?.remaining || []).filter((r) => r.remaining > 0);
  const openPreview = async () => {
    try {
      setDate(dayjs());
      setDraft(await preview({ orderId }).unwrap());
    } catch (e) {
      message.error(e?.data?.message || "Could not prepare the invoice");
    }
  };
  const confirm = async () => {
    try {
      const r = await create({ orderId, invoiceDate: date.format("YYYY-MM-DD") }).unwrap();
      message.success(r.message);
      setDraft(null);
    } catch (e) {
      message.error(e?.data?.message || "Could not make the invoice");
    }
  };
  const open = async (inv) => {
    setBusy(inv.id);
    try {
      await fetchFile(`/invoices/${inv.id}/pdf`, { open: true });
    } catch (e) {
      message.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card
      title={
        <span>
          <FileDoneOutlined /> GST invoices
        </span>
      }
      className="section-card"
      style={{ marginTop: 24 }}
      extra={
        data?.canInvoice &&
        can("orders", "edit") && (
          <Button type="primary" icon={<PlusOutlined />} loading={previewing} onClick={openPreview}>
            Make invoice
          </Button>
        )
      }
    >
      {remaining.length > 0 && (data?.invoices || []).length > 0 && (
        <Text type="secondary" className="d-block mb-2">
          Still to invoice: {remaining.reduce((a, r) => a + r.remaining, 0)} piece(s)
        </Text>
      )}
      {(data?.invoices || []).length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            isFetching
              ? "Loading…"
              : data?.canInvoice
                ? "No invoice yet. Make one now, or let the dispatch make it."
                : "No invoice yet. Confirm the order to invoice it."
          }
        />
      ) : (
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={data.invoices}
          columns={[
            {
              title: "Invoice",
              dataIndex: "invoiceNo",
              render: (v, r) => (
                <Space size={4}>
                  <Text delete={r.status === "CANCELLED"} strong={r.status === "ISSUED"}>
                    {v}
                  </Text>
                  {r.status === "CANCELLED" && (
                    <Tooltip title={r.cancelReason}>
                      <Tag color="red">Cancelled</Tag>
                    </Tooltip>
                  )}
                  {r.dispatchId && <Tag>Dispatch</Tag>}
                </Space>
              ),
            },
            { title: "Date", dataIndex: "invoiceDate", render: (d) => dayjs(d).format("D MMM YYYY") },
            { title: "Pieces", key: "qty", align: "right", render: (_, r) => r.lines.reduce((a, l) => a + Number(l.qty || 0), 0) },
            { title: "Total", dataIndex: "total", align: "right", render: inr },
            {
              title: "",
              key: "pdf",
              width: 50,
              render: (_, r) => (
                <Button type="text" icon={<FilePdfOutlined style={{ color: "#d32f2f" }} />} loading={busy === r.id} onClick={() => open(r)} />
              ),
            },
          ]}
        />
      )}

      <Modal
        open={!!draft}
        title="Make GST invoice"
        okText="Make invoice"
        okButtonProps={{ loading: creating }}
        onOk={confirm}
        onCancel={() => setDraft(null)}
        width={720}
        zIndex={2000}
        destroyOnHidden
      >
        {draft && (
          <>
            {!draft.billTo?.gstin && (
              <Alert
                type="info"
                showIcon
                className="mb-3"
                message="The customer has no GSTIN — this will be a B2C invoice. Add the GSTIN on the customer first if they need input credit."
              />
            )}
            {draft.lines.some((l) => !l.hsn) && (
              <Alert type="warning" showIcon className="mb-3" message="Some products have no HSN code. Add it on the product (HSN Code field) so the invoice is complete." />
            )}
            <Descriptions size="small" column={2} className="mb-3">
              <Descriptions.Item label="Bill to">{draft.billTo?.name}</Descriptions.Item>
              <Descriptions.Item label="Place of supply">
                {draft.placeOfSupply || "—"} · {draft.interState ? "IGST" : "CGST + SGST"}
              </Descriptions.Item>
              <Descriptions.Item label="Invoice date">
                <DatePicker
                  value={date}
                  onChange={(d) => d && setDate(d)}
                  format="D MMM YYYY"
                  allowClear={false}
                  disabledDate={(d) => d && d.isAfter(dayjs().endOf("day"))}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Number">Given when you confirm</Descriptions.Item>
            </Descriptions>
            <Table
              size="small"
              rowKey="productId"
              pagination={false}
              dataSource={draft.lines}
              columns={[
                { title: "Product", dataIndex: "name" },
                { title: "HSN", dataIndex: "hsn", render: (v) => v || <Text type="warning">missing</Text> },
                { title: "Qty", dataIndex: "qty", align: "right" },
                { title: "Rate", dataIndex: "rate", align: "right", render: inr },
                { title: "Taxable", dataIndex: "taxable", align: "right", render: inr },
              ]}
            />
            <div className="text-end mt-3" style={{ lineHeight: 1.8 }}>
              {draft.freight > 0 && <div>Freight {inr(draft.freight)}</div>}
              {draft.discount > 0 && <div>Less discount − {inr(draft.discount)}</div>}
              <div>Taxable value {inr(draft.taxableValue)}</div>
              {draft.interState ? (
                <div>IGST {draft.gstRate}% {inr(draft.igst)}</div>
              ) : (
                <div>
                  CGST {draft.gstRate / 2}% {inr(draft.cgst)} · SGST {draft.gstRate / 2}% {inr(draft.sgst)}
                </div>
              )}
              {draft.roundOff !== 0 && <div>Round off {inr(draft.roundOff)}</div>}
              <div>
                <Text strong style={{ fontSize: 16 }}>
                  Invoice total {inr(draft.total)}
                </Text>
              </div>
            </div>
          </>
        )}
      </Modal>
    </Card>
  );
}
