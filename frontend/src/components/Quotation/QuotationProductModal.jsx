import React, { useMemo } from "react";
import { Modal, Table, Image, Spin, Empty, Typography } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useGetQuotationByIdQuery } from "../../api/quotationApi";

const { Text, Title } = Typography;

const safeParse = (str, fallback = []) => {
  if (Array.isArray(str)) return str;
  if (!str) return fallback;
  try {
    return JSON.parse(str);
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

  const products = useMemo(() => safeParse(q.products, []), [q.products]);
  const items = useMemo(
    () => (Array.isArray(q.items) ? q.items : []),
    [q.items]
  );

  const lineItems = items.length > 0 ? items : products;
  const hasValidItems = lineItems.length > 0;

  // === Summary Calculations ===
  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
  }, [lineItems]);

  const extraDiscount = Number(q.extraDiscount || 0);
  const extraDiscountAmount = Number(q.discountAmount || q.extraDiscount || 0);
  const shippingAmount = Number(q.shippingAmount || 0);
  const gstRate = Number(q.gst || 0);
  const roundOff = Number(q.roundOff || 0);
  const finalAmount = Number(q.finalAmount || 0);

  const taxableAmount = subtotal - extraDiscountAmount + shippingAmount;
  const gstAmount = gstRate > 0 ? (taxableAmount * gstRate) / 100 : 0;

  // === Breakdown Data for Proper Antd Table Rendering ===
  const summaryData = useMemo(() => {
    const rows = [];

    rows.push({
      key: "subtotal",
      label: <Text strong>Subtotal</Text>,
      amount: <Text strong>₹{subtotal.toFixed(2)}</Text>,
    });

    if (extraDiscount > 0) {
      rows.push({
        key: "extraDiscount",
        label: (
          <Text style={{ color: "#cf1322" }}>
            Extra Discount (
            {q.extraDiscountType === "percent"
              ? `${extraDiscount}%`
              : `₹${extraDiscount.toFixed(2)}`}
            )
          </Text>
        ),
        amount: (
          <Text style={{ color: "#cf1322" }}>
            -₹{extraDiscountAmount.toFixed(2)}
          </Text>
        ),
      });
    }

    if (shippingAmount > 0) {
      rows.push({
        key: "shipping",
        label: <Text style={{ color: "#3f8600" }}>Shipping</Text>,
        amount: (
          <Text style={{ color: "#3f8600" }}>
            +₹{shippingAmount.toFixed(2)}
          </Text>
        ),
      });
    }

    if (gstRate > 0) {
      rows.push({
        key: "gst",
        label: <Text style={{ color: "#3f8600" }}>GST ({gstRate}%)</Text>,
        amount: (
          <Text style={{ color: "#3f8600" }}>+₹{gstAmount.toFixed(2)}</Text>
        ),
      });
    }

    if (roundOff !== 0) {
      rows.push({
        key: "roundOff",
        label: <Text>Round Off</Text>,
        amount: (
          <Text style={{ color: roundOff >= 0 ? "#3f8600" : "#cf1322" }}>
            {roundOff >= 0 ? "+" : "-"}₹{Math.abs(roundOff).toFixed(2)}
          </Text>
        ),
      });
    }

    rows.push({
      key: "final",
      label: (
        <Text strong style={{ fontSize: "1.2em" }}>
          Final Amount
        </Text>
      ),
      amount: (
        <Text strong style={{ fontSize: "1.3em" }}>
          ₹{finalAmount.toFixed(2)}
        </Text>
      ),
    });

    return rows;
  }, [
    subtotal,
    extraDiscount,
    extraDiscountAmount,
    shippingAmount,
    gstRate,
    gstAmount,
    roundOff,
    finalAmount,
    q.extraDiscountType,
  ]);

  const summaryColumns = [
    {
      dataIndex: "label",
      key: "label",
      render: (label) => label,
    },
    {
      dataIndex: "amount",
      key: "amount",
      width: 180,
      align: "right",
      render: (amount) => amount,
    },
  ];

  if (isLoading) {
    return (
      <Modal open={show} onCancel={onHide} footer={null} centered width={800}>
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Loading quotation details…</Text>
          </div>
        </div>
      </Modal>
    );
  }

  if (isError || !q.quotationId) {
    return (
      <Modal open={show} onCancel={onHide} footer={null} centered width={600}>
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <ExclamationCircleOutlined
            style={{ fontSize: 48, color: "#ff4d4f" }}
          />
          <Title level={4} style={{ margin: "16px 0 8px" }}>
            Failed to load quotation
          </Title>
          <Text type="secondary">Please try again later.</Text>
        </div>
      </Modal>
    );
  }

  const columns = [
    {
      title: "#",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Image",
      width: 100,
      align: "center",
      render: (_, record) => {
        const imageUrl = record.imageUrl || record.images?.[0];
        return imageUrl ? (
          <Image
            src={imageUrl}
            width={60}
            height={60}
            style={{ objectFit: "contain", borderRadius: 6 }}
            preview
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
      render: (_, record) => Number(record.quantity || record.qty || 1),
    },
    {
      title: "Price",
      width: 120,
      align: "right",
      render: (_, record) => {
        const price = Number(record.price || record.sellingPrice || 0);
        return `₹${price.toFixed(2)}`;
      },
    },
    {
      title: "Discount",
      width: 120,
      align: "center",
      render: (_, record) => {
        const discount = Number(record.discount || 0);
        const type = record.discountType || "percent";
        if (discount <= 0) return "—";
        return type === "percent" ? `${discount}%` : `₹${discount.toFixed(2)}`;
      },
    },
    {
      title: "Tax %",
      width: 80,
      align: "center",
      render: () => "—",
    },
    {
      title: "Line Total",
      width: 140,
      align: "right",
      render: (_, record) => {
        const qty = Number(record.quantity || record.qty || 1);
        const price = Number(record.price || record.sellingPrice || 0);
        const discount = Number(record.discount || 0);
        const discountType = record.discountType || "percent";

        let discountAmount = 0;
        if (discount > 0) {
          discountAmount =
            discountType === "percent"
              ? (price * qty * discount) / 100
              : discount;
        }

        const lineSubtotal = price * qty - discountAmount;
        const savedTotal = Number(record.total);
        const displayTotal = savedTotal > 0 ? savedTotal : lineSubtotal;

        return <Text strong>₹{displayTotal.toFixed(2)}</Text>;
      },
    },
  ];

  return (
    <Modal
      open={show}
      onCancel={onHide}
      footer={null}
      width={1200}
      centered
      title={
        <Title level={4} style={{ margin: 0 }}>
          Quotation #{q.reference_number || q.quotationId} – Products & Pricing
        </Title>
      }
    >
      <div style={{ padding: "16px 0" }}>
        {!hasValidItems ? (
          <Empty description="No products found in this quotation." />
        ) : (
          <>
            {/* Products Table */}
            <Table
              columns={columns}
              dataSource={lineItems}
              rowKey={(record, idx) => record.productId || record._id || idx}
              pagination={false}
              bordered
              scroll={{ x: 900 }}
              style={{ marginBottom: 40 }}
            />

            {/* Final Calculations Summary - Now Properly Rendered with Antd Table */}
            <div style={{ maxWidth: 500, marginLeft: "auto" }}>
              <Table
                columns={summaryColumns}
                dataSource={summaryData}
                pagination={false}
                bordered
                showHeader={false}
                rowClassName={(record) =>
                  record.key === "final" ? "ant-table-row-final" : ""
                }
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default React.memo(QuotationProductModal);
