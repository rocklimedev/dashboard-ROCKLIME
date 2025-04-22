import React from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../Common/PageHeader";
import {
  useGetCustomerByIdQuery,
  useGetInvoicesByCustomerIdQuery,
} from "../../api/customerApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetAllAddressesQuery } from "../../api/addressApi";
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

  // Fetch invoices by customerId
  const {
    data: invoicesByCustomerData,
    error: invoiceError,
    isLoading: isInvoiceLoading,
  } = useGetInvoicesByCustomerIdQuery(customer?.customerId, {
    skip: !customer?.customerId,
  });

  // Fetch all users to map createdBy to username
  const {
    data: usersData,
    error: usersError,
    isLoading: isUsersLoading,
  } = useGetAllUsersQuery();

  // Fetch all addresses to map shipTo to address
  const {
    data: addressesData,
    error: addressesError,
    isLoading: isAddressesLoading,
  } = useGetAllAddressesQuery();

  // Loading and error handling
  if (
    isCustomerLoading ||
    isInvoiceLoading ||
    isUsersLoading ||
    isAddressesLoading
  ) {
    return <p>Loading customer details...</p>;
  }
  if (customerError || invoiceError || usersError || addressesError) {
    return (
      <p>
        Error fetching data:{" "}
        {customerError?.data?.message ||
          invoiceError?.data?.message ||
          usersError?.data?.message ||
          addressesError?.data?.message ||
          "Unknown error"}
      </p>
    );
  }
  if (!customer) {
    return <p>No customer data found.</p>;
  }

  const invoices = invoicesByCustomerData?.data || [];
  const users = usersData?.data || [];
  const addresses = addressesData?.data || [];

  // Log data for debugging
  console.log("Customer:", customer);
  console.log("Invoices:", invoices);
  console.log("Users:", users);
  console.log("Addresses:", addresses);

  // Format address for display
  const formatAddress = (shipTo) => {
    const address = addresses.find((addr) => addr.addressId === shipTo);
    if (!address) return "No address available";
    const { street, city, state, postalCode, country } = address;
    const parts = [street, city, state, postalCode, country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "No address available";
  };

  // Map userId to username
  const getUsername = (userId) => {
    const user = users.find((u) => u.userId === userId);
    return user ? user.username || user.name || "Unknown User" : "Unknown User";
  };

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
                      <p>{formatAddress(customer.address)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-12">
            <div className="card-table">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-stripped table-hover datatable">
                    <thead className="thead-light">
                      <tr>
                        <th>
                          <label className="custom_check">
                            <input type="checkbox" name="invoice" />
                            <span className="checkmark"></span>
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
                        <th className="text-end">Action</th>
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
                            <a href={`/invoice/${invoice.invoiceId}`}>
                              {invoice.invoiceNo}
                            </a>
                          </td>
                          <td>{customer.name}</td>
                          <td>{invoice.billTo}</td>
                          <td>{formatAddress(invoice.shipTo)}</td>
                          <td>
                            {new Date(invoice.invoiceDate).toLocaleDateString()}
                          </td>
                          <td>
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </td>
                          <td>${invoice.amount}</td>
                          <td>{getUsername(invoice.createdBy)}</td>
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
