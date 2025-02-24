import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import { useGetCustomersQuery } from "../../api/customerApi";

const CustomerList = () => {
  const { data: customers, error, isLoading } = useGetCustomersQuery();
  const [showModal, setShowModal] = useState(false);
  const handleExport = (type) => {
    console.log(`Exporting as ${type}`);
  };
  return (
    <div class="page-wrapper">
      <div class="content container-fluid">
        <PageHeader
          title="Customers"
          actions={{
            refresh: () => window.location.reload(),
            filter: () => console.log("Filter clicked"),
            export: handleExport,
            print: () => window.print(),
            add: () => setShowModal(true),
          }}
        />

        <div class="row">
          <div class="col-sm-12">
            <div class="card-table">
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-center table-hover datatable">
                    <thead class="thead-light">
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Balance </th>
                        <th>Total Invoice </th>
                        <th>Created</th>
                        <th>Status</th>
                        <th class="no-sort">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>1</td>
                        <td>
                          <h2 class="table-avatar">
                            <a
                              href="profile.html"
                              class="avatar avatar-md me-2"
                            >
                              <img
                                class="avatar-img rounded-circle"
                                src="assets/img/profiles/avatar-14.jpg"
                                alt="User Image"
                              />
                            </a>
                            <a href="profile.html">
                              John Smith{" "}
                              <span>
                                <span
                                  class="__cf_email__"
                                  data-cfemail="33595c5b5d73564b525e435f561d505c5e"
                                >
                                  [email&#160;protected]
                                </span>
                              </span>
                            </a>
                          </h2>
                        </td>
                        <td>+1 989-438-3131</td>
                        <td>$4,220</td>
                        <td>2</td>
                        <td>19 Dec 2023, 06:12 PM</td>
                        <td>
                          <span class="badge bg-success-light">Active</span>
                        </td>
                        <td class="d-flex align-items-center">
                          <a href="add-invoice.html" class="btn btn-greys me-2">
                            <i class="fa fa-plus-circle me-1"></i> Invoice
                          </a>
                          <a
                            href="customers-ledger.html"
                            class="btn btn-greys me-2"
                          >
                            <i class="fa-regular fa-eye me-1"></i> Ledger
                          </a>
                          <div class="dropdown dropdown-action">
                            <a
                              href="#"
                              class=" btn-action-icon "
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <i class="fas fa-ellipsis-v"></i>
                            </a>
                            <div class="dropdown-menu dropdown-menu-end">
                              <ul>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="edit-customer.html"
                                  >
                                    <i class="far fa-edit me-2"></i>Edit
                                  </a>
                                </li>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="javascript:void(0);"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete_modal"
                                  >
                                    <i class="far fa-trash-alt me-2"></i>Delete
                                  </a>
                                </li>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="customer-details.html"
                                  >
                                    <i class="far fa-eye me-2"></i>View
                                  </a>
                                </li>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="active-customers.html"
                                  >
                                    <i class="fa-solid fa-power-off me-2"></i>
                                    Activate
                                  </a>
                                </li>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="deactive-customers.html"
                                  >
                                    <i class="far fa-bell-slash me-2"></i>
                                    Deactivate
                                  </a>
                                </li>
                              </ul>
                            </div>
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
      </div>
    </div>
  );
};

export default CustomerList;
