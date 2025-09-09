import React from "react";
import PropTypes from "prop-types";

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
  gstValue = 0,
  includeGst = false,
  items = [], // Optional: For itemized discount display
}) => {
  const totalPayable = Number(
    subTotal + shipping + tax + roundOff - discount
  ).toFixed(2);

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
                <td className="text-end">{formatCurrency(shipping)}</td>
              </tr>
              <tr>
                <td>Tax {includeGst ? `(${gstValue}%)` : ""}</td>
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
              {/* Optional: Itemized discount breakdown */}
              {/* {items.length > 0 && (
                <>
                  <tr>
                    <td colSpan="2" className="text-start">
                      <strong>Discount Breakdown:</strong>
                    </td>
                  </tr>
                  {items.map((item) => (
                    <tr key={item.productId}>
                      <td>{item.name}</td>
                      <td className="text-danger text-end">
                        -{formatCurrency(item.discount || 0)}
                      </td>
                    </tr>
                  ))}
                </>
              )} */}
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
  gstValue: PropTypes.number,
  includeGst: PropTypes.bool,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      productId: PropTypes.string,
      name: PropTypes.string,
      discount: PropTypes.number,
    })
  ),
};

export default OrderTotal;
