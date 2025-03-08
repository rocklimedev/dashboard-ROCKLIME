import React from "react";
import PageHeader from "../Common/PageHeader";

const RecentInvoices = () => {
  return (
    <div class="page-wrapper">
      <div class="content">
        <PageHeader
          title="Recent Invoices"
          subtitle="Manage your Recent Invoices"
        />

        <div class="card">
          <div class="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div class="search-set">
              <div class="search-input">
                <span class="btn-searchset">
                  <i class="ti ti-search fs-14 feather-search"></i>
                </span>
              </div>
            </div>
            <div class="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
              <div class="dropdown me-2">
                <a
                  href="javascript:void(0);"
                  class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Customer
                </a>
                <ul class="dropdown-menu  dropdown-menu-end p-3">
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Carl Evans
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Minerva Rameriz
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Robert Lamon
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Patricia Lewis
                    </a>
                  </li>
                </ul>
              </div>
              <div class="dropdown me-2">
                <a
                  href="javascript:void(0);"
                  class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Status
                </a>
                <ul class="dropdown-menu  dropdown-menu-end p-3">
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Paid
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Unpaid
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Overdue
                    </a>
                  </li>
                </ul>
              </div>
              <div class="dropdown">
                <a
                  href="javascript:void(0);"
                  class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Sort By : Last 7 Days
                </a>
                <ul class="dropdown-menu  dropdown-menu-end p-3">
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Recently Added
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Ascending
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Desending
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Last Month
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Last 7 Days
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table datatable">
                <thead class="thead-light">
                  <tr>
                    <th class="no-sort">
                      <label class="checkboxs">
                        <input type="checkbox" id="select-all" />
                        <span class="checkmarks"></span>
                      </label>
                    </th>
                    <th>Invoice No</th>
                    <th>Customer</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Amount Due</th>
                    <th>Status</th>
                    <th class="no-sort"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <label class="checkboxs">
                        <input type="checkbox" />
                        <span class="checkmarks"></span>
                      </label>
                    </td>
                    <td>
                      <a href="invoice-details-2.html">INV001</a>
                    </td>
                    <td>
                      <div class="d-flex align-items-center">
                        <a
                          href="javascript:void(0);"
                          class="avatar avatar-md me-2"
                        >
                          <img
                            src="assets/img/users/user-27.jpg"
                            alt="product"
                          />
                        </a>
                        <a href="javascript:void(0);">Carl Evans</a>
                      </div>
                    </td>
                    <td>24 Dec 2024</td>
                    <td>$1000</td>
                    <td>$1000</td>
                    <td>$0.00</td>
                    <td>
                      <span class="badge badge-soft-success badge-xs shadow-none">
                        <i class="ti ti-point-filled me-1"></i>Paid
                      </span>
                    </td>
                    <td class="d-flex">
                      <div class="edit-delete-action d-flex align-items-center justify-content-center">
                        <a
                          class="me-2 p-2 d-flex align-items-center justify-content-between border rounded"
                          href="invoice-details.html"
                        >
                          <i data-feather="eye" class="feather-eye"></i>
                        </a>
                        <a
                          class="p-2 d-flex align-items-center justify-content-between border rounded"
                          href="javascript:void(0);"
                          data-bs-toggle="modal"
                          data-bs-target="#delete"
                        >
                          <i data-feather="trash-2" class="feather-trash-2"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentInvoices;
