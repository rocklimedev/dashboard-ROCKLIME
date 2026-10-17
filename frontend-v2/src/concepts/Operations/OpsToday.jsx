import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Col, Empty, List, Row, Skeleton, Space, Tag, Typography } from "antd";
import {
  CarOutlined,
  InboxOutlined,
  EditOutlined,
  AuditOutlined,
  ReloadOutlined,
  WarningOutlined,
  FieldTimeOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useGetOpsBoardQuery } from "../../api/stockApi";
import useCan from "../../utils/useCan";
import { MOVEMENT_LABELS, signed } from "../../components/Stock/stockLabels";
import "./operations.css";

const { Title, Text } = Typography;
const due = (d) => {
  if (!d) return "no due date";
  const n = dayjs(d).startOf("day").diff(dayjs().startOf("day"), "day");
  return n < 0 ? `${-n}d late` : n === 0 ? "due today" : n === 1 ? "due tomorrow" : `due ${dayjs(d).format("D MMM")}`;
};

function Stat({ label, value, to, tone, hint }) {
  const body = (
    <div className={`ops-stat ${tone ? `is-${tone}` : ""}`}>
      <div className="ops-stat__value">{value ?? "—"}</div>
      <div className="ops-stat__label">{label}</div>
      {hint && <div className="ops-stat__hint">{hint}</div>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function Panel({ title, icon, to, count, children }) {
  return (
    <Card
      size="small"
      className="ops-panel"
      title={
        <Space size={6}>
          {icon}
          <span>{title}</span>
          {count != null && <Tag style={{ marginLeft: 2 }}>{count}</Tag>}
        </Space>
      }
      extra={to && <Link to={to}>See all</Link>}
    >
      {children}
    </Card>
  );
}

/** Operations → Today: what the godown has to do, with one click to each job. */
export default function OpsToday() {
  const navigate = useNavigate();
  const can = useCan();
  const { data, isLoading } = useGetOpsBoardQuery(undefined, { pollingInterval: 60000 });
  const c = data?.counts || {};

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="ops-head">
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Today in the godown
            </Title>
            <Text type="secondary">{dayjs().format("dddd, D MMMM")}</Text>
          </div>
          <Space wrap>
            {can("inventory", "edit") && (
              <Button type="primary" icon={<EditOutlined />} onClick={() => navigate("/operations/stock-entry")}>
                Stock entry
              </Button>
            )}
            {can("purchase_orders", "view") && (
              <Button icon={<InboxOutlined />} onClick={() => navigate("/operations/receive")}>
                Receive goods
              </Button>
            )}
            <Button icon={<AuditOutlined />} onClick={() => navigate("/inventory/list?tab=counts")}>
              Stock count
            </Button>
          </Space>
        </div>

        {isLoading ? (
          <Skeleton active />
        ) : (
          <>
            <div className="ops-stats">
              <Stat label="To dispatch" value={c.toDispatch} to="/orders/list?tab=TODISPATCH" hint={`${c.readyToPack || 0} ready · ${c.waitingForStock || 0} waiting`} />
              <Stat label="Late" value={c.late} tone={c.late ? "danger" : null} to="/orders/list?tab=LATE" />
              <Stat label="On the road" value={c.onRoad} to="/orders/list?tab=TRANSIT" />
              <Stat label="To receive" value={c.toReceive} to="/operations/receive" />
              <Stat label="Low stock" value={c.lowStock} tone={c.lowStock ? "warn" : null} to="/inventory/reorder" />
              <Stat label="Damaged" value={c.damagedPieces} hint={c.damagedProducts ? `${c.damagedProducts} products` : null} to="/inventory/list?filter=damaged" />
            </div>

            <Row gutter={[14, 14]}>
              <Col xs={24} lg={12}>
                <Panel title="Pack & dispatch" icon={<CarOutlined />} count={c.toDispatch} to="/orders/list?tab=TODISPATCH">
                  {data.toDispatch.length ? (
                    <List
                      size="small"
                      dataSource={data.toDispatch}
                      renderItem={(o) => (
                        <List.Item
                          className="ops-row"
                          onClick={() => navigate(`/order/${o.id}`)}
                          extra={
                            o.ready ? (
                              <Tag color="green" icon={<CheckCircleFilled />}>
                                Ready · {o.left} pcs
                              </Tag>
                            ) : (
                              <Tag color="orange">
                                {o.reserved}/{o.left} pcs in stock
                              </Tag>
                            )
                          }
                        >
                          <div>
                            <Text strong>#{o.orderNo}</Text> <Text>{o.customer || "—"}</Text>
                            <div>
                              <Text type={o.late ? "danger" : "secondary"} style={{ fontSize: 12 }}>
                                {due(o.dueDate)}
                                {o.priority === "high" ? " · high priority" : ""}
                                {o.status === "PARTIALLY_DISPATCHED" ? " · part sent" : ""}
                              </Text>
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing waiting to go out" />
                  )}
                </Panel>
              </Col>

              <Col xs={24} lg={12}>
                <Space direction="vertical" size={14} style={{ width: "100%" }}>
                  <Panel title="On the road" icon={<FieldTimeOutlined />} count={c.onRoad} to="/orders/list?tab=TRANSIT">
                    {data.onRoad.length ? (
                      <List
                        size="small"
                        dataSource={data.onRoad.slice(0, 6)}
                        renderItem={(d) => (
                          <List.Item className="ops-row" onClick={() => navigate(`/order/${d.orderId}`)} extra={<Text type="secondary">{d.totalQuantity} pcs</Text>}>
                            <div>
                              <Text strong>#{d.orderNo}</Text> <Text>{d.customer || "—"}</Text>
                              <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {[d.vehicleNo, d.driverName, dayjs(d.dispatchDate || d.createdAt).format("D MMM, h:mm a")].filter(Boolean).join(" · ")}
                                </Text>
                              </div>
                            </div>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing out for delivery" />
                    )}
                  </Panel>

                  <Panel title="Arriving from vendors" icon={<InboxOutlined />} count={c.toReceive} to="/operations/receive">
                    {data.toReceive.length ? (
                      <List
                        size="small"
                        dataSource={data.toReceive.slice(0, 6)}
                        renderItem={(p) => (
                          <List.Item
                            className="ops-row"
                            onClick={() => navigate(`/operations/receive?po=${p.id}`)}
                            extra={
                              <Button size="small" type="link">
                                Receive
                              </Button>
                            }
                          >
                            <div>
                              <Text strong>{p.poNumber}</Text> <Text>{p.vendor || "—"}</Text>
                              <div>
                                <Text type={p.late ? "danger" : "secondary"} style={{ fontSize: 12 }}>
                                  {p.expectDeliveryDate ? `expected ${dayjs(p.expectDeliveryDate).format("D MMM")}${p.late ? " (late)" : ""}` : "no date given"}
                                  {p.status === "partial_delivered" ? " · part received" : ""}
                                </Text>
                              </div>
                            </div>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No purchase orders on the way" />
                    )}
                  </Panel>
                </Space>
              </Col>

              <Col xs={24}>
                <Panel title="Latest stock movements" icon={<ReloadOutlined />} to="/inventory/list?tab=movements">
                  {data.recentMoves.length ? (
                    <List
                      size="small"
                      dataSource={data.recentMoves}
                      renderItem={(x) => {
                        const ch = x.onHandChange || x.damagedChange;
                        return (
                          <List.Item
                            extra={
                              <Text strong style={{ color: ch > 0 ? "#389e0d" : "#cf1322" }}>
                                {signed(ch)}
                                {x.damagedChange && !x.onHandChange ? " damaged" : ""}
                              </Text>
                            }
                          >
                            <div style={{ minWidth: 0 }}>
                              <Text>{x.product}</Text>
                              <div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {[MOVEMENT_LABELS[x.movement] || x.movement, x.refNo, x.reason, x.user, dayjs(x.createdAt).format("D MMM, h:mm a")]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </Text>
                              </div>
                            </div>
                          </List.Item>
                        );
                      }}
                    />
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No movements yet" />
                  )}
                </Panel>
              </Col>
            </Row>
            {c.late > 0 && (
              <Text type="danger" style={{ display: "block", marginTop: 12 }}>
                <WarningOutlined /> {c.late} order{c.late > 1 ? "s are" : " is"} past the due date.
              </Text>
            )}
          </>
        )}
      </div>
    </div>
  );
}
