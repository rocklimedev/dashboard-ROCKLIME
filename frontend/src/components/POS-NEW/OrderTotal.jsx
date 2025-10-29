import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Input, Tag } from "antd";
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
    shipping = 0,
    tax = 0,
    roundOff = 0,
    subTotal = 0,
    discount = 0,
    extraDiscount = 0, // ← NEW: extra discount from form
    finalTotal: finalTotalProp, // ← may be undefined
    onShippingChange,
  }) => {
    const [isEditingShipping, setIsEditingShipping] = useState(false);
    const [shippingInput, setShippingInput] = useState(shipping.toString());

    // Sync input when shipping changes externally
    useEffect(() => {
      setShippingInput(shipping.toString());
    }, [shipping]);

    const handleShippingChange = (e) => {
      const value = e.target.value;
      if (/^\d*\.?\d*$/.test(value)) {
        setShippingInput(value);
      }
    };

    const handleShippingSubmit = () => {
      const newShipping = parseFloat(shippingInput) || 0;
      onShippingChange?.(newShipping);
      setIsEditingShipping(false);
    };

    const handleKeyPress = (e) => {
      if (e.key === "Enter") handleShippingSubmit();
    };

    // === SAFE NUMBERS ===
    const safe = (n) => (typeof n === "number" && !isNaN(n) ? n : 0);

    const safeSubTotal = safe(subTotal);
    const safeShipping = safe(shipping);
    const safeTax = safe(tax);
    const safeDiscount = safe(discount);
    const safeRoundOff = safe(roundOff);

    const safeExtraDiscount = safe(extraDiscount);

    const calculatedTotal = useMemo(() => {
      return (
        safeSubTotal +
        safeShipping +
        safeTax -
        safeDiscount -
        safeExtraDiscount +
        safeRoundOff
      );
    }, [
      safeSubTotal,
      safeShipping,
      safeTax,
      safeDiscount,
      safeExtraDiscount,
      safeRoundOff,
    ]);
    const finalTotal = useMemo(() => {
      if (finalTotalProp != null && !isNaN(finalTotalProp)) {
        return finalTotalProp; // Already rounded to 0 or 5
      }
      return Math.round(calculatedTotal); // fallback
    }, [finalTotalProp, calculatedTotal]);
    return (
      <div className="block-section order-method bg-light m-0">
        <div className="order-total">
          <div className="table-responsive">
            <table className="table table-borderless">
              <tbody>
                <tr>
                  <td>Sub Total</td>
                  <td className="text-end">{formatCurrency(safeSubTotal)}</td>
                </tr>

                <tr>
                  <td>Shipping</td>
                  <td className="text-end">
                    {isEditingShipping ? (
                      <Input
                        value={shippingInput}
                        onChange={handleShippingChange}
                        onBlur={handleShippingSubmit}
                        onKeyPress={handleKeyPress}
                        style={{
                          width: "100px",
                          border: "none",
                          borderBottom: "1px solid #d9d9d9",
                          padding: "0 4px",
                          fontSize: "14px",
                          background: "transparent",
                        }}
                        autoFocus
                      />
                    ) : (
                      <Tag
                        color="blue"
                        style={{
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: "4px 8px",
                        }}
                        onClick={() => setIsEditingShipping(true)}
                      >
                        {formatCurrency(safeShipping)} <EditOutlined />
                      </Tag>
                    )}
                  </td>
                </tr>

                <tr>
                  <td>Tax</td>
                  <td className="text-end">{formatCurrency(safeTax)}</td>
                </tr>

                <tr>
                  <td>Discount (Items)</td>
                  <td className="text-danger text-end">
                    -{formatCurrency(safeDiscount)}
                  </td>
                </tr>
                {/* NEW ROW */}
                {safeExtraDiscount > 0 && (
                  <tr>
                    <td>Extra Discount</td>
                    <td className="text-danger text-end">
                      -{formatCurrency(safeExtraDiscount)}
                    </td>
                  </tr>
                )}

                <tr className="border-top">
                  <td>
                    <strong style={{ fontSize: "16px" }}>Grand Total</strong>
                  </td>
                  <td className="text-end">
                    <strong
                      style={{
                        fontSize: "18px",
                        color: "#e31e24",
                      }}
                    >
                      {formatCurrency(finalTotal)}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
  finalTotal: PropTypes.number, // ← now optional
  onShippingChange: PropTypes.func,
};

OrderTotal.defaultProps = {
  onShippingChange: () => {},
  finalTotal: undefined, // ← allow undefined
};

export default OrderTotal;
