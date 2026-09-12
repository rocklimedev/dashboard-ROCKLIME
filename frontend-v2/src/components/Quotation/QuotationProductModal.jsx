import React, { useMemo } from "react";
import {
  Modal,
  Table,
  Image,
  Spin,
  Empty,
  Typography,
  Card,
  Tag,
  Divider,
  Alert,
  Collapse,
} from "antd";
import {
  ExclamationCircleOutlined,
  HomeOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import { useGetQuotationByIdQuery } from "../../api/quotationApi";

const { Text, Title } = Typography;
const { Panel } = Collapse;

const safeParse = (data, fallback = []) => {
  if (Array.isArray(data)) return data;
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch {
    return fallback;
  }
};

const safeNum = (val, fallback = 0) => {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
};

const QuotationProductModal = ({ show, onHide, quotationId }) => {
  const {
    data: q = {},
    isLoading,
    isError,
  } = useGetQuotationByIdQuery(quotationId, {
    skip: !quotationId,
  });

  // Prefer PostgreSQL JSON products (has isOptionFor, floorId, etc.)
  const allItems = useMemo(() => {
    const products = safeParse(q.products, []);
    if (products.length > 0) return products;

    // Fallback to MongoDB items if needed
    return q.items || [];
  }, [q.products, q.items]);

  const floors = useMemo(() => safeParse(q.floors, []), [q.floors]);

  // Group items by floor → room
  const groupedItems = useMemo(() => {
    const map = {};

    allItems.forEach((item) => {
      const floorId = item.floorId || "unassigned";
      const floorName =
        floors.find((f) => f.floorId === floorId)?.floorName ||
        item.floorName ||
        "Unassigned Floor";

      const roomId = item.roomId || "unassigned";
      const roomName = item.roomName || "Unassigned Room";

      const floorKey = `${floorId}|${floorName}`;
      if (!map[floorKey]) {
        map[floorKey] = {
          floorId,
          floorName,
          itemsByRoom: {},
        };
      }

      const roomKey = `${roomId}|${roomName}`;
      if (!map[floorKey].itemsByRoom[roomKey]) {
        map[floorKey].itemsByRoom[roomKey] = {
          roomId,
          roomName,
          items: [],
        };
      }

      map[floorKey].itemsByRoom[roomKey].items.push(item);
    });

    // Sort floors by sortOrder if available, else by appearance
    return Object.values(map).sort((a, b) => {
      const fa = floors.find((f) => f.floorId === a.floorId);
      const fb = floors.find((f) => f.floorId === b.floorId);
      return (fa?.sortOrder ?? 999) - (fb?.sortOrder ?? 999);
    });
  }, [allItems, floors]);

  const hasItems = allItems.length > 0;

  // Financials from calculated object (backend-provided)
  const calculated = q.calculated || {};
  const subtotal = safeNum(calculated.subTotal);
  const extraDiscountAmount = safeNum(calculated.extraDiscountAmount);
  const extraDiscountType = q.extraDiscountType || "fixed";
  const shippingAmount = safeNum(calculated.shippingAmount);
  const gstAmount = safeNum(calculated.gstAmount);
  const roundOff = safeNum(calculated.roundOff);
  const finalAmount = safeNum(calculated.finalAmount);

  const optionalPotential = useMemo(() => {
    return allItems
      .filter((item) => !!item.isOptionFor)
      .reduce(
        (sum, item) => sum + safeNum(item.price) * safeNum(item.quantity, 1),
        0,
      );
  }, [allItems]);

  const commonColumns = [
    {
      title: "#",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Image",
      width: 90,
      align: "center",
      render: (_, record) => {
        const url = record.imageUrl;
        return url ? (
          <Image
            src={url}
            width={56}
            height={56}
            style={{ objectFit: "cover", borderRadius: 4 }}
            preview={{ mask: "View" }}
            fallback="https://via.placeholder.com/56?text=No+Img"
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              background: "#f5f5f5",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#aaa",
              fontSize: "0.75rem",
            }}
          >
            No Img
          </div>
        );
      },
    },
    {
      title: "Product",
      dataIndex: "name",
      render: (name, record) => (
        <div>
          <Text strong>{name || "Unnamed"}</Text>
          {record.productCode && (
            <Text type="secondary" style={{ marginLeft: 8, fontSize: "0.9em" }}>
              {record.productCode}
            </Text>
          )}
          {record.companyCode && record.companyCode !== record.productCode && (
            <Text
              type="secondary"
              style={{ marginLeft: 8, fontSize: "0.85em" }}
            >
              ({record.companyCode})
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Qty",
      width: 80,
      align: "center",
      dataIndex: "quantity",
      render: (val) => Number(val || 1),
    },
    {
      title: "Price",
      width: 110,
      align: "right",
      render: (_, r) => `₹${safeNum(r.price).toLocaleString("en-IN")}`,
    },
    {
      title: "Disc",
      width: 100,
      align: "center",
      render: (_, r) => {
        const d = safeNum(r.discount);
        if (d <= 0) return "—";
        return r.discountType === "percent"
          ? `${d}%`
          : `₹${d.toLocaleString("en-IN")}`;
      },
    },
    {
      title: "Total",
      width: 130,
      align: "right",
      render: (_, r) => (
        <Text strong>₹{safeNum(r.total).toLocaleString("en-IN")}</Text>
      ),
    },
  ];

  const tableSummary = () => (
    <>
      <Table.Summary.Row>
        <Table.Summary.Cell colSpan={6} align="right">
          <Text strong>Subtotal (Main items only)</Text>
        </Table.Summary.Cell>
        <Table.Summary.Cell align="right">
          <Text strong>₹{subtotal.toLocaleString("en-IN")}</Text>
        </Table.Summary.Cell>
      </Table.Summary.Row>

      {extraDiscountAmount > 0 && (
        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={6} align="right">
            <Text>
              Extra Discount{" "}
              {extraDiscountType === "percent" &&
                `(${safeNum(q.extraDiscount || extraDiscountAmount)}%)`}
            </Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell align="right">
            <Text type="danger">
              -₹{extraDiscountAmount.toLocaleString("en-IN")}
            </Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}

      {shippingAmount > 0 && (
        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={6} align="right">
            <Text>Shipping</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell align="right">
            <Text type="success">
              +₹{shippingAmount.toLocaleString("en-IN")}
            </Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}

      {gstAmount > 0 && (
        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={6} align="right">
            <Text>GST</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell align="right">
            <Text>₹{gstAmount.toLocaleString("en-IN")}</Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}

      {roundOff !== 0 && (
        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={6} align="right">
            <Text>Round Off</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell align="right">
            <Text type={roundOff >= 0 ? "success" : "danger"}>
              {roundOff >= 0 ? "+" : "-"}₹
              {Math.abs(roundOff).toLocaleString("en-IN")}
            </Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}

      <Table.Summary.Row style={{ background: "#f0f9ff" }}>
        <Table.Summary.Cell colSpan={6} align="right">
          <Text strong style={{ fontSize: "1.1em" }}>
            Final Amount
          </Text>
        </Table.Summary.Cell>
        <Table.Summary.Cell align="right">
          <Text strong style={{ fontSize: "1.4em", color: "#3f8600" }}>
            ₹{finalAmount.toLocaleString("en-IN")}
          </Text>
        </Table.Summary.Cell>
      </Table.Summary.Row>

      {optionalPotential > 0 && (
        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={7} align="center">
            <Divider plain>
              <Text type="secondary">
                Optional Items (not included in final amount)
              </Text>
            </Divider>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}
    </>
  );

  if (isLoading) {
    return (
      <Modal open={show} onCancel={onHide} footer={null} centered width={600}>
        <div style={{ textAlign: "center", padding: "100px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 24 }}>
            <Text type="secondary">Loading quotation details…</Text>
          </div>
        </div>
      </Modal>
    );
  }

  if (isError || !q.quotationId) {
    return (
      <Modal open={show} onCancel={onHide} footer={null} centered width={500}>
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <ExclamationCircleOutlined
            style={{ fontSize: 64, color: "#ff4d4f" }}
          />
          <Title level={4} style={{ margin: "24px 0 8px" }}>
            Failed to load quotation
          </Title>
          <Text type="secondary">Please try again or contact support.</Text>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={show}
      onCancel={onHide}
      footer={null}
      width={1200}
      centered
      title={
        <div>
          <Title level={4} style={{ margin: 0 }}>
            #{q.reference_number} {q.document_title}
          </Title>
          <Text type="secondary">
            {q.customer?.name || "Customer"} •{" "}
            {q.quotation_date
              ? new Date(q.quotation_date).toLocaleDateString("en-IN")
              : "—"}
          </Text>
        </div>
      }
    >
      <div style={{ padding: "16px 0" }}>
        {!hasItems ? (
          <Card>
            <Empty description="No products found in this quotation." />
          </Card>
        ) : (
          <>
            <Collapse defaultActiveKey={["main"]} bordered={false}>
              {groupedItems.map((floorGroup) => (
                <Panel
                  key={floorGroup.floorId}
                  header={
                    <span>
                      <HomeOutlined style={{ marginRight: 8 }} />
                      {floorGroup.floorName}
                      <Text type="secondary" style={{ marginLeft: 12 }}>
                        (
                        {Object.values(floorGroup.itemsByRoom).reduce(
                          (sum, r) => sum + r.items.length,
                          0,
                        )}{" "}
                        items)
                      </Text>
                    </span>
                  }
                >
                  {Object.values(floorGroup.itemsByRoom).map((roomGroup) => (
                    <div key={roomGroup.roomId} style={{ marginBottom: 24 }}>
                      <div style={{ marginBottom: 12 }}>
                        <ApartmentOutlined style={{ marginRight: 8 }} />
                        <Text strong>{roomGroup.roomName}</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          ({roomGroup.items.length} items)
                        </Text>
                      </div>

                      <Table
                        columns={commonColumns}
                        dataSource={roomGroup.items}
                        rowKey={(r, i) => r.productId || i}
                        pagination={false}
                        bordered
                        size="middle"
                        scroll={{ x: "max-content" }}
                        summary={
                          roomGroup.roomId === "unassigned"
                            ? tableSummary
                            : undefined
                        }
                      />

                      {roomGroup.roomId === "unassigned" &&
                        optionalPotential > 0 && (
                          <div
                            style={{
                              marginTop: 16,
                              padding: "12px 16px",
                              background: "#f9f9f9",
                              borderRadius: 4,
                            }}
                          >
                            <Text type="secondary">
                              Optional items potential (not included): ₹
                              {optionalPotential.toLocaleString("en-IN")}
                            </Text>
                          </div>
                        )}
                    </div>
                  ))}
                </Panel>
              ))}
            </Collapse>

            {/* Global Financial Summary (shown if no unassigned items or as fallback) */}
            {groupedItems.every((g) => g.floorId !== "unassigned") && (
              <Card title="Financial Summary" style={{ marginTop: 24 }}>
                <Table
                  columns={[
                    { title: "Description", dataIndex: "desc" },
                    { title: "Amount", dataIndex: "amount", align: "right" },
                  ]}
                  dataSource={[
                    {
                      desc: "Main Subtotal",
                      amount: `₹${subtotal.toLocaleString("en-IN")}`,
                    },
                    extraDiscountAmount > 0 && {
                      desc: `Extra Discount ${extraDiscountType === "percent" ? `(${safeNum(q.extraDiscount || extraDiscountAmount)}%)` : ""}`,
                      amount: (
                        <Text type="danger">
                          -₹{extraDiscountAmount.toLocaleString("en-IN")}
                        </Text>
                      ),
                    },
                    shippingAmount > 0 && {
                      desc: "Shipping",
                      amount: (
                        <Text type="success">
                          +₹{shippingAmount.toLocaleString("en-IN")}
                        </Text>
                      ),
                    },
                    gstAmount > 0 && {
                      desc: "GST",
                      amount: `₹${gstAmount.toLocaleString("en-IN")}`,
                    },
                    roundOff !== 0 && {
                      desc: "Round Off",
                      amount: (
                        <Text type={roundOff >= 0 ? "success" : "danger"}>
                          {roundOff >= 0 ? "+" : "-"}₹
                          {Math.abs(roundOff).toLocaleString("en-IN")}
                        </Text>
                      ),
                    },
                    {
                      desc: "Final Amount",
                      amount: (
                        <Text
                          strong
                          style={{ fontSize: "1.3em", color: "#3f8600" }}
                        >
                          ₹{finalAmount.toLocaleString("en-IN")}
                        </Text>
                      ),
                    },
                    optionalPotential > 0 && {
                      desc: "Potential from options (not included)",
                      amount: (
                        <Text type="secondary">
                          ₹{optionalPotential.toLocaleString("en-IN")}
                        </Text>
                      ),
                    },
                  ].filter(Boolean)}
                  pagination={false}
                  showHeader={false}
                  size="small"
                />
              </Card>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default React.memo(QuotationProductModal);
