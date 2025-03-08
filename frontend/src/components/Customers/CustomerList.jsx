import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import { useGetCustomersQuery } from "../../api/customerApi";
import AddCustomer from "./AddCustomer";
import Actions from "../Common/Actions";
const CustomerList = () => {
  const { data, error, isLoading } = useGetCustomersQuery();
  const customers = data?.data || [];

  const [showModal, setShowModal] = useState(false);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching customers.</p>;
  if (customers.length === 0) return <p>No customers available.</p>;

  const handleAddCustomer = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const handleDelete = () => alert("To be done!");
  return (
    <div class="page-wrapper">
      <div class="content">
        <PageHeader
          title="Customers"
          subtitle="Manage your Customers"
          onAdd={handleAddCustomer}
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
                        <Actions
                          id={customer.id}
                          name={customer.name}
                          viewUrl={`/users/${customer.id}`}
                          editUrl={`/users/edit/${customer.id}`}
                          onDelete={() => handleDelete(customer.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {showModal ? <AddCustomer onClose={handleCloseModal} /> : null}
    </div>
  );
};

export default CustomerList;
