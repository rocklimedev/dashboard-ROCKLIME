import { Link, useNavigate } from "react-router-dom";
import { Badge, Button, Card, Col, Empty, List, Row, Segmented, Skeleton, Tag, Typography } from "antd";
import { PhoneOutlined, CarOutlined, WalletOutlined, InboxOutlined, ClockCircleOutlined, WarningOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useState } from "react";
import { useGetMyDayQuery } from "../../api/dashboardApi";
import { useRoles } from "../../utils/useCan";

const { Text } = Typography;
const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const when = (d) => {
  if (!d) return "";
  const days = dayjs(d).startOf("day").diff(dayjs().startOf("day"), "day");
  return days < 0 ? `${-days}d overdue` : days === 0 ? "today" : days === 1 ? "tomorrow" : dayjs(d).format("D MMM");
};

function Panel({ title, icon, count, to, children, danger }) {
  return (
    <Card
      size="small"
      title={
        <span>
          {icon} {title}{" "}
          {count != null && <Badge count={count} showZero overflowCount={999} color={danger && count ? "#cf1322" : "#8c8c8c"} />}
        </span>
      }
      extra={to && <Link to={to}>See all</Link>}
      style={{ height: "100%" }}
      styles={{ body: { padding: "4px 12px 8px" } }}
    >
      {children}
    </Card>
  );
}

