import React from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../Common/PageHeader";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import FilterInputs from "../Common/FilterInputs";
import avatar from "../../assets/img/avatar/avatar-1.jpg";
import { useGetAllInvoicesQuery } from "../../api/invoiceApi";
const CustomerDetails = () => {
  const { id } = useParams();

  // Fetch customer details
  const {
    data: customerData,
    error: customerError,
    isLoading: isCustomerLoading,
  } = useGetCustomerByIdQuery(id);
  const customer = customerData?.data;

  // Fetch all invoices
  const {
    data: invoiceData,
    error: invoiceError,
    isLoading: isInvoiceLoading,
  } = useGetAllInvoicesQuery();
  const invoices = invoiceData?.data?.filter(
    (invoice) => invoice.customerId === id
  );

  if (isCustomerLoading || isInvoiceLoading)
    return <p>Loading customer details...</p>;
  if (customerError || invoiceError) return <p>Error fetching data.</p>;
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
                    <div className="customer-details-cont">
                      <h6>Name</h6>
                      <p>{customer.name}</p>
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
                      <p>{customer.companyName || "N/A"}</p>
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
                        <th class="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
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
                                <i
                                  data-feather="eye"
                                  className="feather-eye"
                                ></i>
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
