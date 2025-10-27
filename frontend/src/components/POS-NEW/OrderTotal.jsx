import React, { useState } from "react";
import PropTypes from "prop-types";
import { Input, Tag } from "antd";
import { EditOutlined } from "@ant-design/icons";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    value
  );

const OrderTotal = ({
  shipping = 0,
  tax = 0,
  roundOff = 0,
  subTotal = 0,
  discount = 0,
  items = [],
  onShippingChange, // New prop to handle shipping updates
}) => {
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [shippingInput, setShippingInput] = useState(shipping.toString());

  const totalPayable = Number(
    subTotal + Number(shipping) + tax + roundOff - discount
  ).toFixed(2);

  // Handle input change for shipping
  const handleShippingChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal points
    if (/^\d*\.?\d*$/.test(value)) {
      setShippingInput(value);
    }
  };

  // Handle shipping input submission (on blur or Enter)
  const handleShippingSubmit = () => {
    const newShipping = parseFloat(shippingInput) || 0;
    if (onShippingChange) {
      onShippingChange(newShipping); // Notify parent of the new shipping value
    }
    setIsEditingShipping(false);
  };

  // Handle key press for Enter
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleShippingSubmit();
    }
  };

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
                      style={{
                        cursor: "pointer",
                        fontSize: "14px",
                        padding: "4px 8px",
                      }}
                      onClick={() => {
                        setIsEditingShipping(true);
                        setShippingInput(shipping.toString());
                      }}
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
                <td className="text-end">{formatCurrency(roundOff)}</td>
              </tr>
              <tr>
                <td>
                  <strong>Grand Total</strong>
                </td>
                <td className="text-end">
                  <strong>{formatCurrency(totalPayable)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

OrderTotal.propTypes = {
  shipping: PropTypes.number,
  tax: PropTypes.number,
  roundOff: PropTypes.number,
  subTotal: PropTypes.number,
  discount: PropTypes.number,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      productId: PropTypes.string,
      name: PropTypes.string,
      discount: PropTypes.number,
      tax: PropTypes.number,
      price: PropTypes.number,
      quantity: PropTypes.number,
    })
  ),
  onShippingChange: PropTypes.func, // New prop for updating shipping
};

OrderTotal.defaultProps = {
  onShippingChange: (value) => {
    console.warn("onShippingChange not provided. Shipping value:", value);
  },
};

export default OrderTotal;
