import React from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../Common/PageHeader";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import FilterInputs from "../Common/FilterInputs";
const CustomerDetails = () => {
  const { id } = useParams();
  const { data, error, isLoading } = useGetCustomerByIdQuery(id);
  const customer = data?.data;

  if (isLoading) return <p>Loading customer details...</p>;
  if (error) return <p>Error fetching customer details.</p>;
  if (!customer) return <p>No customer data found.</p>;

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <PageHeader title="Customer Details" />

        <div className="card customer-details-group">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-xl-3 col-lg-4 col-md-6 col-12">
                <div className="customer-details">
                  <div className="d-flex align-items-center">
                    <span className="customer-widget-img d-inline-flex">
                      <img
                        className="rounded-circle"
                        src={
                          customer.profileImage ||
                          "assets/img/profiles/avatar-placeholder.png"
                        }
                        alt="profile-img"
                      />
                    </span>
                    <div className="customer-details-cont">
                      <h6>{customer.name}</h6>
                      <p>Customer ID: {customer.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-lg-4 col-md-6 col-12">
                <div className="customer-details">
                  <div className="d-flex align-items-center">
                    <span className="customer-widget-icon d-inline-flex">
                      <i className="fe fe-mail"></i>
                    </span>
                    <div className="customer-details-cont">
                      <h6>Email Address</h6>
                      <p>{customer.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-lg-4 col-md-6 col-12">
                <div className="customer-details">
                  <div className="d-flex align-items-center">
                    <span className="customer-widget-icon d-inline-flex">
                      <i className="fe fe-phone"></i>
                    </span>
                    <div className="customer-details-cont">
                      <h6>Phone Number</h6>
                      <p>{customer.mobileNumber}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-lg-4 col-md-6 col-12">
                <div className="customer-details">
                  <div className="d-flex align-items-center">
                    <span className="customer-widget-icon d-inline-flex">
                      <i className="fe fe-briefcase"></i>
                    </span>
                    <div className="customer-details-cont">
                      <h6>Company Name</h6>
                      <p>{customer.company || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-lg-4 col-md-6 col-12">
                <div className="customer-details">
                  <div className="d-flex align-items-center">
                    <span className="customer-widget-icon d-inline-flex">
                      <i className="fe fe-globe"></i>
                    </span>
                    <div className="customer-details-cont">
                      <h6>Website</h6>
                      <p>{customer.website || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-3 col-lg-4 col-md-6 col-12">
                <div className="customer-details">
                  <div className="d-flex align-items-center">
                    <span className="customer-widget-icon d-inline-flex">
                      <i className="fe fe-map-pin"></i>
                    </span>
                    <div className="customer-details-cont">
                      <h6>Address</h6>
                      <p>{customer.address || "No address available"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <FilterInputs />

        <div class="row">
          <div class="col-xl-2 col-lg-4 col-sm-6 col-12 d-flex">
            <div class="card inovices-card w-100">
              <div class="card-body">
                <div class="dash-widget-header">
                  <span class="inovices-widget-icon bg-info-light">
                    <img src="assets/img/icons/receipt-item.svg" alt="img" />
                  </span>
                  <div class="dash-count">
                    <div class="dash-title">Total Invoice</div>
                    <div class="dash-counts">
                      <p>$298</p>
                    </div>
                  </div>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <p class="inovices-all">
                    No of Invoice{" "}
                    <span class="rounded-circle bg-light-gray">02</span>
                  </p>
                  <p class="inovice-trending text-success-light">
                    02{" "}
                    <span class="ms-2">
                      <i class="fe fe-trending-up"></i>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="col-xl-2 col-lg-4 col-sm-6 col-12 d-flex">
            <div class="card inovices-card w-100">
              <div class="card-body">
                <div class="dash-widget-header">
                  <span class="inovices-widget-icon bg-primary-light">
                    <img
                      src="assets/img/icons/transaction-minus.svg"
                      alt="img"
                    />
                  </span>
                  <div class="dash-count">
                    <div class="dash-title">Outstanding</div>
                    <div class="dash-counts">
                      <p>$325,215</p>
                    </div>
                  </div>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <p class="inovices-all">
                    No of Invoice{" "}
                    <span class="rounded-circle bg-light-gray">03</span>
                  </p>
                  <p class="inovice-trending text-success-light">
                    04{" "}
                    <span class="ms-2">
                      <i class="fe fe-trending-up"></i>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="col-xl-2 col-lg-4 col-sm-6 col-12 d-flex">
            <div class="card inovices-card w-100">
              <div class="card-body">
                <div class="dash-widget-header">
                  <span class="inovices-widget-icon bg-warning-light">
                    <img src="assets/img/icons/archive-book.svg" alt="img" />
                  </span>
                  <div class="dash-count">
                    <div class="dash-title">Total Overdue</div>
                    <div class="dash-counts">
                      <p>$7825</p>
                    </div>
                  </div>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <p class="inovices-all">
                    No of Invoice{" "}
                    <span class="rounded-circle bg-light-gray">01</span>
                  </p>
                  <p class="inovice-trending text-danger-light">
                    03{" "}
                    <span class="ms-2">
                      <i class="fe fe-trending-down"></i>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="col-xl-2 col-lg-4 col-sm-6 col-12 d-flex">
            <div class="card inovices-card w-100">
              <div class="card-body">
                <div class="dash-widget-header">
                  <span class="inovices-widget-icon bg-primary-light">
                    <img src="assets/img/icons/clipboard-close.svg" alt="img" />
                  </span>
                  <div class="dash-count">
                    <div class="dash-title">Cancelled</div>
                    <div class="dash-counts">
                      <p>100</p>
                    </div>
                  </div>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <p class="inovices-all">
                    No of Invoice{" "}
                    <span class="rounded-circle bg-light-gray">04</span>
                  </p>
                  <p class="inovice-trending text-danger-light">
                    05{" "}
                    <span class="ms-2">
                      <i class="fe fe-trending-down"></i>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="col-xl-2 col-lg-4 col-sm-6 col-12 d-flex">
            <div class="card inovices-card w-100">
              <div class="card-body">
                <div class="dash-widget-header">
                  <span class="inovices-widget-icon bg-green-light">
                    <img src="assets/img/icons/message-edit.svg" alt="img" />
                  </span>
                  <div class="dash-count">
                    <div class="dash-title">Draft</div>
                    <div class="dash-counts">
                      <p>$125,586</p>
                    </div>
                  </div>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <p class="inovices-all">
                    No of Invoice{" "}
                    <span class="rounded-circle bg-light-gray">06</span>
                  </p>
                  <p class="inovice-trending text-danger-light">
                    02{" "}
                    <span class="ms-2">
                      <i class="fe fe-trending-down"></i>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="col-xl-2 col-lg-4 col-sm-6 col-12 d-flex">
            <div class="card inovices-card w-100">
              <div class="card-body">
                <div class="dash-widget-header">
                  <span class="inovices-widget-icon bg-danger-light">
                    <img src="assets/img/icons/3d-rotate.svg" alt="img" />
                  </span>
                  <div class="dash-count">
                    <div class="dash-title">Recurring</div>
                    <div class="dash-counts">
                      <p>$86,892</p>
                    </div>
                  </div>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <p class="inovices-all">
                    No of Invoice{" "}
                    <span class="rounded-circle bg-light-gray">03</span>
                  </p>
                  <p class="inovice-trending text-success-light">
                    02{" "}
                    <span class="ms-2">
                      <i class="fe fe-trending-up"></i>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-sm-12">
            <div class="card-table">
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-stripped table-hover datatable">
                    <thead class="thead-light">
                      <tr>
                        <th>
                          <label class="custom_check">
                            <input type="checkbox" name="invoice" />
                            <span class="checkmark"></span>
                          </label>
                          Invoice No
                        </th>
                        <th>Category</th>
                        <th>Created On</th>
                        <th>Total Amount</th>
                        <th>Paid Amount</th>
                        <th>Payment Mode</th>
                        <th>Balance</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th class="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <label class="custom_check">
                            <input type="checkbox" name="invoice" />
                            <span class="checkmark"></span>
                          </label>
                          <a href="invoice-details.html" class="invoice-link">
                            #4987
                          </a>
                        </td>
                        <td>Food</td>
                        <td>23 Mar 2023</td>
                        <td>$1,54,220</td>
                        <td>$1,50,000</td>
                        <td>Cash</td>
                        <td>$2,54,00</td>
                        <td>25 Mar 2023</td>
                        <td>
                          <span class="badge bg-success-light">Paid</span>
                        </td>
                        <td>
                          <div class="dropdown dropdown-action">
                            <a
                              href="#"
                              class=" btn-action-icon "
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <i class="fas fa-ellipsis-v"></i>
                            </a>
                            <div class="dropdown-menu dropdown-menu-end customer-dropdown">
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
                                  <a class="dropdown-item" href="#">
                                    <i class="fe fe-send me-2"></i>Send
                                  </a>
                                </li>
                                <li>
                                  <a class="dropdown-item" href="#">
                                    <i class="fe fe-download me-2"></i>Download
                                  </a>
                                </li>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="add-credit-notes.html"
                                  >
                                    <i class="fe fe-file-text me-2"></i>Convert
                                    to Sales Return
                                  </a>
                                </li>
                                <li>
                                  <a class="dropdown-item" href="#">
                                    <i class="fe fe-copy me-2"></i>Clone as
                                    Invoice
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

        <div class="modal custom-modal fade" id="delete_modal" role="dialog">
          <div class="modal-dialog modal-dialog-centered modal-md">
            <div class="modal-content">
              <div class="modal-body">
                <div class="form-header">
                  <h3>Delete Customer Details</h3>
                  <p>Are you sure want to delete?</p>
                </div>
                <div class="modal-btn delete-action">
                  <div class="row">
                    <div class="col-6">
                      <a
                        href="#"
                        data-bs-dismiss="modal"
                        class="btn btn-primary paid-continue-btn"
                      >
                        Delete
                      </a>
                    </div>
                    <div class="col-6">
                      <a
                        href="#"
                        data-bs-dismiss="modal"
                        class="btn btn-primary paid-cancel-btn"
                      >
                        Cancel
                      </a>
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

export default CustomerDetails;
