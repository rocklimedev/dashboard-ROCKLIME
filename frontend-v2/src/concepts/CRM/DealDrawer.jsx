import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  message,
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  Dropdown,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Skeleton,
  Space,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from "antd";
import {
  PhoneOutlined,
  WhatsAppOutlined,
  UserAddOutlined,
  FileAddOutlined,
  LinkOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CloudSyncOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  useAddDealNoteMutation,
  useAddDealTaskMutation,
  useBiginPushMutation,
  useDealCustomerMutation,
  useDeleteDealMutation,
  useDeleteDealTaskMutation,
  useGetCrmDealQuery,
  useGetCrmMetaQuery,
  useLinkDealQuotationMutation,
  useMoveDealMutation,
  useUpdateDealTaskMutation,
} from "../../api/crmApi";
import useCan from "../../utils/useCan";
import DealFormModal from "./DealFormModal";
import { ACTIVITY_LABEL, TAG_COLOR, dueText, isLate, lakh, waLink } from "./crmUtils";

const { Text, Title } = Typography;
const NOTE_KINDS = [
  { value: "note", label: "Note" },
  { value: "call", label: "Call" },
  { value: "visit", label: "Visit" },
  { value: "whatsapp", label: "WhatsApp" },
];

/** Ask for the lost reason (one click on a common one). */
export function LostReasonModal({ open, onCancel, onOk, reasons = [] }) {
  const [reason, setReason] = useState("");
  return (
    <Modal open={open} title="Why was the deal lost?" okText="Mark lost" okButtonProps={{ danger: true, disabled: !reason.trim() }} onCancel={onCancel} onOk={() => onOk(reason.trim())} destroyOnHidden afterClose={() => setReason("")}>
      <Space wrap size={6} style={{ marginBottom: 10 }}>
        {reasons.map((r) => (
          <Tag.CheckableTag key={r} checked={reason === r} onChange={() => setReason(r)}>
            {r}
          </Tag.CheckableTag>
        ))}
      </Space>
      <Input placeholder="Or write the reason" value={reason} onChange={(e) => setReason(e.target.value)} />
    </Modal>
  );
}

