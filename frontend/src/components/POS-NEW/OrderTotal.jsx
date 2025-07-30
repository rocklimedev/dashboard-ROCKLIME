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
    <div class="block-section order-method bg-light m-0">
      <div class="order-total">
        <div class="table-responsive">
          <table class="table table-borderless">
            <tr>
              <td>Sub Total</td>
              <td class="text-end">{formatCurrency(subTotal)}</td>
            </tr>
            <tr>
              <td>Shipping</td>
              <td class="text-end">{formatCurrency(shipping)}</td>
            </tr>
            <tr>
              <td>Tax (15%)</td>
              <td class="text-end">{formatCurrency(tax)}</td>
            </tr>
            <tr>
              <td>Discount</td>
              <td class="text-danger text-end">-{formatCurrency(discount)}</td>
            </tr>
            <tr>
              <td>Grand Total</td>
              <td class="text-end"> {formatCurrency(totalPayable)}</td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderTotal;
