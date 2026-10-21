// Quotation pipeline UI: status tag, status actions, lost reasons and the
// follow-up log. The rules live on the server (modules/quotations/pipeline.js);
// Won and Expired are automatic, so they are never offered as buttons.
import { useState } from "react";
import {
  Button,
  DatePicker,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  Tag,
  Timeline,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MessageOutlined,
  PhoneOutlined,
  SendOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  useAddQuotationFollowUpMutation,
  useGetQuotationFollowUpsQuery,
  useUpdateQuotationStatusMutation,
} from "../../api/quotationApi";

import { STATUS_META, LOST_REASONS } from "./pipelineMeta";

const { Text } = Typography;

const CHANNELS = [
  { value: "CALL", label: "Call" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "VISIT", label: "Showroom visit" },
  { value: "MEETING", label: "Site meeting" },
  { value: "EMAIL", label: "Email" },
  { value: "OTHER", label: "Other" },
];

const fmt = (d) => (d ? dayjs(d).format("D MMM YYYY") : "—");
const today = () => dayjs().format("YYYY-MM-DD");

export function QuotationStatusTag({ status, lostReason }) {
  const meta = STATUS_META[status] || STATUS_META.DRAFT;
  return (
    <Tooltip title={status === "LOST" && lostReason ? `Lost: ${lostReason}` : meta.help}>
      <Tag color={meta.color} style={{ marginInlineEnd: 0 }}>
        {meta.label}
      </Tag>
    </Tooltip>
  );
}

/** Valid-till date with a warning colour when it is close or past. */
export function ValidTill({ date, status }) {
  if (!date) return "—";
  const days = dayjs(date).startOf("day").diff(dayjs().startOf("day"), "day");
  const open = ["DRAFT", "SENT", "NEGOTIATION"].includes(status);
  const type = !open ? "secondary" : days < 0 ? "danger" : days <= 2 ? "warning" : undefined;
  return (
    <Text type={type}>
      {fmt(date)}
      {open && days >= 0 && days <= 2 ? ` · ${days === 0 ? "today" : `${days}d left`}` : ""}
    </Text>
  );
}

/** Next follow-up date, red when due or overdue. */
export function NextFollowUp({ date, status }) {
  if (!date || !["DRAFT", "SENT", "NEGOTIATION"].includes(status)) return <Text type="secondary">—</Text>;
  const due = String(date).slice(0, 10) <= today();
  return <Text type={due ? "danger" : undefined}>{due ? `Due ${fmt(date)}` : fmt(date)}</Text>;
}

