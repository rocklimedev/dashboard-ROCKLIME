import React from "react";

const OrderTotal = () => {
  return (
    <div class="order-total bg-total bg-white p-0">
      <h5 class="mb-3">Payment Summary</h5>
      <table class="table table-responsive table-borderless">
        <tr>
          <td>
            Shipping
            <a
              href="#"
              class="ms-3 link-default"
              data-bs-toggle="modal"
              data-bs-target="#shipping-cost"
            >
              <i class="ti ti-edit"></i>
            </a>
          </td>
          <td class="text-gray-9 text-end">$40.21</td>
        </tr>
        <tr>
          <td>
            Tax
            <a
              href="#"
              class="ms-3 link-default"
              data-bs-toggle="modal"
              data-bs-target="#order-tax"
            >
              <i class="ti ti-edit"></i>
            </a>
          </td>
          <td class="text-gray-9 text-end">$25</td>
        </tr>
        <tr>
          <td>
            Coupon
            <a
              href="#"
              class="ms-3 link-default"
              data-bs-toggle="modal"
              data-bs-target="#coupon-code"
            >
              <i class="ti ti-edit"></i>
            </a>
          </td>
          <td class="text-gray-9 text-end">$25</td>
        </tr>
        <tr>
          <td>
            <span class="text-danger">Discount</span>
            <a
              href="#"
              class="ms-3 link-default"
              data-bs-toggle="modal"
              data-bs-target="#discount"
            >
              <i class="ti ti-edit"></i>
            </a>
          </td>
          <td class="text-danger text-end">$15.21</td>
        </tr>
        <tr>
          <td>
            <div class="form-check form-switch">
              <input
                class="form-check-input"
                type="checkbox"
                role="switch"
                id="round"
                checked
              />
              <label class="form-check-label" for="round">
                Roundoff
              </label>
            </div>
          </td>
          <td class="text-gray-9 text-end">+0.11</td>
        </tr>
        <tr>
          <td>Sub Total</td>
          <td class="text-gray-9 text-end">$60,454</td>
        </tr>
        <tr>
          <td class="fw-bold border-top border-dashed">Total Payable</td>
          <td class="text-gray-9 fw-bold text-end border-top border-dashed">
            $56590
          </td>
        </tr>
      </table>
    </div>
  );
};

export default OrderTotal;
