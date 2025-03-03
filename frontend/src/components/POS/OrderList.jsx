import React from "react";

const OrderList = () => {
  return (
    <div class="col-md-12 col-lg-5 col-xl-4 ps-0 theiaStickySidebar d-lg-flex">
      <aside class="product-order-list bg-secondary-transparent flex-fill">
        <div class="card">
          <div class="card-body">
            <div class="order-head d-flex align-items-center justify-content-between w-100">
              <div>
                <h3>Order List</h3>
              </div>
              <div class="d-flex align-items-center gap-2">
                <span class="badge badge-dark fs-10 fw-medium badge-xs">
                  #ORD123
                </span>
                <a class="link-danger fs-16" href="javascript:void(0);">
                  <i class="ti ti-trash-x-filled"></i>
                </a>
              </div>
            </div>
            <div class="customer-info block-section">
              <h5 class="mb-2">Customer Information</h5>
              <div class="d-flex align-items-center gap-2">
                <div class="flex-grow-1">
                  <select class="select">
                    <option>Walk in Customer</option>
                    <option>John</option>
                    <option>Smith</option>
                    <option>Ana</option>
                    <option>Elza</option>
                  </select>
                </div>
                <a
                  href="#"
                  class="btn btn-teal btn-icon fs-20"
                  data-bs-toggle="modal"
                  data-bs-target="#create"
                >
                  <i class="ti ti-user-plus"></i>
                </a>
                <a
                  href="#"
                  class="btn btn-info btn-icon fs-20"
                  data-bs-toggle="modal"
                  data-bs-target="#barcode"
                >
                  <i class="ti ti-scan"></i>
                </a>
              </div>
              <div class="customer-item border border-orange bg-orange-100 d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
                <div>
                  <h6 class="fs-16 fw-bold mb-1">James Anderson</h6>
                  <div class="d-inline-flex align-items-center gap-2 customer-bonus">
                    <p class="fs-13 d-inline-flex align-items-center gap-1">
                      Bonus :
                      <span class="badge bg-cyan fs-13 fw-bold p-1">148</span>{" "}
                    </p>
                    <p class="fs-13 d-inline-flex align-items-center gap-1">
                      Loyality :
                      <span class="badge bg-teal fs-13 fw-bold p-1">$20</span>{" "}
                    </p>
                  </div>
                </div>
                <a href="javascript:void(0);" class="btn btn-orange btn-sm">
                  Apply
                </a>
                <a href="javascript:void(0);" class="close-icon">
                  <i class="ti ti-x"></i>
                </a>
              </div>
            </div>
            <div class="product-added block-section">
              <div class="head-text d-flex align-items-center justify-content-between mb-3">
                <div class="d-flex align-items-center">
                  <h5 class="me-2">Order Details</h5>
                  <div class="badge bg-light text-gray-9 fs-12 fw-semibold py-2 border rounded">
                    Items : <span class="text-teal">3</span>
                  </div>
                </div>
                <a
                  href="javascript:void(0);"
                  class="d-flex align-items-center clear-icon fs-10 fw-medium"
                >
                  Clear all
                </a>
              </div>
              <div class="product-wrap">
                <div class="empty-cart">
                  <div class="fs-24 mb-1">
                    <i class="ti ti-shopping-cart"></i>
                  </div>
                  <p class="fw-bold">No Products Selected</p>
                </div>
                <div class="product-list border-0 p-0">
                  <div class="table-responsive">
                    <table class="table table-borderless">
                      <thead>
                        <tr>
                          <th class="fw-bold bg-light">Item</th>
                          <th class="fw-bold bg-light">QTY</th>
                          <th class="fw-bold bg-light text-end">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <div class="d-flex align-items-center">
                              <a
                                class="delete-icon"
                                href="javascript:void(0);"
                                data-bs-toggle="modal"
                                data-bs-target="#delete"
                              >
                                <i class="ti ti-trash-x-filled"></i>
                              </a>
                              <h6 class="fs-13 fw-normal">
                                <a
                                  href="#"
                                  class=" link-default"
                                  data-bs-toggle="modal"
                                  data-bs-target="#products"
                                >
                                  iPhone 14 64GB
                                </a>
                              </h6>
                            </div>
                          </td>
                          <td>
                            <div class="qty-item m-0">
                              <a
                                href="javascript:void(0);"
                                class="dec d-flex justify-content-center align-items-center"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="minus"
                              >
                                <i class="ti ti-minus"></i>
                              </a>
                              <input
                                type="text"
                                class="form-control text-center"
                                name="qty"
                                value="1"
                              />
                              <a
                                href="javascript:void(0);"
                                class="inc d-flex justify-content-center align-items-center"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="plus"
                              >
                                <i class="ti ti-plus"></i>
                              </a>
                            </div>
                          </td>
                          <td class="fs-13 fw-semibold text-gray-9 text-end">
                            $15800
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="d-flex align-items-center">
                              <a
                                class="delete-icon"
                                href="javascript:void(0);"
                                data-bs-toggle="modal"
                                data-bs-target="#delete"
                              >
                                <i class="ti ti-trash-x-filled"></i>
                              </a>
                              <h6 class="fs-13 fw-normal ">
                                <a
                                  href="#"
                                  class="link-default"
                                  data-bs-toggle="modal"
                                  data-bs-target="#products"
                                >
                                  Red Nike Angelo
                                </a>
                              </h6>
                            </div>
                          </td>
                          <td>
                            <div class="qty-item m-0">
                              <a
                                href="javascript:void(0);"
                                class="dec d-flex justify-content-center align-items-center"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="minus"
                              >
                                <i class="ti ti-minus"></i>
                              </a>
                              <input
                                type="text"
                                class="form-control text-center"
                                name="qty"
                                value="4"
                              />
                              <a
                                href="javascript:void(0);"
                                class="inc d-flex justify-content-center align-items-center"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="plus"
                              >
                                <i class="ti ti-plus"></i>
                              </a>
                            </div>
                          </td>
                          <td class="fs-13 fw-semibold text-gray-9 text-end">
                            $398
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="d-flex align-items-center">
                              <a
                                class="delete-icon"
                                href="javascript:void(0);"
                                data-bs-toggle="modal"
                                data-bs-target="#delete"
                              >
                                <i class="ti ti-trash-x-filled"></i>
                              </a>
                              <h6 class="fs-13 fw-normal ">
                                <a
                                  href="#"
                                  class="link-default"
                                  data-bs-toggle="modal"
                                  data-bs-target="#products"
                                >
                                  Tablet 1.02 inch
                                </a>
                              </h6>
                            </div>
                          </td>
                          <td>
                            <div class="qty-item m-0">
                              <a
                                href="javascript:void(0);"
                                class="dec d-flex justify-content-center align-items-center"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="minus"
                              >
                                <i class="ti ti-minus"></i>
                              </a>
                              <input
                                type="text"
                                class="form-control text-center"
                                name="qty"
                                value="4"
                              />
                              <a
                                href="javascript:void(0);"
                                class="inc d-flex justify-content-center align-items-center"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="plus"
                              >
                                <i class="ti ti-plus"></i>
                              </a>
                            </div>
                          </td>
                          <td class="fs-13 fw-semibold text-gray-9 text-end">
                            $3000
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="d-flex align-items-center">
                              <a
                                class="delete-icon"
                                href="javascript:void(0);"
                                data-bs-toggle="modal"
                                data-bs-target="#delete"
                              >
                                <i class="ti ti-trash-x-filled"></i>
                              </a>
                              <h6 class="fs-13 fw-normal ">
                                <a
                                  href="#"
                                  class="link-default"
                                  data-bs-toggle="modal"
                                  data-bs-target="#products"
                                >
                                  IdeaPad Slim 3i
                                </a>
                              </h6>
                            </div>
                          </td>
                          <td>
                            <div class="qty-item m-0">
                              <a
                                href="javascript:void(0);"
                                class="dec d-flex justify-content-center align-items-center"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="minus"
                              >
                                <i class="ti ti-minus"></i>
                              </a>
                              <input
                                type="text"
                                class="form-control text-center"
                                name="qty"
                                value="4"
                              />
                              <a
                                href="javascript:void(0);"
                                class="inc d-flex justify-content-center align-items-center"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="plus"
                              >
                                <i class="ti ti-plus"></i>
                              </a>
                            </div>
                          </td>
                          <td class="fs-13 fw-semibold text-gray-9 text-end">
                            $3000
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div class="discount-item d-flex align-items-center justify-content-between  bg-purple-transparent mt-3 flex-wrap gap-2">
                <div class="d-flex align-items-center">
                  <span class="bg-purple discount-icon br-5 flex-shrink-0 me-2">
                    <img src="assets/img/icons/discount-icon.svg" alt="img" />
                  </span>
                  <div>
                    <h6 class="fs-14 fw-bold text-purple mb-1">Discount 5%</h6>
                    <p class="mb-0">For $20 Minimum Purchase, all Items</p>
                  </div>
                </div>
                <a href="javascript:void(0);" class="close-icon">
                  <i class="ti ti-trash"></i>
                </a>
              </div>
            </div>
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
                  <td class="fw-bold border-top border-dashed">
                    Total Payable
                  </td>
                  <td class="text-gray-9 fw-bold text-end border-top border-dashed">
                    $56590
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </div>
        <div class="card payment-method">
          <div class="card-body">
            <h5 class="mb-3">Select Payment</h5>
            <div class="row align-items-center methods g-2">
              <div class="col-sm-6 col-md-4 d-flex">
                <a
                  href="javascript:void(0);"
                  class="payment-item d-flex align-items-center justify-content-center p-2 flex-fill"
                  data-bs-toggle="modal"
                  data-bs-target="#payment-cash"
                >
                  <img
                    src="assets/img/icons/cash-icon.svg"
                    class="me-2"
                    alt="img"
                  />
                  <p class="fs-14 fw-medium">Cash</p>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div class="btn-row d-flex align-items-center justify-content-between gap-3">
          <a
            href="javascript:void(0);"
            class="btn btn-white d-flex align-items-center justify-content-center flex-fill m-0"
            data-bs-toggle="modal"
            data-bs-target="#hold-order"
          >
            <i class="ti ti-printer me-2"></i>Print Order
          </a>
          <a
            href="javascript:void(0);"
            class="btn btn-secondary d-flex align-items-center justify-content-center flex-fill m-0"
          >
            <i class="ti ti-shopping-cart me-2"></i>Place Order
          </a>
        </div>
      </aside>
    </div>
  );
};

export default OrderList;
