import React, { useState } from "react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    value
  );

const OrderTotal = ({
  shipping = 0,
  tax = 0,
  coupon = 0,
  discount = 0,
  roundOff = 0,
  subTotal = 0,
}) => {
  const totalPayable = Number(
    subTotal + shipping + tax + roundOff - discount - coupon
  ).toFixed(2);

  return (
    <div className="order-total">
      <h5 className="mb-3">Payment Summary</h5>
      <table className="table table-responsive table-borderless">
        <tr>
          <td>Shipping</td>
          <td className="text-gray-9 text-end">{formatCurrency(shipping)}</td>
        </tr>
        <tr>
          <td>Tax</td>
          <td className="text-gray-9 text-end">{formatCurrency(tax)}</td>
        </tr>
        <tr>
          <td>Coupon</td>
          <td className="text-gray-9 text-end">-{formatCurrency(coupon)}</td>
        </tr>
        <tr>
          <td>
            <span className="text-danger">Discount</span>
          </td>
          <td className="text-danger text-end">-{formatCurrency(discount)}</td>
        </tr>

        <tr>
          <td>Sub Total</td>
          <td className="text-gray-9 text-end">{formatCurrency(subTotal)}</td>
        </tr>
        <tr>
          <td className="fw-bold border-top border-dashed">Total Payable</td>
          <td className="text-gray-9 fw-bold text-end border-top border-dashed">
            {formatCurrency(totalPayable)}
          </td>
        </tr>
      </table>
    </div>
  );
};

export default OrderTotal;
