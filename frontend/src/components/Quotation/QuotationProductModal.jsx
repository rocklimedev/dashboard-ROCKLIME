import React from "react";
import { Modal, Table, Image, Spin, Empty, Typography, Card } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useGetQuotationByIdQuery } from "../../api/quotationApi";
import { useMemo } from "react";

const { Text, Title } = Typography;

const safeParse = (data, fallback = []) => {
  if (Array.isArray(data)) return data;
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch {
    return fallback;
  }
};

const QuotationProductModal = ({ show, onHide, quotationId }) => {
  const {
    data: q = {},
    isLoading,
    isError,
  } = useGetQuotationByIdQuery(quotationId, {
    skip: !quotationId,
  });

  // Prefer items array if available, fallback to products
  const lineItems = useMemo(() => {
    const items = safeParse(q.items, []);
    const products = safeParse(q.products, []);
    return items.length > 0 ? items : products;
  }, [q.items, q.products]);

  const hasValidItems = lineItems.length > 0;

  // ── Financial values from API (preferred) or fallback ──
  const subtotal = Number(q.subtotal || 0);
  const extraDiscountAmount = Number(q.discountAmount || q.extraDiscount || 0);
  const extraDiscountType = q.extraDiscountType || "amount"; // percent / amount
  const shippingAmount = Number(q.shippingAmount || 0);

  const roundOff = Number(q.roundOff || 0);
  const finalAmount = Number(q.finalAmount || 0);

  // ── Calculate total product-level discount ──
  const totalProductDiscount = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const discount = Number(item.discount || 0);
      if (discount <= 0) return sum;

      const price = Number(item.price || item.sellingPrice || 0);
      const qty = Number(item.quantity || 1);

      let discountAmount = 0;
      if (item.discountType === "percent") {
        discountAmount = ((price * discount) / 100) * qty;
      } else {
        // fixed amount per unit
        discountAmount = discount * qty;
      }

      return sum + discountAmount;
    }, 0);
  }, [lineItems]);

  const columns = [
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
        const imageUrl = record.imageUrl || record.images?.[0];
        return imageUrl ? (
          <Image
            src={imageUrl}
            width={60}
            height={60}
            style={{ objectFit: "cover", borderRadius: 6 }}
            preview={{ mask: "View" }}
            fallback="https://via.placeholder.com/60?text=No+Image"
          />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              background: "#f5f5f5",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
              fontSize: "0.8rem",
            }}
          >
            No Image
          </div>
        );
      },
    },
    {
      title: "Product",
      dataIndex: "name",
      render: (name) => <Text strong>{name || "Unknown Product"}</Text>,
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
      width: 120,
      align: "right",
      render: (_, record) => {
        const price = Number(record.price || record.sellingPrice || 0);
        return <Text>₹{price.toFixed(2)}</Text>;
      },
    },
    {
      title: "Discount",
      width: 110,
      align: "center",
      render: (_, record) => {
        const discount = Number(record.discount || 0);
        const type = record.discountType || "percent";
        if (discount <= 0) return "—";
        return (
          <Text type="danger">
            {type === "percent" ? `${discount}%` : `₹${discount.toFixed(2)}`}
          </Text>
        );
      },
    },
    {
      title: "Total",
      width: 140,
      align: "right",
      render: (_, record) => {
        const total = Number(record.total || 0);
        return <Text strong>₹{total.toFixed(2)}</Text>;
      },
    },
  ];

  const tableSummary = () => (
    <>
      {/* Subtotal */}
      {subtotal > 0 && (
        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={6} align="right">
            <Text strong>Subtotal</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell align="right">
            <Text strong>₹{subtotal.toFixed(2)}</Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}

      {/* Total Product Discount (line-item discounts) */}
      {totalProductDiscount > 0 && (
        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={6} align="right">
            <Text>Product Discount</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell align="right">
            <Text type="danger">-₹{totalProductDiscount.toFixed(2)}</Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}

      {/* Extra Discount (quotation-level) */}
      {extraDiscountAmount > 0 && (
        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={6} align="right">
            <Text>
              Extra Discount{" "}
              {extraDiscountType === "percent"
                ? `(${q.extraDiscount || "?"}%)`
                : ""}
            </Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell align="right">
            <Text type="danger">-₹{extraDiscountAmount.toFixed(2)}</Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}

      {/* Shipping */}
      {shippingAmount > 0 && (
        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={6} align="right">
            <Text>Shipping</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell align="right">
            <Text type="success">+₹{shippingAmount.toFixed(2)}</Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}

      {/* Round Off */}
      {roundOff !== 0 && (
        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={6} align="right">
            <Text>Round Off</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell align="right">
            <Text type={roundOff >= 0 ? "success" : "danger"}>
              {roundOff >= 0 ? "+" : "-"}₹{Math.abs(roundOff).toFixed(2)}
            </Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}

      {/* Final Amount - Highlighted */}
      <Table.Summary.Row style={{ background: "#f0f9ff" }}>
        <Table.Summary.Cell colSpan={6} align="right">
          <Text strong style={{ fontSize: "1.1em" }}>
            Final Amount
          </Text>
        </Table.Summary.Cell>
        <Table.Summary.Cell align="right">
          <Text strong style={{ fontSize: "1.3em", color: "#3f8600" }}>
            ₹{finalAmount.toFixed(2)}
          </Text>
        </Table.Summary.Cell>
      </Table.Summary.Row>
    </>
  );

  if (isLoading) {
    return (
      <Modal open={show} onCancel={onHide} footer={null} centered width={600}>
        <div style={{ textAlign: "center", padding: "80px 0" }}>
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
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <ExclamationCircleOutlined
            style={{ fontSize: 64, color: "#ff4d4f" }}
          />
          <Title level={4} style={{ margin: "24px 0 8px" }}>
            Failed to load quotation
          </Title>
          <Text type="secondary">
            Please try again later or contact support.
          </Text>
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
        <Title level={4} style={{ margin: 0 }}>
          Quotation #{q.reference_number || q.quotationId} – Products
        </Title>
      }
    >
      <div style={{ padding: "16px 0" }}>
        {!hasValidItems ? (
          <Card>
            <Empty description="No products found in this quotation." />
          </Card>
        ) : (
          <Card bodyStyle={{ padding: 0 }}>
            <Table
              columns={columns}
              dataSource={lineItems}
              rowKey={(r, i) => r.productId || r._id || i}
              pagination={false}
              bordered
              size="middle"
              scroll={{ x: "max-content" }}
              summary={tableSummary}
            />
          </Card>
        )}
      </div>
    </Modal>
  );
};

export default React.memo(QuotationProductModal);
