import { useState } from "react";
import { Alert, Button, Card, Col, Input, Modal, Row, Space, Statistic, Table, Tag, Typography, message } from "antd";
import { WalletOutlined } from "@ant-design/icons";
import { useCancelPaymentMutation, useGetOrderPaymentsQuery } from "../../api/paymentsApi";
import { inr } from "../../utils/quotationMath";
import useCan from "../../utils/useCan";
import RecordPaymentModal from "./RecordPaymentModal";
import { modeLabel } from "./paymentModes";

const { Text } = Typography;
const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

/** Billed / paid / due for one order, its payments, and recording a new one. */
export default function OrderPaymentsCard({ orderId, customerName }) {
  const can = useCan();
  const canEdit = can("orders", "edit");
  const { data, isFetching } = useGetOrderPaymentsQuery(orderId, { skip: !orderId, refetchOnMountOrArgChange: true });
  const [cancel] = useCancelPaymentMutation();
  const [open, setOpen] = useState(false);

  const doCancel = (p) => {
    let reason = "";
    Modal.confirm({
      title: `Cancel payment ${p.receiptNo}?`,
      content: (
        <Input.TextArea rows={2} placeholder="Reason (e.g. cheque bounced, wrong entry)" onChange={(e) => (reason = e.target.value)} />
      ),
      okText: "Cancel payment",
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!reason.trim()) {
          message.error("A reason is required");
          throw new Error("reason");
        }
        try {
          await cancel({ id: p.id, reason }).unwrap();
          message.success("Payment cancelled");
        } catch (e) {
          message.error(e?.data?.message || "Could not cancel");
        }
      },
    });
  };

  return (
    <Card
      className="section-card"
      style={{ marginTop: 16 }}
      title={
        <span>
          <WalletOutlined /> Payments
        </span>
      }
      extra={
        canEdit &&
        data?.billable &&
        data?.due > 0 && (
          <Button type="primary" size="small" onClick={() => setOpen(true)}>
            Record payment
          </Button>
        )
      }
    >
      {data && !data.billable ? (
        <Alert type="info" showIcon message="Draft and cancelled orders are not billed." />
      ) : (
        <>
          <Row gutter={12} style={{ marginBottom: 12 }}>
            <Col span={8}>
              <Statistic title="Billed" value={inr(data?.billed || 0)} valueStyle={{ fontSize: 18 }} />
              {data?.credited > 0 && <Text type="secondary" style={{ fontSize: 12 }}>after credit notes {inr(data.credited)}</Text>}
            </Col>
            <Col span={8}>
              <Statistic title="Paid" value={inr(data?.paid || 0)} valueStyle={{ fontSize: 18, color: "#389e0d" }} />
            </Col>
            <Col span={8}>
              <Statistic title="Due" value={inr(data?.due || 0)} valueStyle={{ fontSize: 18, color: data?.due > 0 ? "#cf1322" : undefined }} />
            </Col>
          </Row>
          <Table
            size="small"
            rowKey="id"
            loading={isFetching}
            pagination={false}
            dataSource={data?.payments || []}
            locale={{ emptyText: "No payments recorded yet" }}
            columns={[
              { title: "Receipt", dataIndex: "receiptNo" },
              { title: "Date", dataIndex: "receivedAt", render: fmt },
              { title: "Mode", dataIndex: "mode", render: (m) => modeLabel[m] || m },
              { title: "Reference", dataIndex: "reference" },
              {
                title: "Amount",
                dataIndex: "amount",
                align: "right",
                render: (v, r) => (r.status === "RECEIVED" ? inr(v) : <Text delete type="secondary">{inr(v)}</Text>),
              },
              {
                title: "",
                render: (_, r) =>
                  r.status === "RECEIVED" ? (
                    canEdit && (
                      <Button size="small" type="link" danger onClick={() => doCancel(r)}>
                        Cancel
                      </Button>
                    )
                  ) : (
                    <Space size={4}>
                      <Tag color="red">Cancelled</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>{r.cancelReason}</Text>
                    </Space>
                  ),
              },
            ]}
          />
        </>
      )}
      <RecordPaymentModal
        open={open}
        onClose={() => setOpen(false)}
        orders={data ? [{ id: data.orderId, orderNo: data.orderNo, customerName, billed: data.billed, paid: data.paid, due: data.due }] : []}
      />
    </Card>
  );
}