/** Home → "My day": what needs doing today, one click from each item. */
export default function MyDay() {
  const navigate = useNavigate();
  const roles = useRoles();
  const admin = roles.some((r) => ["SUPER_ADMIN", "ADMIN", "DEVELOPER"].includes(r));
  const [scope, setScope] = useState(admin ? "all" : "mine");
  const { data, isLoading } = useGetMyDayQuery(admin && scope === "all" ? "all" : undefined, { pollingInterval: 120000 });

  if (isLoading) return <Skeleton active paragraph={{ rows: 4 }} />;
  if (!data) return null;
  const c = data.counts || {};

  return (
    <div style={{ marginBottom: 24 }}>
      <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
        <div>
          <Text strong style={{ fontSize: 16 }}>
            My day
          </Text>
          <Text type="secondary"> · {dayjs().format("dddd, D MMM")}</Text>
        </div>
        {admin && (
          <Segmented
            size="small"
            value={scope}
            onChange={setScope}
            options={[
              { value: "all", label: "Everyone" },
              { value: "mine", label: "Only mine" },
            ]}
          />
        )}
      </div>
      <Row gutter={[12, 12]}>
        {data.followUps && (
          <Col xs={24} md={12} xl={8}>
            <Panel title="Follow-ups due" icon={<PhoneOutlined />} count={data.followUps.length} danger to="/quotations/list?tab=FOLLOWUP">
              <List
                size="small"
                dataSource={data.followUps}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No follow-ups due" /> }}
                renderItem={(q) => (
                  <List.Item
                    style={{ cursor: "pointer", padding: "6px 0" }}
                    onClick={() => navigate(`/quotation/${q.quotationId}`)}
                    actions={
                      q.customerPhone
                        ? [
                            <a key="call" href={`tel:${q.customerPhone}`} onClick={(e) => e.stopPropagation()}>
                              Call
                            </a>,
                          ]
                        : []
                    }
                  >
                    <List.Item.Meta
                      title={
                        <span>
                          {q.customerName || "Customer"} <Text type="secondary">· {inr(q.finalAmount)}</Text>
                        </span>
                      }
                      description={
                        <span>
                          {q.reference_number} · <Text type="danger">{when(q.nextFollowUp)}</Text>
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
              {data.noFollowUp > 0 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {data.noFollowUp} open quotation(s) have no follow-up date.
                </Text>
              )}
            </Panel>
          </Col>
        )}
        {data.toDispatch && (
          <Col xs={24} md={12} xl={8}>
            <Panel title="To dispatch" icon={<CarOutlined />} count={c.toDispatch} to="/orders/list?tab=TODISPATCH">
              {c.late > 0 && (
                <Button type="link" danger size="small" style={{ padding: 0 }} onClick={() => navigate("/orders/list?tab=LATE")}>
                  <WarningOutlined /> {c.late} late order(s)
                </Button>
              )}
              <List
                size="small"
                dataSource={data.toDispatch}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing waiting to go out" /> }}
                renderItem={(o) => {
                  const late = o.dueDate && dayjs(o.dueDate).isBefore(dayjs(), "day");
                  return (
                    <List.Item style={{ cursor: "pointer", padding: "6px 0" }} onClick={() => navigate(`/order/${o.id}`)}>
                      <List.Item.Meta
                        title={
                          <span>
                            #{o.orderNo} · {o.customerName || "Customer"} {o.priority === "high" && <Tag color="red">High</Tag>}
                          </span>
                        }
                        description={
                          <span>
                            {o.status.replace(/_/g, " ").toLowerCase()} ·{" "}
                            <Text type={late ? "danger" : undefined}>{o.dueDate ? `due ${when(o.dueDate)}` : "no due date"}</Text>
                          </span>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
              {c.awaitingDelivery > 0 && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {c.awaitingDelivery} dispatched order(s) waiting for delivery confirmation.
                </Text>
              )}
            </Panel>
          </Col>
        )}
        <Col xs={24} md={12} xl={8}>
          <Row gutter={[12, 12]}>
            {data.expiring && (
              <Col span={24}>
                <Panel title="Quotations expiring" icon={<ClockCircleOutlined />} count={data.expiring.length} to="/quotations/list?tab=OPEN">
                  <List
                    size="small"
                    dataSource={data.expiring.slice(0, 3)}
                    locale={{ emptyText: "None in the next 3 days" }}
                    renderItem={(q) => (
                      <List.Item style={{ cursor: "pointer", padding: "6px 0" }} onClick={() => navigate(`/quotation/${q.quotationId}`)}>
                        <Text>
                          {q.customerName} · {inr(q.finalAmount)} <Text type="warning">· {when(q.validTill)}</Text>
                        </Text>
                      </List.Item>
                    )}
                  />
                </Panel>
              </Col>
            )}
            {data.money && (
              <Col span={24}>
                <Panel title="Money due" icon={<WalletOutlined />} to="/accounts">
                  <div style={{ padding: "6px 0" }}>
                    <Text strong style={{ fontSize: 18 }}>
                      {inr(data.money.due)}
                    </Text>
                    {data.money.over30 > 0 && (
                      <div>
                        <Text type="danger">
                          {inr(data.money.over30)} over 30 days · {data.money.customersOver30} customer(s)
                        </Text>
                      </div>
                    )}
                  </div>
                </Panel>
              </Col>
            )}
            {data.crmFollowUps && (
              <Col span={24}>
                <Panel title="CRM follow-ups" icon={<PhoneOutlined />} to="/crm/follow-ups">
                  {data.crmFollowUps.map((t) => (
                    <div key={t.id} style={{ padding: "4px 0", cursor: "pointer" }} onClick={() => navigate("/crm/follow-ups")}>
                      {t.title} · {t.contactName || t.dealTitle} <Text type="secondary">· {when(t.dueDate)}</Text>
                    </div>
                  ))}
                  {!data.crmFollowUps.length && <Text type="secondary">No calls or visits due.</Text>}
                </Panel>
              </Col>
            )}
            {(data.arriving || data.lowStockNoIncoming != null) && (
              <Col span={24}>
                <Panel title="Stock" icon={<InboxOutlined />} to="/inventory/list">
                  {(data.arriving || []).slice(0, 3).map((p) => (
                    <div key={p.id} style={{ padding: "4px 0", cursor: "pointer" }} onClick={() => navigate(`/po/${p.id}`)}>
                      PO {p.poNumber} · {p.vendorName} <Text type="secondary">· arriving {when(p.expectDeliveryDate)}</Text>
                    </div>
                  ))}
                  {data.lowStockNoIncoming > 0 && (
                    <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate("/inventory/list")}>
                      {data.lowStockNoIncoming} low-stock product(s) with nothing on order → view stock
                    </Button>
                  )}
                  {!(data.arriving || []).length && !data.lowStockNoIncoming && <Text type="secondary">Nothing arriving this week; stock is fine.</Text>}
                </Panel>
              </Col>
            )}
          </Row>
        </Col>
      </Row>
    </div>
  );
}
