import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Input, Tag, Table } from "antd";
import { EditOutlined } from "@ant-design/icons";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value) || 0);

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */
const OrderTotal = React.memo(
  ({
    shipping = 0,
    tax = 0,
    roundOff = 0,
    subTotal = 0,
    discount = 0, // ← total of **per-item** discounts
    extraDiscount = 0, // ← amount already calculated in the form
    gst,
    gstAmount,
    finalTotal: finalTotalProp,
    onShippingChange,
  }) => {
    /* --------------------------- Editable Shipping -------------------------- */
    const [isEditingShipping, setIsEditingShipping] = useState(false);
    const [shippingInput, setShippingInput] = useState(shipping.toString());

    useEffect(() => setShippingInput(shipping.toString()), [shipping]);

    const handleShippingChange = (e) => {
      const val = e.target.value;
      if (/^\d*\.?\d*$/.test(val)) setShippingInput(val);
    };

    const handleShippingSubmit = () => {
      const newVal = parseFloat(shippingInput) || 0;
      onShippingChange?.(newVal);
      setIsEditingShipping(false);
    };

    const handleKeyPress = (e) => e.key === "Enter" && handleShippingSubmit();

    /* --------------------------- Safe Numbers --------------------------- */
    const safe = (n) => (typeof n === "number" && !isNaN(n) ? n : 0);

    const safeSubTotal = safe(subTotal);
    const safeDiscount = safe(discount);
    const safeTax = safe(tax);
    const safeExtraDiscount = safe(extraDiscount);
    const safeShipping = safe(shipping);
    const safeRoundOff = safe(roundOff);
    const safeGst = safe(gst);
    const safeGstAmount = safe(gstAmount);
    /* --------------------------- Calculations --------------------------- */
    const calculations = useMemo(() => {
      const taxable = safeSubTotal - safeDiscount; // 1
      const afterTax = taxable + safeTax; // 2
      const afterExtra = afterTax - safeExtraDiscount; // 3
      const afterShipping = afterExtra + safeShipping; // 4
      const afterGst = afterShipping + safeGstAmount; // 5
      const beforeRound = afterGst; // 6
      const calculated = beforeRound + safeRoundOff; // 7

      const final =
        finalTotalProp != null && !isNaN(finalTotalProp)
          ? finalTotalProp
          : Math.round(calculated); // fallback to nearest rupee

      return {
        taxable,
        afterTax,
        afterExtra,
        afterShipping,
        afterGst,
        beforeRound,
        calculated,
        final,
      };
    }, [
      safeSubTotal,
      safeDiscount,
      safeTax,
      safeExtraDiscount,
      safeGstAmount,
      safeShipping,
      safeRoundOff,
      finalTotalProp,
    ]);

    /* --------------------------- Table Columns --------------------------- */
    const columns = [
      {
        title: "Description",
        dataIndex: "label",
        key: "label",
        render: (text, record) =>
          record.isTotal ? <strong>{text}</strong> : text,
      },
      {
        title: "Amount",
        dataIndex: "amount",
        key: "amount",
        align: "right",
        render: (amount, record) => {
          const formatted = formatCurrency(amount);
          if (record.isNegative)
            return <span className="text-danger">-{formatted}</span>;
          if (record.isPositive)
            return <span className="text-success">+{formatted}</span>;
          if (record.isTotal)
            return (
              <strong style={{ fontSize: "18px", color: "#e31e24" }}>
                {formatted}
              </strong>
            );
          return formatted;
        },
      },
    ];

    const dataSource = [
      { key: "subtotal", label: "Sub Total", amount: safeSubTotal },
      {
        key: "item-discount",
        label: "Discount (Items)",
        amount: safeDiscount,
        isNegative: true,
      },

      {
        key: "after-tax",
        label: "Final Amount",
        amount: calculations.afterTax,
      },
      ...(safeExtraDiscount > 0
        ? [
            {
              key: "extra-discount",
              label: "Extra Discount",
              amount: safeExtraDiscount,
              isNegative: true,
            },
          ]
        : []),
      {
        key: "shipping",
        label: "Shipping",
        amount: safeShipping,
        isPositive: true,
        renderEdit: true,
      },
      ...(safeGst > 0
        ? [
            {
              key: "gst",
              label: `GST (${safeGst}%)`,
              amount: safeGstAmount,
              isPositive: true,
            },
          ]
        : []),
      {
        key: "before-round",
        label: "Before Round-off",
        amount: calculations.afterGst,
      },
      ...(safeRoundOff !== 0
        ? [
            {
              key: "roundoff",
              label: safeRoundOff > 0 ? "Round-off (+)" : "Round-off (-)",
              amount: Math.abs(safeRoundOff),
              isPositive: safeRoundOff > 0,
              isNegative: safeRoundOff < 0,
            },
          ]
        : []),
      {
        key: "final",
        label: "Grand Total",
        amount: calculations.final,
        isTotal: true,
      },
    ];

    /* --------------------------- Render --------------------------- */
    return (
      <div className="block-section order-method bg-light m-0">
        <div className="order-total">
          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            bordered={false}
            size="small"
            rowClassName={(record) =>
              record.isTotal ? "ant-table-row-total" : ""
            }
            // ----- Inline editing for Shipping -----
            onRow={(record) => ({
              onClick: () => {
                if (record.renderEdit) setIsEditingShipping(true);
              },
            })}
          />

          {/* Hidden editable input – shown only when editing */}
          {isEditingShipping && (
            <div
              style={{ position: "absolute", right: 16, top: 16, zIndex: 10 }}
            >
              <Input
                value={shippingInput}
                onChange={handleShippingChange}
                onBlur={handleShippingSubmit}
                onKeyPress={handleKeyPress}
                style={{
                  width: 100,
                  fontSize: 14,
                  background: "transparent",
                }}
                autoFocus
              />
            </div>
          )}

          {/* Old Tag version (kept for fallback) */}
          {!isEditingShipping && safeShipping > 0 && (
            <Tag
              color="blue"
              style={{
                cursor: "pointer",
                fontSize: "14px",
                padding: "4px 8px",
                position: "absolute",
                right: 16,
                top: 16,
              }}
              onClick={() => setIsEditingShipping(true)}
            >
              {formatCurrency(safeShipping)} <EditOutlined />
            </Tag>
          )}
        </div>
      </div>
    );
  }
);

OrderTotal.displayName = "OrderTotal";

OrderTotal.propTypes = {
  shipping: PropTypes.number,
  tax: PropTypes.number,
  roundOff: PropTypes.number,
  subTotal: PropTypes.number,
  discount: PropTypes.number,
  extraDiscount: PropTypes.number,
  finalTotal: PropTypes.number,
  onShippingChange: PropTypes.func,
};

OrderTotal.defaultProps = {
  onShippingChange: () => {},
  extraDiscount: 0,
  finalTotal: undefined,
};

export default OrderTotal;