export default function DealDrawer({ id, open, onClose }) {
  const navigate = useNavigate();
  const can = useCan();
  const canEdit = can("crm", "edit");
  const { data, isFetching } = useGetCrmDealQuery(id, { skip: !id });
  const { data: meta } = useGetCrmMetaQuery();
  const [moveDeal] = useMoveDealMutation();
  const [addNote, { isLoading: noting }] = useAddDealNoteMutation();
  const [addTask, { isLoading: tasking }] = useAddDealTaskMutation();
  const [updateTask] = useUpdateDealTaskMutation();
  const [deleteTask] = useDeleteDealTaskMutation();
  const [makeCustomer, { isLoading: makingCustomer }] = useDealCustomerMutation();
  const [linkQuotation] = useLinkDealQuotationMutation();
  const [deleteDeal] = useDeleteDealMutation();
  const [push] = useBiginPushMutation();

  const [noteKind, setNoteKind] = useState("note");
  const [note, setNote] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState(dayjs().add(1, "day"));
  const [lostOpen, setLostOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const deal = data?.deal;
  const stages = meta?.stages || [];
  const err = (e, fallback) => message.error(e?.data?.message || fallback);

  const toStage = async (stage, lostReason) => {
    if (stage === "lost" && !lostReason) return setLostOpen(true);
    try {
      await moveDeal({ id, stage, lostReason }).unwrap();
      message.success(`Moved to ${stages.find((s) => s.id === stage)?.label}`);
    } catch (e) {
      err(e, "Could not move the deal");
    }
  };

  const saveNote = async () => {
    if (!note.trim()) return;
    try {
      await addNote({ id, text: note, kind: noteKind }).unwrap();
      setNote("");
    } catch (e) {
      err(e, "Could not save");
    }
  };
  const saveTask = async (title = taskTitle, due = taskDue) => {
    if (!title.trim()) return message.info("Write the follow-up first");
    try {
      await addTask({ id, title, dueDate: due ? due.format("YYYY-MM-DD") : null }).unwrap();
      setTaskTitle("");
    } catch (e) {
      err(e, "Could not add the follow-up");
    }
  };

  const ensureCustomer = async () => {
    const r = await makeCustomer(id).unwrap();
    if (r.created) message.success("Customer created");
    return r.customerId;
  };
  const startQuotation = async () => {
    try {
      const customerId = await ensureCustomer();
      navigate(`/cart/quotation?customer=${customerId}&deal=${id}`);
    } catch (e) {
      err(e, "Could not make the customer");
    }
  };

  const menu = {
    items: [
      { key: "edit", icon: <EditOutlined />, label: "Edit details", disabled: !canEdit },
      { key: "push", icon: <CloudSyncOutlined />, label: "Send to Bigin now" },
      { type: "divider" },
      { key: "delete", icon: <DeleteOutlined />, label: "Delete deal", danger: true, disabled: !can("crm", "delete") },
    ],
    onClick: ({ key }) => {
      if (key === "edit") setEditOpen(true);
      if (key === "push")
        push(id)
          .unwrap()
          .then((r) => message.success(r?.skipped ? "Bigin is not connected" : "Sent to Bigin"))
          .catch((e) => err(e, "Bigin refused the deal"));
      if (key === "delete")
        Modal.confirm({
          title: "Delete this deal?",
          content: deal?.biginId ? "It is deleted in Zoho Bigin too." : "Its notes and follow-ups are deleted too.",
          okText: "Delete",
          okButtonProps: { danger: true },
          onOk: async () => {
            await deleteDeal(id).unwrap();
            message.success("Deal deleted");
            onClose();
          },
        });
    },
  };

  const openTasks = (data?.tasks || []).filter((t) => !t.done);
  const doneTasks = (data?.tasks || []).filter((t) => t.done);
  const stageIdx = stages.findIndex((s) => s.id === deal?.stage);

  return (
    <Drawer open={open} onClose={onClose} width={620} className="crm-drawer" title={null} closable={false} destroyOnHidden>
      {!deal ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <div className="crm-drawer__body">
          <div className="crm-drawer__head">
            <div style={{ minWidth: 0 }}>
              <Title level={4} style={{ margin: 0 }} ellipsis={{ tooltip: deal.title }}>
                {deal.title}
              </Title>
              <Space size={6} wrap style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 16 }}>
                  {deal.amount ? lakh(deal.amount) : "No value yet"}
                </Text>
                {deal.tag && <Tag color={TAG_COLOR[deal.tag]}>{deal.tag}</Tag>}
                {deal.source && <Tag>{deal.source}</Tag>}
                {deal.customerType && <Tag>{deal.customerType}</Tag>}
                <BiginBadge deal={deal} />
              </Space>
            </div>
            <Space size={4}>
              <Dropdown menu={menu} trigger={["click"]}>
                <Button icon={<MoreOutlined />} />
              </Dropdown>
              <Button onClick={onClose}>Close</Button>
            </Space>
          </div>

          {/* stage steps: one click moves the deal */}
          <div className="crm-steps" role="list">
            {stages
              .filter((s) => !s.closed)
              .map((s, i) => (
                <button
                  key={s.id}
                  role="listitem"
                  className={`crm-step ${s.id === deal.stage ? "is-current" : ""} ${i < stageIdx && !["nurture", "lost"].includes(deal.stage) ? "is-done" : ""}`}
                  style={{ "--c": s.color }}
                  disabled={!canEdit}
                  onClick={() => toStage(s.id)}
                  title={s.label}
                >
                  {s.short}
                </button>
              ))}
          </div>
          <Space size={6} style={{ marginBottom: 12 }} wrap>
            {deal.stage === "lost" ? (
              <Tag color="red">Lost · {deal.lostReason}</Tag>
            ) : deal.stage === "nurture" ? (
              <Tag>Nurture later</Tag>
            ) : null}
            <Button size="small" disabled={!canEdit || deal.stage === "nurture"} onClick={() => toStage("nurture")}>
              Nurture later
            </Button>
            <Button size="small" danger disabled={!canEdit || deal.stage === "lost"} onClick={() => toStage("lost")}>
              Mark lost
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {deal.daysInStage}d in this stage
            </Text>
          </Space>

          {/* contact + one-click actions */}
          <div className="crm-contact">
            <div>
              <div className="crm-contact__name">
                <UserOutlined /> {deal.contactName || "—"}
                {deal.company ? <Text type="secondary"> · {deal.company}</Text> : null}
              </div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {[deal.phone, deal.email, deal.city].filter(Boolean).join(" · ") || "No contact details"}
                {deal.ownerName ? ` · owner ${deal.ownerName}` : ""}
              </Text>
            </div>
            <Space size={6} wrap>
              {deal.phone && <Button icon={<PhoneOutlined />} href={`tel:${deal.phone}`} />}
              {deal.phone && <Button icon={<WhatsAppOutlined />} href={waLink(deal.phone, `Namaste ${deal.contactName || ""}, `)} target="_blank" rel="noreferrer" style={{ color: "#25d366" }} />}
            </Space>
          </div>

          <div className="crm-links">
            {deal.customerId ? (
              <Link to={`/customer/${deal.customerId}`} className="crm-link">
                <CheckCircleFilled style={{ color: "#389e0d" }} /> Customer: <b>{deal.customerName || "open"}</b>
              </Link>
            ) : (
              <Button icon={<UserAddOutlined />} loading={makingCustomer} disabled={!canEdit} onClick={() => ensureCustomer().catch((e) => err(e, "Could not make the customer"))}>
                Make customer
              </Button>
            )}
            {deal.quotationId ? (
              <Link to={`/quotation/${deal.quotationId}`} className="crm-link">
                <CheckCircleFilled style={{ color: "#389e0d" }} /> Quotation <b>{deal.quotationRef || "open"}</b>
              </Link>
            ) : (
              <Button type="primary" icon={<FileAddOutlined />} disabled={!can("quotations", "write")} onClick={startQuotation}>
                Make quotation
              </Button>
            )}
            {deal.orderId && (
              <Link to={`/order/${deal.orderId}`} className="crm-link">
                <CheckCircleFilled style={{ color: "#389e0d" }} /> Order <b>{deal.orderNo || "open"}</b>
              </Link>
            )}
            {!deal.quotationId && data.quotations?.length > 0 && (
              <Select
                size="middle"
                placeholder={
                  <span>
                    <LinkOutlined /> Link a quotation
                  </span>
                }
                style={{ minWidth: 200 }}
                disabled={!canEdit}
                options={data.quotations.map((qt) => ({ value: qt.quotationId, label: `${qt.ref || qt.title} · ${lakh(qt.finalAmount)} · ${qt.status}` }))}
                onChange={(quotationId) =>
                  linkQuotation({ id, quotationId })
                    .unwrap()
                    .then(() => message.success("Quotation linked — the deal follows it from now on"))
                    .catch((e) => err(e, "Could not link"))
                }
              />
            )}
          </div>

          {deal.description && <div className="crm-req">{deal.description}</div>}

          {/* follow-ups */}
          <div className="crm-section">
            <div className="crm-section__title">
              <CalendarOutlined /> Follow-ups {openTasks.length ? <Tag>{openTasks.length}</Tag> : null}
            </div>
            {canEdit && (
              <Space.Compact style={{ width: "100%", marginBottom: 6 }}>
                <Input placeholder="Call back about the sample tiles" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} onPressEnter={() => saveTask()} />
                <DatePicker value={taskDue} onChange={setTaskDue} format="D MMM" style={{ width: 120 }} allowClear={false} />
                <Button type="primary" loading={tasking} onClick={() => saveTask()}>
                  Add
                </Button>
              </Space.Compact>
            )}
            {canEdit && (
              <Space size={4} wrap style={{ marginBottom: 8 }}>
                {[
                  ["Call tomorrow", 1],
                  ["Send catalogue today", 0],
                  ["Showroom visit in 3 days", 3],
                  ["Follow up next week", 7],
                ].map(([t, d]) => (
                  <Tag.CheckableTag key={t} checked={false} onChange={() => saveTask(t.replace(/ (tomorrow|today|in 3 days|next week)$/, ""), dayjs().add(d, "day"))}>
                    + {t}
                  </Tag.CheckableTag>
                ))}
              </Space>
            )}
            {openTasks.map((t) => (
              <div key={t.id} className="crm-task">
                <Checkbox checked={false} disabled={!canEdit} onChange={() => updateTask({ taskId: t.id, done: true }).unwrap().catch((e) => err(e, "Could not update"))}>
                  {t.title}
                </Checkbox>
                <Space size={4}>
                  {t.dueDate && <Tag color={isLate(t.dueDate) ? "red" : dueText(t.dueDate) === "today" ? "orange" : "default"}>{dueText(t.dueDate)}</Tag>}
                  {canEdit && (
                    <Popconfirm title="Delete this follow-up?" onConfirm={() => deleteTask(t.id)}>
                      <Button size="small" type="text" icon={<DeleteOutlined />} />
                    </Popconfirm>
                  )}
                </Space>
              </div>
            ))}
            {!openTasks.length && <Text type="secondary">Nothing planned. Add the next step so the deal does not go cold.</Text>}
            {doneTasks.length > 0 && (
              <Text type="secondary" style={{ display: "block", marginTop: 6, fontSize: 12 }}>
                {doneTasks.length} done
              </Text>
            )}
          </div>

          {/* timeline */}
          <div className="crm-section">
            <div className="crm-section__title">Timeline</div>
            {canEdit && (
              <>
                <Segmented size="small" options={NOTE_KINDS} value={noteKind} onChange={setNoteKind} style={{ marginBottom: 6 }} />
                <Input.TextArea
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  placeholder={noteKind === "call" ? "What did they say on the call?" : noteKind === "visit" ? "What did they like at the visit?" : "Write a note"}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onPressEnter={(e) => {
                    if (e.ctrlKey || e.metaKey) saveNote();
                  }}
                />
                <div style={{ textAlign: "right", margin: "6px 0 12px" }}>
                  <Button type="primary" size="small" loading={noting} disabled={!note.trim()} onClick={saveNote}>
                    Save {NOTE_KINDS.find((k) => k.value === noteKind)?.label.toLowerCase()}
                  </Button>
                </div>
              </>
            )}
            {data.activity?.length ? (
              <Timeline
                items={data.activity.map((a) => ({
                  color: a.kind === "stage" ? "blue" : a.kind === "bigin" ? "purple" : ["call", "visit", "whatsapp"].includes(a.kind) ? "green" : "gray",
                  children: (
                    <div className="crm-act">
                      <div className="crm-act__meta">
                        <Tag bordered={false}>{ACTIVITY_LABEL[a.kind] || a.kind}</Tag>
                        {a.userName || (a.kind === "bigin" ? "Zoho Bigin" : "ERP")} · {dayjs(a.createdAt).format("D MMM, h:mm a")}
                      </div>
                      <div className="crm-act__text">{a.text}</div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No activity yet" />
            )}
          </div>

          {(data.orders?.length > 0 || data.otherDeals?.length > 0) && (
            <div className="crm-section">
              <div className="crm-section__title">Same customer</div>
              {data.orders.map((o) => (
                <div key={o.id} className="crm-task">
                  <Link to={`/order/${o.id}`}>Order {o.orderNo}</Link>
                  <Space size={4}>
                    <Tag>{o.status}</Tag>
                    <Text>{lakh(o.finalAmount)}</Text>
                  </Space>
                </div>
              ))}
              {data.otherDeals.map((d) => (
                <div key={d.id} className="crm-task">
                  <span>{d.title}</span>
                  <Space size={4}>
                    <Tag>{stages.find((s) => s.id === d.stage)?.short || d.stage}</Tag>
                    <Text>{lakh(d.amount)}</Text>
                  </Space>
                </div>
              ))}
            </div>
          )}
          {isFetching && <Text type="secondary" style={{ fontSize: 12 }}>Updating…</Text>}
        </div>
      )}
      <LostReasonModal
        open={lostOpen}
        reasons={meta?.lostReasons}
        onCancel={() => setLostOpen(false)}
        onOk={(r) => {
          setLostOpen(false);
          toStage("lost", r);
        }}
      />
      <DealFormModal open={editOpen} deal={deal} onClose={() => setEditOpen(false)} />
    </Drawer>
  );
}

export function BiginBadge({ deal, compact = false }) {
  if (deal.biginError)
    return (
      <Tooltip title={`Bigin: ${deal.biginError}`}>
        <Tag color="warning" icon={<ExclamationCircleFilled />}>
          {compact ? "" : "Bigin error"}
        </Tag>
      </Tooltip>
    );
  if (deal.biginId)
    return (
      <Tooltip title={`In Zoho Bigin${deal.biginSyncedAt ? ` · synced ${dayjs(deal.biginSyncedAt).format("D MMM, h:mm a")}` : ""}`}>
        <Tag color="purple" icon={<CloudSyncOutlined />}>
          {compact ? "" : "Bigin"}
        </Tag>
      </Tooltip>
    );
  return null;
}
