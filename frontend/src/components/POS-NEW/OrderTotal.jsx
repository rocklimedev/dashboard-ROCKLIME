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
      <div class="row gx-2">
        <div class="col-sm-4">
          <a
            href="javascript:void(0);"
            class="btn btn-teal d-flex align-items-center justify-content-center w-100 mb-2"
            data-bs-toggle="modal"
            data-bs-target="#discount"
          >
            <i class="ti ti-percentage me-2"></i>Discount
          </a>
          <a
            href="javascript:void(0);"
            class="btn btn-orange d-flex align-items-center justify-content-center w-100 mb-2"
            data-bs-toggle="modal"
            data-bs-target="#hold-order"
          >
            <i class="ti ti-player-pause me-2"></i>Hold
          </a>
          <a
            href="javascript:void(0);"
            class="btn btn-secondary d-flex align-items-center justify-content-center w-100 mb-2"
            data-bs-toggle="modal"
            data-bs-target="#orders"
          >
            <i class="ti ti-shopping-cart me-2"></i>View Orders
          </a>
        </div>
        <div class="col-sm-4">
          <a
            href="javascript:void(0);"
            class="btn btn-purple d-flex align-items-center justify-content-center w-100 mb-2"
            data-bs-toggle="modal"
            data-bs-target="#order-tax"
          >
            <i class="ti ti-receipt-tax me-2"></i>Tax
          </a>
          <a
            href="javascript:void(0);"
            class="btn btn-info d-flex align-items-center justify-content-center w-100 mb-2"
          >
            <i class="ti ti-trash me-2"></i>Void
          </a>
          <a
            href="javascript:void(0);"
            class="btn btn-indigo d-flex align-items-center justify-content-center w-100 mb-2"
            data-bs-toggle="modal"
            data-bs-target="#reset"
          >
            <i class="ti ti-reload me-2"></i>Reset
          </a>
        </div>
        <div class="col-sm-4">
          <a
            href="javascript:void(0);"
            class="btn btn-pink d-flex align-items-center justify-content-center w-100 mb-2"
            data-bs-toggle="modal"
            data-bs-target="#shipping-cost"
          >
            <i class="ti ti-package-import me-2"></i>Shipping
          </a>
          <a
            href="javascript:void(0);"
            class="btn btn-cyan d-flex align-items-center justify-content-center w-100 mb-2"
            data-bs-toggle="modal"
            data-bs-target="#payment-completed"
          >
            <i class="ti ti-cash-banknote me-2"></i>Payment
          </a>
          <a
            href="javascript:void(0);"
            class="btn btn-danger d-flex align-items-center justify-content-center w-100 mb-2"
            data-bs-toggle="modal"
            data-bs-target="#recents"
          >
            <i class="ti ti-refresh-dot me-2"></i>Transaction
          </a>
        </div>
      </div>
    </div>
  );
};

export default OrderTotal;
