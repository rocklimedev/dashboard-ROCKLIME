import React from "react";

const OrderTotal = ({
  shipping = 0,
  tax = 0,
  coupon = 0,
  discount = 0,
  roundOff = 0,
  subTotal = 0,
}) => {
  const totalPayable = (
    subTotal +
    shipping +
    tax +
    roundOff -
    discount -
    coupon
  ).toFixed(2);

  return (
    <div className="order-total bg-total bg-white p-0">
      <h5 className="mb-3">Payment Summary</h5>
      <table className="table table-responsive table-borderless">
        <tbody>
          <tr>
            <td>Shipping</td>
            <td className="text-gray-9 text-end">₹{shipping.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Tax</td>
            <td className="text-gray-9 text-end">₹{tax.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Coupon</td>
            <td className="text-gray-9 text-end">-₹{coupon.toFixed(2)}</td>
          </tr>
          <tr>
            <td>
              <span className="text-danger">Discount</span>
            </td>
            <td className="text-danger text-end">-₹{discount.toFixed(2)}</td>
          </tr>
          <tr>
            <td>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="round"
                  checked
                  readOnly
                />
                <label className="form-check-label" htmlFor="round">
                  Roundoff
                </label>
              </div>
            </td>
            <td className="text-gray-9 text-end">
              {roundOff >= 0 ? "+" : "-"}₹{Math.abs(roundOff).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td>Sub Total</td>
            <td className="text-gray-9 text-end">₹{subTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td className="fw-bold border-top border-dashed">Total Payable</td>
            <td className="text-gray-9 fw-bold text-end border-top border-dashed">
              ₹{totalPayable}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default OrderTotal;
