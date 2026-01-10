// src/components/Quotation/OrderTotal.jsx

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Table } from "antd";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value) || 0);

const OrderTotal = React.memo(
  ({
    subTotal = 0,
    discount = 0, // item-level discounts
    extraDiscount = 0, // global fixed discount
    tax = 0,
    roundOff = 0, // incoming roundOff (if any, but we'll recalculate safely)
  }) => {
    const safe = (n) => (typeof n === "number" && !isNaN(n) ? n : 0);

    const safeSubTotal = safe(subTotal);
    const safeDiscount = safe(discount);
    const safeTax = safe(tax);
    const safeExtraDiscount = safe(extraDiscount);

    const calculations = useMemo(() => {
      const taxable = safeSubTotal - safeDiscount;
      const afterTax = taxable + safeTax;
      const afterExtra = afterTax - safeExtraDiscount;

      // Final amount before rounding
      const beforeRound = afterExtra;

      // Auto round-off logic (nearest rupee)
      const rupees = Math.floor(beforeRound);
      const paise = Math.round((beforeRound - rupees) * 100);
      let autoRoundOff = 0;
      if (paise > 0 && paise <= 50) {
        autoRoundOff = -(paise / 100);
      } else if (paise > 50) {
        autoRoundOff = (100 - paise) / 100;
      }

      const finalTotal = Math.round(beforeRound + autoRoundOff);

      return {
        taxable,
        afterTax,
        afterExtra,
        beforeRound,
        autoRoundOff,
        finalTotal,
      };
    }, [safeSubTotal, safeDiscount, safeTax, safeExtraDiscount]);

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

          if (record.isTotal) {
            return (
              <strong style={{ fontSize: "18px", color: "#e31e24" }}>
                {formatted}
              </strong>
            );
          }
          if (record.isNegative) {
            return <span style={{ color: "#e74c3c" }}>-{formatted}</span>;
          }
          if (record.isPositive) {
            return <span style={{ color: "#27ae60" }}>+{formatted}</span>;
          }
          return formatted;
        },
      },
    ];

    const dataSource = [
      { key: "subtotal", label: "Sub Total", amount: safeSubTotal },

      ...(safeDiscount > 0
        ? [
            {
              key: "item-discount",
              label: "Discount (Items)",
              amount: safeDiscount,
              isNegative: true,
            },
          ]
        : []),

      { key: "taxable", label: "Taxable Amount", amount: calculations.taxable },

      ...(safeTax > 0
        ? [
            {
              key: "tax",
              label: "Tax",
              amount: safeTax,
              isPositive: true,
            },
          ]
        : []),

      ...(safeExtraDiscount > 0
        ? [
            {
              key: "extra-discount",
              label: "Global Discount",
              amount: safeExtraDiscount,
              isNegative: true,
            },
          ]
        : []),

      {
        key: "before-round",
        label: "Amount Before Round-off",
        amount: calculations.beforeRound,
      },

      ...(calculations.autoRoundOff !== 0
        ? [
            {
              key: "roundoff",
              label: calculations.autoRoundOff > 0 ? "Round Up" : "Round Down",
              amount: Math.abs(calculations.autoRoundOff),
              isPositive: calculations.autoRoundOff > 0,
              isNegative: calculations.autoRoundOff < 0,
            },
          ]
        : []),

      {
        key: "final",
        label: "Grand Total",
        amount: calculations.finalTotal,
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
          showHeader={false}
          rowClassName={(record) =>
            record.isTotal ? "ant-table-row-total" : ""
          }
        />
      </div>
    );
  }
);

OrderTotal.displayName = "OrderTotal";

OrderTotal.propTypes = {
  subTotal: PropTypes.number,
  discount: PropTypes.number,
  extraDiscount: PropTypes.number,
  tax: PropTypes.number,
  roundOff: PropTypes.number,
};

OrderTotal.defaultProps = {
  subTotal: 0,
  discount: 0,
  extraDiscount: 0,
  tax: 0,
  roundOff: 0,
};

export default OrderTotal;
