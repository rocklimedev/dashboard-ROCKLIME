import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";

const OrderList = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const orders = [
    {
      id: "12345",
      customer: "John Doe",
      items: 3,
      price: "$250",
      status: "Completed",
    },
    {
      id: "12346",
      customer: "Jane Smith",
      items: 2,
      price: "$180",
      status: "Pending",
    },
  ];

  const openModal = (order) => {
    setSelectedOrder(order);
  };
  return (
    <div class="page-wrapper">
      <div class="content container-fluid">
        <PageHeader />
        <div class="row">
          <div class="col-md-12 col-lg-7 col-xl-8">
            <div class="pos-orders tabs_wrapper pb-0">
              <div class="card pos-button">
                <div class="d-flex align-items-center flex-wrap">
                  <a
                    href="javascript:void(0);"
                    class="btn btn-teal btn-md mb-xs-3"
                    data-bs-toggle="modal"
                    data-bs-target="#orders"
                  >
                    <i class="ti ti-shopping-cart me-1"></i>View Orders
                  </a>
                  <a
                    href="javascript:void(0);"
                    class="btn btn-md btn-indigo"
                    data-bs-toggle="modal"
                    data-bs-target="#reset"
                  >
                    <i class="ti ti-reload me-1"></i>Reset
                  </a>
                  <a
                    href="javascript:void(0);"
                    class="btn btn-md btn-info"
                    data-bs-toggle="modal"
                    data-bs-target="#recents"
                  >
                    <i class="ti ti-refresh-dot me-1"></i>Transaction
                  </a>
                </div>
              </div>

              <div class="pos-products">
                <div class="d-flex align-items-center justify-content-between">
                  <h4 class="mb-3">Orders</h4>
                  <div class="input-icon-start pos-search position-relative mb-3">
                    <span class="input-icon-addon">
                      <i class="ti ti-search"></i>
                    </span>
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Search Product"
                    />
                  </div>
                </div>
                <div class="tabs_container">
                  <div class="tab_content active" data-tab="all">
                    <div class="row">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          class="col-sm-6 col-md-6 col-lg-4 col-xl-3"
                        >
                          <div
                            class="product-info card"
                            onClick={() => openModal(order)}
                          >
                            <a href="javascript:void(0);" class="pro-img">
                              <img
                                src="assets/img/products/pos-product-01.png"
                                alt="Products"
                              />
                              <span>
                                <i class="ti ti-circle-check-filled"></i>
                              </span>
                            </a>
                            <a href="javascript:void(0);">Order #{order.id}</a>

                            <h6 class="cat-name">{order.customer}</h6>
                            <h6 class="product-name">
                              <a href="javascript:void(0);">
                                {" "}
                                Status:{" "}
                                <span class="text-warning">{order.status}</span>
                              </a>
                            </h6>
                            <div class="d-flex align-items-center justify-content-between price">
                              <span>{order.items} Items</span>
                              <p>{order.price}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {selectedOrder && (
        <div class="modal fade show" style={{ display: "block" }}>
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Order Details - #{selectedOrder.id}</h5>
                <button
                  type="button"
                  class="close"
                  onClick={() => setSelectedOrder(null)}
                >
                  &times;
                </button>
              </div>
              <div class="modal-body">
                <p>
                  <strong>Customer:</strong> {selectedOrder.customer}
                </p>
                <p>
                  <strong>Items:</strong> {selectedOrder.items}
                </p>
                <p>
                  <strong>Total Price:</strong> {selectedOrder.price}
                </p>
                <h6>Team Management</h6>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Team Name</th>
                      <th>Member Name</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Enter team name"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Enter member name"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          class="form-control"
                          placeholder="Enter role"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
