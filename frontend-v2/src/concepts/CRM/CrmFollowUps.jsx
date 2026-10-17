import { useState } from "react";
import { message, Button, Empty, List, Segmented, Space, Tag, Typography } from "antd";
import { CheckOutlined, PhoneOutlined, WhatsAppOutlined, ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useGetCrmMetaQuery, useGetCrmTasksQuery, useUpdateDealTaskMutation } from "../../api/crmApi";
import DealDrawer from "./DealDrawer";
import { dueText, isLate, lakh, waLink } from "./crmUtils";
import "./crm.css";

const { Title, Text } = Typography;

/** CRM → Follow-ups: today's calls and visits, one click to do or move them. */
export default function CrmFollowUps() {
  const [scope, setScope] = useState("mine");
  const [when, setWhen] = useState("due");
  const { data = [], isFetching } = useGetCrmTasksQuery({ scope, when }, { pollingInterval: 120000 });
  const { data: meta } = useGetCrmMetaQuery();
  const [updateTask] = useUpdateDealTaskMutation();
  const [openId, setOpenId] = useState(null);

  const done = (t) =>
    updateTask({ taskId: t.id, done: true })
      .unwrap()
      .then(() => message.success("Done"))
      .catch(() => message.error("Could not update"));
  const later = (t, days) =>
    updateTask({ taskId: t.id, dueDate: dayjs().add(days, "day").format("YYYY-MM-DD") })
      .unwrap()
      .then(() => message.success(`Moved to ${dayjs().add(days, "day").format("D MMM")}`));

  return (
    <div className="page-wrapper crm-page">
      <div className="crm-head">
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Follow-ups
          </Title>
          <Text type="secondary">Who to call or meet. Tick when done, or push it to another day.</Text>
        </div>
        <Space wrap>
          <Segmented value={scope} onChange={setScope} options={[{ label: "Mine", value: "mine" }, { label: "Everyone", value: "all" }]} />
          <Segmented
            value={when}
            onChange={setWhen}
            options={[
              { label: "Due now", value: "due" },
              { label: "Next 7 days", value: "week" },
              { label: "All open", value: "all" },
            ]}
          />
        </Space>
      </div>
      <List
        className="crm-fu"
        loading={isFetching}
        dataSource={data}
        locale={{ emptyText: <Empty description={when === "due" ? "Nothing due — all caught up" : "No follow-ups"} /> }}
        renderItem={(t) => {
          const stage = meta?.stages.find((s) => s.id === t.stage);
          return (
            <List.Item
              actions={[
                t.phone && <Button key="c" icon={<PhoneOutlined />} href={`tel:${t.phone}`} />,
                t.phone && <Button key="w" icon={<WhatsAppOutlined />} style={{ color: "#25d366" }} href={waLink(t.phone, `Namaste ${t.contactName || ""}, `)} target="_blank" rel="noreferrer" />,
                <Button key="l1" onClick={() => later(t, 1)}>
                  Tomorrow
                </Button>,
                <Button key="d" type="primary" icon={<CheckOutlined />} onClick={() => done(t)}>
                  Done
                </Button>,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                title={
                  <Space size={6} wrap>
                    <a onClick={() => setOpenId(t.dealId)}>{t.title}</a>
                    {t.dueDate && (
                      <Tag color={isLate(t.dueDate) ? "red" : dueText(t.dueDate) === "today" ? "orange" : "default"} icon={<ClockCircleOutlined />}>
                        {dueText(t.dueDate)}
                      </Tag>
                    )}
                  </Space>
                }
                description={
                  <span>
                    {t.dealTitle}
                    {t.contactName ? ` · ${t.contactName}` : ""}
                    {t.amount ? ` · ${lakh(t.amount)}` : ""} {stage && <Tag color={stage.color}>{stage.short}</Tag>}
                    {scope === "all" && t.assignedName ? <Text type="secondary"> · {t.assignedName}</Text> : null}
                  </span>
                }
              />
            </List.Item>
          );
        }}
      />
      <DealDrawer id={openId} open={!!openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
