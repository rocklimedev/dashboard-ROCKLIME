import React, { useEffect, useState } from "react";
import PageHeader from "../Common/PageHeader"; // Assuming it's a custom hook
import { useGetAllInvoicesQuery } from "../../api/invoiceApi";
const RecentInvoices = () => {
  const { data, loading, error } = useGetAllInvoicesQuery();
  const invoices = data?.data || []; // Ensure it's an array

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Recent Invoices"
          subtitle="Manage your Recent Invoices"
        />

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set">
              <div className="search-input">
                <span className="btn-searchset">
                  <i className="ti ti-search fs-14 feather-search"></i>
                </span>
              </div>
            </div>

            {/* Filters */}
            <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
              <div className="dropdown me-2">
                <a
                  href="#"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Customer
                </a>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  {/* Example static customers */}
                  {[
                    "Carl Evans",
                    "Minerva Rameriz",
                    "Robert Lamon",
                    "Patricia Lewis",
                  ].map((name, index) => (
                    <li key={index}>
                      <a href="#" className="dropdown-item rounded-1">
                        {name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status Filter */}
              <div className="dropdown me-2">
                <a
                  href="#"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Status
                </a>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  {["Paid", "Unpaid", "Overdue"].map((status, index) => (
                    <li key={index}>
                      <a href="#" className="dropdown-item rounded-1">
                        {status}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sort By */}
              <div className="dropdown">
                <a
                  href="#"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Sort By: Last 7 Days
                </a>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  {[
                    "Recently Added",
                    "Ascending",
                    "Descending",
                    "Last Month",
                    "Last 7 Days",
                  ].map((sort, index) => (
                    <li key={index}>
                      <a href="#" className="dropdown-item rounded-1">
                        {sort}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="card-body p-0">
            <div className="table-responsive">
              {loading ? (
                <p className="text-center">Loading...</p>
              ) : error ? (
                <p className="text-danger text-center">
                  Error: {error.message}
                </p>
              ) : (
                <table className="table datatable">
                  <thead className="thead-light">
                    <tr>
                      <th className="no-sort">
                        <label className="checkboxs">
                          <input type="checkbox" id="select-all" />
                          <span className="checkmarks"></span>
                        </label>
                      </th>
                      <th>Invoice No</th>
                      <th>Order Id</th>
                      <th>Customer</th>
                      <th>Bill To</th>
                      <th>Ship To</th>
                      <th>Invoice Date</th>
                      <th>Due Date</th>
                      <th>Amount</th>

                      <th>Created By</th>
                      <th>Status</th>
                      <th className="no-sort"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices?.map((invoice) => (
                      <tr key={invoice.invoiceId}>
                        <td>
                          <label className="checkboxs">
                            <input type="checkbox" />
                            <span className="checkmarks"></span>
                          </label>
                        </td>
                        <td>
                          <a href={`invoice-details/${invoice.invoiceId}`}>
                            {invoice.invoiceNo}
                          </a>
                        </td>
                        <td>{invoice.orderId}</td>
                        <td>{invoice.customerId}</td>
                        <td>{invoice.billTo}</td>
                        <td>{invoice.shipTo}</td>
                        <td>
                          {new Date(invoice.invoiceDate).toLocaleDateString()}
                        </td>
                        <td>
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </td>

                        <td>${invoice.amount}</td>
                        <td>{invoice.createdBy}</td>
                        <td>
                          <span
                            className={`badge ${
                              invoice.status === "Paid"
                                ? "badge-soft-success"
                                : invoice.status === "Unpaid"
                                ? "badge-soft-danger"
                                : "badge-soft-warning"
                            } badge-xs shadow-none`}
                          >
                            <i className="ti ti-point-filled me-1"></i>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="d-flex">
                          <div className="edit-delete-action d-flex align-items-center justify-content-center">
                            <a
                              className="me-2 p-2 d-flex align-items-center justify-content-between border rounded"
                              target="_blank"
                              href={`invoices/${invoice.invoiceId}`}
                            >
                              <i data-feather="eye" className="feather-eye"></i>
                            </a>
                            <a
                              className="p-2 d-flex align-items-center justify-content-between border rounded"
                              href="#"
                              data-bs-toggle="modal"
                              data-bs-target="#delete"
                            >
                              <i
                                data-feather="trash-2"
                                className="feather-trash-2"
                              ></i>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentInvoices;