/** "Mark lost" dialog: a reason is required. */
export function LostModal({ quotation, open, onClose }) {
  const [form] = Form.useForm();
  const [updateStatus, { isLoading }] = useUpdateQuotationStatusMutation();
  const submit = async () => {
    const v = await form.validateFields();
    try {
      await updateStatus({ id: quotation.quotationId, status: "LOST", ...v }).unwrap();
      message.success("Marked lost");
      form.resetFields();
      onClose();
    } catch (e) {
      message.error(e?.data?.message || "Could not update the quotation");
    }
  };
  return (
    <Modal
      open={open}
      title={`Mark ${quotation?.reference_number || "quotation"} as lost`}
      okText="Mark lost"
      okButtonProps={{ danger: true, loading: isLoading }}
      onOk={submit}
      onCancel={onClose}
      destroyOnHidden
      zIndex={2000}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="lostReason" label="Why was it lost?" rules={[{ required: true, message: "Pick a reason" }]}>
          <Select options={LOST_REASONS.map((r) => ({ value: r, label: r }))} placeholder="Pick a reason" />
        </Form.Item>
        <Form.Item name="lostNote" label="Note (optional)">
          <Input.TextArea rows={3} placeholder="e.g. Customer went with a dealer in Kirti Nagar at 12% less" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/** "Log follow-up" dialog: what happened and when to follow up next. */
export function FollowUpModal({ quotation, open, onClose }) {
  const [form] = Form.useForm();
  const [addFollowUp, { isLoading }] = useAddQuotationFollowUpMutation();
  const submit = async () => {
    const v = await form.validateFields();
    try {
      await addFollowUp({
        id: quotation.quotationId,
        channel: v.channel,
        note: v.note,
        nextDate: v.nextDate ? v.nextDate.format("YYYY-MM-DD") : null,
      }).unwrap();
      message.success(v.nextDate ? `Follow-up saved; next on ${v.nextDate.format("D MMM")}` : "Follow-up saved");
      form.resetFields();
      onClose();
    } catch (e) {
      message.error(e?.data?.message || "Could not save the follow-up");
    }
  };
  return (
    <Modal
      open={open}
      title={`Follow-up · ${quotation?.reference_number || ""}`}
      okText="Save follow-up"
      okButtonProps={{ loading: isLoading }}
      onOk={submit}
      onCancel={onClose}
      destroyOnHidden
      zIndex={2000}
    >
      <Form form={form} layout="vertical" initialValues={{ channel: "CALL", nextDate: dayjs().add(3, "day") }}>
        <Form.Item name="channel" label="How">
          <Select options={CHANNELS} />
        </Form.Item>
        <Form.Item name="note" label="What happened" rules={[{ required: true, message: "Write a short note" }]}>
          <Input.TextArea rows={3} placeholder="e.g. Spoke to client, wants 5% more on the WC; call back after site visit" />
        </Form.Item>
        <Form.Item name="nextDate" label="Next follow-up" extra="Leave empty if no follow-up is needed.">
          <DatePicker
            format="D MMM YYYY"
            disabledDate={(d) => d && d.isBefore(dayjs().startOf("day"))}
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/** Follow-up history for one quotation. */
export function FollowUpHistory({ quotationId }) {
  const { data, isLoading } = useGetQuotationFollowUpsQuery(quotationId, { skip: !quotationId });
  const rows = data?.data || [];
  if (isLoading) return <Text type="secondary">Loading…</Text>;
  if (!rows.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No follow-ups logged yet" />;
  return (
    <Timeline
      items={rows.map((f) => ({
        color: "blue",
        children: (
          <div>
            <Text strong>{CHANNELS.find((c) => c.value === f.channel)?.label || f.channel}</Text>
            <Text type="secondary">
              {" "}
              · {dayjs(f.createdAt).format("D MMM YYYY, h:mm a")}
              {f.userName ? ` · ${f.userName}` : ""}
            </Text>
            <div style={{ whiteSpace: "pre-wrap" }}>{f.note}</div>
            {f.nextDate && <Text type="secondary">Next follow-up: {fmt(f.nextDate)}</Text>}
          </div>
        ),
      }))}
    />
  );
}

/**
 * Status actions for one quotation. `compact` renders a single dropdown-sized
 * set for table rows; otherwise a full bar for the quotation page.
 */
export function QuotationStatusActions({ quotation, canEdit = true, onConvert, canConvert = true }) {
  const [lostOpen, setLostOpen] = useState(false);
  const [fuOpen, setFuOpen] = useState(false);
  const [updateStatus, { isLoading }] = useUpdateQuotationStatusMutation();
  const status = quotation?.status || "DRAFT";
  const open = ["DRAFT", "SENT", "NEGOTIATION"].includes(status);

  const move = async (to, label) => {
    try {
      await updateStatus({ id: quotation.quotationId, status: to }).unwrap();
      message.success(label);
    } catch (e) {
      message.error(e?.data?.message || "Could not update the quotation");
    }
  };

  return (
    <>
      <Space wrap size={8}>
        {canConvert && open && onConvert && (
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={onConvert}>
            Convert to order
          </Button>
        )}
        {canEdit && open && (
          <Button icon={<PhoneOutlined />} onClick={() => setFuOpen(true)}>
            Log follow-up
          </Button>
        )}
        {canEdit && status === "DRAFT" && (
          <Button icon={<SendOutlined />} loading={isLoading} onClick={() => move("SENT", "Marked sent")}>
            Mark sent
          </Button>
        )}
        {canEdit && status === "SENT" && (
          <Button icon={<SwapOutlined />} loading={isLoading} onClick={() => move("NEGOTIATION", "Moved to negotiation")}>
            In negotiation
          </Button>
        )}
        {canEdit && (open || status === "EXPIRED") && (
          <Button danger icon={<CloseCircleOutlined />} onClick={() => setLostOpen(true)}>
            Mark lost
          </Button>
        )}
        {canEdit && status === "LOST" && (
          <Button icon={<MessageOutlined />} loading={isLoading} onClick={() => move("NEGOTIATION", "Reopened")}>
            Reopen
          </Button>
        )}
      </Space>
      <LostModal quotation={quotation} open={lostOpen} onClose={() => setLostOpen(false)} />
      <FollowUpModal quotation={quotation} open={fuOpen} onClose={() => setFuOpen(false)} />
    </>
  );
}

/** Small list of follow-ups due, for dashboards. */
export function FollowUpsDueList({ rows = [], onOpen }) {
  return (
    <List
      size="small"
      dataSource={rows}
      locale={{ emptyText: "No follow-ups due" }}
      renderItem={(q) => (
        <List.Item onClick={() => onOpen?.(q)} style={{ cursor: "pointer" }}>
          <List.Item.Meta
            title={`${q.reference_number} · ${q.customerName || ""}`}
            description={<NextFollowUp date={q.nextFollowUp} status={q.status} />}
          />
        </List.Item>
      )}
    />
  );
}

/** Status bar for the quotation page: where it stands, what to do next, and its follow-ups. */
export function QuotationPipelineBar({ quotation, canEdit, canConvert, onConvert, onEdit, onDuplicate, onRecreate }) {
  const [showLog, setShowLog] = useState(false);
  if (!quotation) return null;
  const status = quotation.status || "DRAFT";
  const orders = Array.isArray(quotation.orders) ? quotation.orders : [];
  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "12px auto 0",
        padding: "12px 16px",
        background: "#fff",
        border: "1px solid #f0f0f0",
        borderRadius: 10,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
        <Space wrap size={[20, 8]} align="center">
          <QuotationStatusTag status={status} lostReason={quotation.lostReason} />
          <span>
            <Text type="secondary">Valid till </Text>
            <ValidTill date={quotation.validTill} status={status} />
          </span>
          {quotation.sentAt && (
            <span>
              <Text type="secondary">Sent </Text>
              {fmt(quotation.sentAt)}
            </span>
          )}
          {["DRAFT", "SENT", "NEGOTIATION"].includes(status) && (
            <span>
              <Text type="secondary">Next follow-up </Text>
              <NextFollowUp date={quotation.nextFollowUp} status={status} />
            </span>
          )}
          {status === "LOST" && quotation.lostReason && (
            <Text type="danger">
              Lost: {quotation.lostReason}
              {quotation.lostNote ? ` — ${quotation.lostNote}` : ""}
            </Text>
          )}
          {orders.length > 0 && (
            <span>
              <Text type="secondary">Order{orders.length > 1 ? "s" : ""} </Text>
              {orders.map((o, i) => (
                <span key={o.id}>
                  {i > 0 && ", "}
                  <a href={`/order/${o.id}`}>#{o.orderNo}</a>
                  {o.status === "CANCELED" && <Text type="secondary"> (cancelled)</Text>}
                </span>
              ))}
            </span>
          )}
        </Space>
        <Space wrap size={8}>
          <QuotationStatusActions quotation={quotation} canEdit={canEdit} canConvert={canConvert} onConvert={onConvert} />
          {canEdit && onEdit && <Button onClick={onEdit}>Edit</Button>}
          {onDuplicate && <Button onClick={onDuplicate}>Duplicate</Button>}
          {onRecreate && <Button onClick={onRecreate}>Recreate quotation</Button>}
          <Button type="link" onClick={() => setShowLog((v) => !v)}>
            {showLog ? "Hide follow-ups" : "Follow-ups"}
          </Button>
        </Space>
      </div>
      {showLog && (
        <div style={{ marginTop: 16 }}>
          <FollowUpHistory quotationId={quotation.quotationId} />
        </div>
      )}
    </div>
  );
}
