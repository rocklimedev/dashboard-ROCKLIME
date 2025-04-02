import React, { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../Common/PageHeader";
import OrderPagination from "./OrderPagination";
import OrderList from "./OrderList";
import OrderFilter from "./OrderFilter";
const OrderWrapper = () => {
  return (
    <div class="page-wrapper notes-page-wrapper">
      <div class="content">
        <div class="page-header page-add-notes border-0 flex-sm-row flex-column">
          <div class="add-item d-flex">
            <div class="page-title">
              <h4>Orders</h4>
              <h6 class="mb-0">Manage your orders</h6>
            </div>
          </div>
          <div class="d-flex flex-sm-row flex-column align-items-sm-center align-items-start">
            <ul class="table-top-head me-2">
              <li>
                <a
                  href="/orders/list"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title="Refresh"
                >
                  <i class="ti ti-refresh"></i>
                </a>
              </li>
              <li>
                <a
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  title="Collapse"
                  id="collapse-header"
                >
                  <i class="ti ti-chevron-up"></i>
                </a>
              </li>
            </ul>
            <div class="search-set">
              <div class="search-input">
                <span class="btn-searchset">
                  <i class="ti ti-search fs-14 feather-search"></i>
                </span>
                <div class="dataTables_filter">
                  <label>
                    {" "}
                    <input
                      type="search"
                      class="form-control form-control-sm py-0"
                      placeholder="Search"
                    />
                  </label>
                </div>
              </div>
            </div>
            <div class="page-btn">
              <a href="/pos" class="btn btn-primary">
                <i class="ti ti-circle-plus me-1"></i>Add New Order
              </a>
            </div>
          </div>
        </div>

        <div class="row">
          <OrderFilter />
          <div class="col-xl-9 budget-role-notes">
            <div class="bg-white rounded-3 d-flex align-items-center justify-content-between flex-wrap mb-4 p-3 pb-0">
              <div class="form-sort me-2 mb-3">
                <i data-feather="sliders" class="info-img"></i>
                <select class="select">
                  <option>Sort by A-Z</option>
                  <option>Ascending </option>
                  <option>Descending</option>
                  <option>Recently Viewed </option>
                  <option>Recently Added</option>
                </select>
              </div>
              <div class="d-flex align-items-center mb-3">
                <div class="input-icon-start me-2 position-relative">
                  <span class="icon-addon">
                    <i class="ti ti-calendar"></i>
                  </span>
                  <input
                    type="text"
                    class="form-control date-range bookingrange"
                    placeholder="dd/mm/yyyy - dd/mm/yyyy"
                  />
                </div>
                <div class="search-set">
                  <div class="search-input">
                    <span class="btn-searchset">
                      <i class="ti ti-search fs-14 feather-search"></i>
                    </span>
                    <div class="dataTables_filter">
                      <label>
                        {" "}
                        <input
                          type="search"
                          class="form-control form-control-sm"
                          placeholder="Search"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <OrderList />
            <OrderPagination
              pageCount={10}
              onPageChange={(selected) => console.log(selected)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderWrapper;
