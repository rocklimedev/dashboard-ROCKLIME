import React, { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../Common/PageHeader";

const OrderList = () => {
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

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <PageHeader />
        <div className="row">
          <div className="col-md-12 col-lg-7 col-xl-8">
            <div className="pos-orders tabs_wrapper pb-0">
              <div className="pos-products">
                <div className="d-flex align-items-center justify-content-between">
                  <h4 className="mb-3">Orders</h4>
                  <div className="input-icon-start pos-search position-relative mb-3">
                    <span className="input-icon-addon">
                      <i className="ti ti-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Product"
                    />
                  </div>
                </div>
                <div className="tabs_container">
                  <div className="tab_content active" data-tab="all">
                    <div className="row">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="col-sm-6 col-md-6 col-lg-4 col-xl-3"
                        >
                          <div className="product-info card">
                            <Link
                              to={`/orders/${order.id}`}
                              className="pro-img"
                            >
                              <img
                                src="assets/img/products/pos-product-01.png"
                                alt="Products"
                              />
                              <span>
                                <i className="ti ti-circle-check-filled"></i>
                              </span>
                            </Link>
                            <Link to={`/orders/${order.id}`}>
                              Order #{order.id}
                            </Link>
                            <h6 className="cat-name">{order.customer}</h6>
                            <h6 className="product-name">
                              Status:{" "}
                              <span className="text-warning">
                                {order.status}
                              </span>
                            </h6>
                            <div className="d-flex align-items-center justify-content-between price">
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
    </div>
  );
};

export default OrderList;
