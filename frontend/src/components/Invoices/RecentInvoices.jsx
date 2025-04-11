import React, { useEffect, useState } from "react";
import PageHeader from "../Common/PageHeader";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetAllInvoicesQuery } from "../../api/invoiceApi";
import { useGetCustomersQuery } from "../../api/customerApi";

const RecentInvoices = () => {
  const {
    data: invoiceData,
    isLoading: invoiceLoading,
    error: invoiceError,
  } = useGetAllInvoicesQuery();

  const { data: customerData, isLoading: customerLoading } =
    useGetCustomersQuery();
  const { data: addressData, isLoading: addressLoading } =
    useGetAllAddressesQuery();
  const { data: userData, isLoading: userLoading } = useGetAllUsersQuery();

  const invoices = invoiceData?.data || [];

  const [customerMap, setCustomerMap] = useState({});
  const [addressMap, setAddressMap] = useState({});
  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    if (customerData?.data) {
      const map = {};
      customerData.data.forEach((cust) => {
        map[cust.customerId] = cust.name;
      });
      setCustomerMap(map);
    }

    if (addressData?.data) {
      const map = {};
      addressData.data.forEach((addr) => {
        map[addr.addressId] = [
          addr.street,
          addr.city,
          addr.state,
          addr.country,
          addr.postalCode,
        ]
          .filter(Boolean)
          .join(", ");
      });
      setAddressMap(map);
    }

    if (userData?.data) {
      const map = {};
      userData.data.forEach((user) => {
        map[user.userId] = user.name;
      });
      setUserMap(map);
    }
  }, [customerData, addressData, userData]);

  const isLoading =
    invoiceLoading || customerLoading || addressLoading || userLoading;

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
              {isLoading ? (
                <p className="text-center">Loading...</p>
              ) : invoiceError ? (
                <p className="text-danger text-center">
                  Error: {invoiceError.message}
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
                    {invoices.map((invoice) => (
                      <tr key={invoice.invoiceId}>
                        <td>
                          <input type="checkbox" />
                        </td>
                        <td>
                          <a href={`/invoice/${invoice.invoiceId}`}>
                            {invoice.invoiceNo}
                          </a>
                        </td>
                        <td>
                          {customerMap[invoice.customerId] ||
                            invoice.customerId}
                        </td>
                        <td>{invoice.billTo}</td>
                        <td>{addressMap[invoice.shipTo] || invoice.shipTo}</td>
                        <td>
                          {new Date(invoice.invoiceDate).toLocaleDateString()}
                        </td>
                        <td>
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </td>
                        <td>Rs {invoice.amount}</td>
                        <td>
                          {userMap[invoice.createdBy] || invoice.createdBy}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              invoice.status === "Paid"
                                ? "badge-soft-success"
                                : invoice.status === "Unpaid"
                                ? "badge-soft-danger"
                                : "badge-soft-warning"
                            }`}
                          >
                            <i className="ti ti-point-filled me-1"></i>
                            {invoice.status}
                          </span>
                        </td>
                        <td>
                          <a
                            href={`/invoice/${invoice.invoiceId}`}
                            className="btn btn-light"
                          >
                            View
                          </a>
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
