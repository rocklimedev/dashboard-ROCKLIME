// OrderTotal.jsx  –  NEW VERSION (copy-paste)

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Table, Tag } from "antd";
import { EditOutlined } from "@ant-design/icons";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value) || 0);

const OrderTotal = React.memo(
  ({
    shipping: _shippingProp, // ← ignore incoming prop
    tax = 0,
    roundOff = 0,
    subTotal = 0,
    discount = 0,
    extraDiscount = 0,
    gst = 0,
    gstAmount = 0,
    finalTotal: finalTotalProp,
  }) => {
    const shipping = 0; // ← ALWAYS 0
    const safe = (n) => (typeof n === "number" && !isNaN(n) ? n : 0);

    const safeSubTotal = safe(subTotal);
    const safeDiscount = safe(discount);
    const safeTax = safe(tax);
    const safeExtraDiscount = safe(extraDiscount);
    const safeShipping = safe(shipping);
    const safeRoundOff = safe(roundOff);
    const safeGst = safe(gst);
    const safeGstAmount = safe(gstAmount);

    const calculations = useMemo(() => {
      const taxable = safeSubTotal - safeDiscount;
      const afterTax = taxable + safeTax;
      const afterExtra = afterTax - safeExtraDiscount;
      const withGst = afterExtra + safeGstAmount;
      const beforeRound = withGst;

      const rupees = Math.floor(beforeRound);
      const paise = Math.round((beforeRound - rupees) * 100);
      let roundOff = 0;
      if (paise > 0 && paise <= 50) {
        roundOff = -(paise / 100);
      } else if (paise > 50) {
        roundOff = (100 - paise) / 100;
      }
      const final = Math.round(beforeRound + roundOff); // ← already correct

      return {
        taxable,
        afterTax,
        afterExtra,
        withGst,
        beforeRound,
        roundOff,
        final,
      };
    }, [safeSubTotal, safeDiscount, safeTax, safeExtraDiscount, safeGstAmount]);

    const columns = [
      {
        title: "Description",
        dataIndex: "label",
        key: "label",
        render: (text, r) => (r.isTotal ? <strong>{text}</strong> : text),
      },
      {
        title: "Amount",
        dataIndex: "amount",
        key: "amount",
        align: "right",
        render: (amount, r) => {
          const f = formatCurrency(amount);
          if (r.isNegative)
            return <span style={{ color: "#e74c3c" }}>-{f}</span>;
          if (r.isPositive)
            return <span style={{ color: "#27ae60" }}>+{f}</span>;
          if (r.isTotal)
            return (
              <strong style={{ fontSize: "18px", color: "#e31e24" }}>
                {f}
              </strong>
            );
          return f;
        },
      },
    ];

    const dataSource = [
      { key: "subtotal", label: "Sub Total", amount: safeSubTotal },
      {
        key: "item-discount",
        label: "Discount (Items)",
        amount: safeDiscount,
        isNegative: safeDiscount > 0,
      },
      { key: "taxable", label: "Taxable Amount", amount: calculations.taxable },
      ...(safeTax > 0
        ? [{ key: "tax", label: "Tax", amount: safeTax, isPositive: true }]
        : []),
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
        amount: calculations.withGst,
      },
      ...(calculations.roundOff !== 0
        ? [
            {
              key: "roundoff",
              label: calculations.roundOff > 0 ? "Round-up" : "Round-down",
              amount: Math.abs(calculations.roundOff),
              isPositive: calculations.roundOff > 0,
              isNegative: calculations.roundOff < 0,
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

    return (
      <div className="order-total">
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          bordered={false}
          size="small"
          rowClassName={(r) => (r.isTotal ? "ant-table-row-total" : "")}
        />
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
  gst: PropTypes.number,
  gstAmount: PropTypes.number,
  finalTotal: PropTypes.number,
};

OrderTotal.defaultProps = {
  shipping: 0,
  extraDiscount: 0,
  finalTotal: undefined,
};

export default OrderTotal;
