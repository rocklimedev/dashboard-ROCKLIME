import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import { useGetCustomersQuery } from "../../api/customerApi";

const CustomerList = () => {
  const { data, error, isLoading } = useGetCustomersQuery();
  const customers = data?.data || [];

  const [showModal, setShowModal] = useState(false);
  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching customers.</p>;
  if (customers.length === 0) return <p>No customers available.</p>;
  const handleExport = (type) => {
    console.log(`Exporting as ${type}`);
  };
  return (
    <div class="page-wrapper">
      <div class="content">
        <div class="page-header">
          <div class="add-item d-flex">
            <div class="page-title">
              <h4 class="fw-bold">Customers</h4>
              <h6>Manage your customers</h6>
            </div>
          </div>
          <ul class="table-top-head">
            <li>
              <a data-bs-toggle="tooltip" data-bs-placement="top" title="Pdf">
                <img src="assets/img/icons/pdf.svg" alt="img" />
              </a>
            </li>
            <li>
              <a data-bs-toggle="tooltip" data-bs-placement="top" title="Excel">
                <img src="assets/img/icons/excel.svg" alt="img" />
              </a>
            </li>
            <li>
              <a
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
          <div class="page-btn">
            <a
              href="#"
              class="btn btn-primary text-white"
              data-bs-toggle="modal"
              data-bs-target="#add-customer"
            >
              <i class="ti ti-circle-plus me-1"></i>Add Customer
            </a>
          </div>
        </div>

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
              <div class="dropdown">
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
                      Active
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Inactive
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

                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Company</th>
                    <th>Is Vendor?</th>
                    <th>Total Amount</th>
                    <th>Paid Amount</th>
                    <th>Balance</th>
                    <th>Due Date</th>

                    <th class="no-sort"></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <label class="checkboxs">
                          <input type="checkbox" />
                          <span class="checkmarks"></span>
                        </label>
                      </td>
                      <td>{customer.name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.mobileNumber}</td>
                      <td>{customer.isVendor}</td>
                      <td>{customer.totalAmount}</td>
                      <td>{customer.paidAmount}</td>
                      <td>{customer.balance}</td>
                      <td>{customer.dueDate}</td>
                      <td class="d-flex">
                        <div class="edit-delete-action d-flex align-items-center">
                          <a
                            class="me-2 p-2 d-flex align-items-center border rounded"
                            href="#"
                          >
                            <i data-feather="eye" class="feather-eye"></i>
                          </a>
                          <a
                            class="me-2 p-2 d-flex align-items-center border rounded"
                            href="#"
                            data-bs-toggle="modal"
                            data-bs-target="#edit-customer"
                          >
                            <i data-feather="edit" class="feather-edit"></i>
                          </a>
                          <a
                            data-bs-toggle="modal"
                            data-bs-target="#delete-modal"
                            class="p-2 d-flex align-items-center border rounded"
                            href="javascript:void(0);"
                          >
                            <i
                              data-feather="trash-2"
                              class="feather-trash-2"
                            ></i>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerList;
