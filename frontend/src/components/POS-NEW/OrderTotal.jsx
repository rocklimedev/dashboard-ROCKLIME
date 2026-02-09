// src/components/Quotation/OrderTotal.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Table, Typography } from "antd";

const { Text } = Typography;

const formatCurrency = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value) || 0);

const OrderTotal = React.memo(
  ({
    subTotal = 0,
    discount = 0, // total item-level discounts
    tax = 0,
    extraDiscount = 0, // global / additional discount
    roundOff: parentRoundOff = 0, // parent's preferred round-off value
    autoRound = true, // whether to auto-calculate if parentRoundOff === 0
    shipping = 0, // optional shipping line
    showHeader = false, // optional: show column headers
  }) => {
    const safe = (n) => (typeof n === "number" && !isNaN(n) ? Number(n) : 0);

    const values = {
      subTotal: safe(subTotal),
      discount: safe(discount),
      tax: safe(tax),
      extraDiscount: safe(extraDiscount),
      shipping: safe(shipping),
      parentRoundOff: safe(parentRoundOff),
    };

    const calculations = useMemo(() => {
      let amount = values.subTotal;

      // Step 1: subtract item-level discount
      amount -= values.discount;

      // Step 2: add tax
      amount += values.tax;

      // Step 3: add shipping (if any)
      amount += values.shipping;

      // Step 4: subtract global/extra discount
      amount -= values.extraDiscount;

      const beforeRound = amount;

      // Rounding logic
      let roundOff = values.parentRoundOff;
      let finalTotal = beforeRound + roundOff;

      // If parent didn't provide roundOff and autoRound is allowed → do Indian-style rounding
      if (Math.abs(roundOff) < 0.001 && autoRound) {
        const rupees = Math.floor(beforeRound);
        const paise = Math.round((beforeRound - rupees) * 100);

        if (paise === 0) {
          roundOff = 0;
        } else if (paise <= 50) {
          roundOff = -paise / 100;
        } else {
          roundOff = (100 - paise) / 100;
        }

        finalTotal = Math.round(beforeRound + roundOff);
      }

      return {
        taxableAmount: values.subTotal - values.discount,
        amountAfterTaxAndShipping:
          values.subTotal - values.discount + values.tax + values.shipping,
        beforeRound,
        roundOff,
        finalTotal,
      };
    }, [values, autoRound]);

    const columns = [
      {
        title: "Description",
        dataIndex: "label",
        key: "label",
        render: (text, record) =>
          record.bold ? <Text strong>{text}</Text> : text,
      },
      {
        title: "Amount",
        dataIndex: "amount",
        key: "amount",
        align: "right",
        width: 140,
        render: (amount, record) => {
          const formatted = formatCurrency(amount);

          if (record.bold) {
            return (
              <Text strong style={{ fontSize: "1.18em", color: "#d32f2f" }}>
                {formatted}
              </Text>
            );
          }
          if (record.negative) {
            return <span style={{ color: "#e74c3c" }}>-{formatted}</span>;
          }
          if (record.positive) {
            return <span style={{ color: "#27ae60" }}>+{formatted}</span>;
          }
          return formatted;
        },
      },
    ];

    const dataSource = [
      {
        key: "1",
        label: "Sub Total",
        amount: values.subTotal,
      },

      ...(values.discount > 0
        ? [
            {
              key: "2",
              label: "Discount (on items)",
              amount: values.discount,
              negative: true,
            },
          ]
        : []),

      {
        key: "3",
        label: "Taxable Amount",
        amount: calculations.taxableAmount,
      },

      ...(values.tax > 0
        ? [
            {
              key: "4",
              label: "Tax (GST)",
              amount: values.tax,
              positive: true,
            },
          ]
        : []),

      ...(values.shipping > 0
        ? [
            {
              key: "shipping",
              label: "Shipping / Delivery Charges",
              amount: values.shipping,
              positive: true,
            },
          ]
        : []),

      ...(values.extraDiscount > 0
        ? [
            {
              key: "5",
              label: "Extra / Global Discount",
              amount: values.extraDiscount,
              negative: true,
            },
          ]
        : []),

      {
        key: "6",
        label: "Amount Before Round-off",
        amount: calculations.beforeRound,
      },

      ...(Math.abs(calculations.roundOff) > 0.0001
        ? [
            {
              key: "7",
              label: calculations.roundOff > 0 ? "Round Up" : "Round Down",
              amount: Math.abs(calculations.roundOff),
              positive: calculations.roundOff > 0,
              negative: calculations.roundOff < 0,
            },
          ]
        : []),

      {
        key: "final",
        label: "Grand Total",
        amount: calculations.finalTotal,
        bold: true,
      },
    ];

    return (
      <div>
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          bordered={false}
          size="middle"
          showHeader={showHeader}
          rowClassName={(record) =>
            record.bold ? "ant-table-row-bold-total" : ""
          }
        />

        <style jsx>{`
          .ant-table-row-bold-total td {
            background: #fff1f0 !important;
            border-top: 2px solid #ffccc7 !important;
          }
          .ant-table-cell {
            padding: 8px 12px !important;
          }
        `}</style>
      </div>
    );
  },
);

OrderTotal.displayName = "OrderTotal";

OrderTotal.propTypes = {
  subTotal: PropTypes.number,
  discount: PropTypes.number,
  tax: PropTypes.number,
  extraDiscount: PropTypes.number,
  roundOff: PropTypes.number,
  autoRound: PropTypes.bool,
  shipping: PropTypes.number,
  showHeader: PropTypes.bool,
};

OrderTotal.defaultProps = {
  subTotal: 0,
  discount: 0,
  tax: 0,
  extraDiscount: 0,
  roundOff: 0,
  autoRound: true,
  shipping: 0,
  showHeader: false,
};

export default OrderTotal;
