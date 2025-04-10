import React from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../Common/PageHeader";
import {
  useGetCustomerByIdQuery,
  useGetInvoicesByCustomerIdQuery,
} from "../../api/customerApi";
import { useGetAllInvoicesQuery } from "../../api/invoiceApi";
import {
  FaReceipt,
  FaMoneyBillAlt,
  FaArchive,
  FaBan,
  FaRegEdit,
  FaSyncAlt,
} from "react-icons/fa";

const CustomerDetails = () => {
  const { id } = useParams();

  // Fetch customer details
  const {
    data: customerData,
    error: customerError,
    isLoading: isCustomerLoading,
  } = useGetCustomerByIdQuery(id);
  const customer = customerData?.data;

  // Fetch invoices by customerId (skip if customer is undefined)
  const {
    data: invoicesByCustomerData,
    error: invoiceError,
    isLoading: isInvoiceLoading,
  } = useGetInvoicesByCustomerIdQuery(customer?.customerId, {
    skip: !customer?.customerId,
  });

  // Optional: get all invoices (if needed elsewhere)
  // const {
  //   data: allInvoicesData,
  //   error: allInvoicesError,
  //   isLoading: allInvoicesLoading,
  // } = useGetAllInvoicesQuery();

  if (isCustomerLoading || isInvoiceLoading)
    return <p>Loading customer details...</p>;
  if (customerError || invoiceError) return <p>Error fetching data.</p>;
  if (!customer) return <p>No customer data found.</p>;

  const invoices = invoicesByCustomerData?.data || [];

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
