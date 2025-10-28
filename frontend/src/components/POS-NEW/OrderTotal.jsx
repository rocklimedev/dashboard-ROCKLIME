import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Input, Tag } from "antd";
import { EditOutlined } from "@ant-design/icons";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Math.abs(value)
  );

const OrderTotal = React.memo(
  ({
    shipping = 0,
    tax = 0,
    roundOff = 0,
    subTotal = 0,
    discount = 0,
    finalTotal,
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

    // Calculate total before rounding (for display)
    const calculatedTotal = subTotal + shipping + tax - discount + roundOff;

    return (
      <div className="block-section order-method bg-light m-0">
        <div className="order-total">
          <div className="table-responsive">
            <table className="table table-borderless">
              <tbody>
                <tr>
                  <td>Sub Total</td>
                  <td className="text-end">{formatCurrency(subTotal)}</td>
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
                        {formatCurrency(shipping)} <EditOutlined />
                      </Tag>
                    )}
                  </td>
                </tr>

                <tr>
                  <td>Tax</td>
                  <td className="text-end">{formatCurrency(tax)}</td>
                </tr>

                <tr>
                  <td>Discount</td>
                  <td className="text-danger text-end">
                    -{formatCurrency(discount)}
                  </td>
                </tr>

                <tr>
                  <td>Round Off</td>
                  <td
                    className="text-end"
                    style={{ color: roundOff >= 0 ? "green" : "red" }}
                  >
                    {roundOff >= 0 ? "+" : ""}
                    {formatCurrency(roundOff)}
                  </td>
                </tr>

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

                {roundOff !== 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="text-center text-muted"
                      style={{ fontSize: "12px" }}
                    >
                      <em>
                        (Before rounding: {formatCurrency(calculatedTotal)})
                      </em>
                    </td>
                  </tr>
                )}
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
  finalTotal: PropTypes.number.isRequired,
  onShippingChange: PropTypes.func,
};

OrderTotal.defaultProps = {
  onShippingChange: () => {},
};

export default OrderTotal;
