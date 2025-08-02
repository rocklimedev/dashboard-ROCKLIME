import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Spinner,
  Alert,
  Button,
} from "react-bootstrap";
import {
  useGetCustomerByIdQuery,
  useGetInvoicesByCustomerIdQuery,
} from "../../api/customerApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import {
  FaEye,
  FaTrash,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaMapMarkerAlt,
} from "react-icons/fa";
import Avatar from "react-avatar"; // Import react-avatar
import "./customerdetails.css";

const CustomerDetails = () => {
  const { id } = useParams();

  // Fetch data
  const {
    data: customerData,
    error: customerError,
    isLoading: isCustomerLoading,
    refetch: refetchCustomer,
  } = useGetCustomerByIdQuery(id);
  const customer = customerData?.data || {};

  const {
    data: invoicesData,
    error: invoiceError,
    isLoading: isInvoiceLoading,
  } = useGetInvoicesByCustomerIdQuery(customer?.customerId, {
    skip: !customer?.customerId,
  });

  const {
    data: usersData,
    error: usersError,
    isLoading: isUsersLoading,
  } = useGetAllUsersQuery();

  const {
    data: addressesData,
    error: addressesError,
    isLoading: isAddressesLoading,
  } = useGetAllAddressesQuery();

  const {
    data: quotationsData,
    error: quotationsError,
    isLoading: isQuotationsLoading,
  } = useGetAllQuotationsQuery(
    { customerId: customer?.customerId },
    { skip: !customer?.customerId }
  );

  const {
    data: ordersData,
    error: ordersError,
    isLoading: isOrdersLoading,
  } = useGetAllOrdersQuery();

  // Loading state
  if (
    isCustomerLoading ||
    isInvoiceLoading ||
    isUsersLoading ||
    isAddressesLoading ||
    isQuotationsLoading ||
    isOrdersLoading
  ) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (
    customerError ||
    invoiceError ||
    usersError ||
    addressesError ||
    quotationsError ||
    ordersError
  ) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="danger">
            Error loading customer:{" "}
            {customerError?.data?.message ||
              invoiceError?.data?.message ||
              usersError?.data?.message ||
              addressesError?.data?.message ||
              quotationsError?.data?.message ||
              ordersError?.data?.message ||
              "Unknown error"}
            <Button variant="link" onClick={refetchCustomer}>
              Retry
            </Button>
          </Alert>
        </div>
      </div>
    );
  }

  // No customer data
  if (!customer || !customer.customerId) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Alert variant="warning">
            No customer found.
            <Link to="/customers/list" className="btn btn-link">
              Back to Customers
            </Link>
          </Alert>
        </div>
      </div>
    );
  }

  const invoices = invoicesData?.data || [];
  const users = usersData?.data || [];
  const addresses = addressesData?.data || [];
  const quotations = Array.isArray(quotationsData)
    ? quotationsData
    : quotationsData?.data || [];
  const orders = (ordersData?.orders || []).filter(
    (order) => order.createdFor === customer.customerId
  );

  // Helper functions
  const formatAddress = (address) => {
    if (!address) return "N/A";
    const { street, city, state, postalCode, country } = address;
    return (
      [street, city, state, postalCode, country]
        .filter(Boolean)
        .join(", ")
        .trim() || "N/A"
    );
  };

  const getUsername = (userId) => {
    const user = users.find((u) => u.userId === userId);
    return user ? user.username || user.name || "Unknown User" : "Unknown User";
  };

  const formatDate = (date) => {
    return date
      ? new Date(date).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";
  };

  const getInvoiceStatusBadge = (status) => {
    const statusColors = {
      Paid: "success",
      Overdue: "danger",
      Cancelled: "secondary",
      "Partially Paid": "warning",
      Undue: "info",
      Draft: "primary",
    };
    return (
      <Badge bg={statusColors[status] || "secondary"}>{status || "N/A"}</Badge>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div>
            <Link
              to="/customers/list"
              className="d-inline-flex align-items-center"
            >
              <i className="ti ti-chevron-left me-2"></i>Back to List
            </Link>
          </div>
          <ul className="table-top-head">
            <li className="me-2">
              <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Refresh"
                onClick={refetchCustomer}
              >
                <i className="ti ti-refresh"></i>
              </a>
            </li>
            <li className="me-2">
              <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Collapse"
                id="collapse-header"
              >
                <i className="ti ti-chevron-up"></i>
              </a>
            </li>
          </ul>
        </div>
        <div className="row">
          <div className="col-xl-4 theiaStickySidebar">
            <div className="card rounded-0 border-0">
              <div className="card-header rounded-0 bg-primary d-flex align-items-center">
                <span className="avatar avatar-xl avatar-rounded flex-shrink-0 border border-white border-3 me-3">
                  <Avatar
                    name={customer.name || "Customer"} // Use customer name for initials
                    src={customer.avatar || "/assets/img/users/user-32.jpg"} // Use avatar URL or fallback
                    size="60" // Match the size of the previous image
                    round={true} // Rounded avatar
                    className="rounded"
                    color="#4A90E2" // Optional: Customize background color
                    textSizeRatio={2.5} // Optional: Adjust text size for initials
                    alt={`Avatar of ${customer.name || "Customer"}`}
                  />
                </span>
                <div className="me-3">
                  <h6 className="text-white mb-1">{customer.name || "N/A"}</h6>
                  <span className="badge bg-purple-transparent text-purple">
                    {customer.isVendor ? "Vendor/Customer" : "Customer"}
                  </span>
                </div>
                <div>
                  <Link to={`/customers/list`} className="btn btn-white">
                    Edit Customer
                  </Link>
                </div>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    <i className="ti ti-id me-2"></i>
                    Customer ID
                  </span>
                  <p className="text-dark">{customer.customerId}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    <i className="ti ti-building me-2"></i>
                    Company
                  </span>
                  <p className="text-dark">{customer.companyName || "N/A"}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    <i className="ti ti-user me-2"></i>
                    Vendor ID
                  </span>
                  <p className="text-dark">{customer.vendorId || "N/A"}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="d-inline-flex align-items-center">
                    <i className="ti ti-calendar-check me-2"></i>
                    Created At
                  </span>
                  <p className="text-dark">{formatDate(customer.createdAt)}</p>
                </div>
              </div>
            </div>
            <div className="card rounded-0 border-0 mt-3">
              <div className="card-header border-0 rounded-0 bg-light">
                <h6>Financial Summary</h6>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span>Total Amount</span>
                  <p className="text-dark">
                    Rs. {customer.totalAmount?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span>Paid Amount</span>
                  <p className="text-dark">
                    Rs. {customer.paidAmount?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span>Balance</span>
                  <p className="text-dark">
                    Rs. {customer.balance?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-8">
            <div className="card rounded-0 border-0">
              <div className="card-header border-0 rounded-0 bg-light">
                <h6>Basic Information</h6>
              </div>
              <div className="card-body pb-0">
                <div className="row">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-13 mb-2">Phone</p>
                      <span className="text-gray-900 fs-13">
                        {customer.mobileNumber || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-13 mb-2">Email</p>
                      <span className="text-gray-900 fs-13">
                        <a href={`mailto:${customer.email}`}>
                          {customer.email || "N/A"}
                        </a>
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-13 mb-2">Address</p>
                      <span className="text-gray-900 fs-13">
                        {formatAddress(customer.address)}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-13 mb-2">Payment Mode</p>
                      <span className="text-gray-900 fs-13">
                        {customer.paymentMode || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-13 mb-2">Invoice Status</p>
                      <span className="text-gray-900 fs-13">
                        {getInvoiceStatusBadge(customer.invoiceStatus)}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <p className="fs-13 mb-2">Due Date</p>
                      <span className="text-gray-900 fs-13">
                        {formatDate(customer.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Invoices */}
            <div className="card rounded-0 border-0">
              <div className="card-header border-0 rounded-0 bg-light">
                <h6>Invoices</h6>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <Table hover className="table table-borderless">
                    <thead>
                      <tr>
                        <th>Invoice No</th>
                        <th>Bill To</th>
                        <th>Ship To</th>
                        <th>Invoice Date</th>
                        <th>Due Date</th>
                        <th>Amount</th>
                        <th>Created By</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.invoiceId}>
                          <td>
                            <Link
                              to={`/invoice/${invoice.invoiceId}`}
                              className="text-primary"
                            >
                              {invoice.invoiceNo}
                            </Link>
                          </td>
                          <td>{invoice.billTo}</td>
                          <td>{formatAddress(invoice.shipTo)}</td>
                          <td>{formatDate(invoice.invoiceDate)}</td>
                          <td>{formatDate(invoice.dueDate)}</td>
                          <td>Rs. {Number(invoice.amount || 0).toFixed(2)}</td>
                          <td>{getUsername(invoice.createdBy)}</td>
                          <td>{getInvoiceStatusBadge(invoice.status)}</td>
                          <td className="text-end">
                            <Link
                              to={`/invoice/${invoice.invoiceId}`}
                              className="btn btn-sm btn-outline-primary me-2"
                              title="View Invoice"
                            >
                              <FaEye />
                            </Link>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              href="#"
                              data-bs-toggle="modal"
                              data-bs-target="#delete"
                              title="Delete Invoice"
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>
            {/* Quotations */}
            <div className="card rounded-0 border-0">
              <div className="card-header border-0 rounded-0 bg-light">
                <h6>Quotations</h6>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <Table hover className="table table-borderless">
                    <thead>
                      <tr>
                        <th>Quotation No</th>
                        <th>Title</th>
                        <th>Ship To</th>
                        <th>Quotation Date</th>
                        <th>Due Date</th>
                        <th>Final Amount</th>
                        <th>Created By</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(customer.quotations || []).map((quotation) => (
                        <tr key={quotation.quotationId}>
                          <td>
                            <Link
                              to={`/quotation/${quotation.quotationId}`}
                              className="text-primary"
                            >
                              {quotation.reference_number || "N/A"}
                            </Link>
                          </td>
                          <td>{quotation.document_title || "N/A"}</td>
                          <td>{formatAddress(quotation.shipTo)}</td>
                          <td>{formatDate(quotation.quotation_date)}</td>
                          <td>{formatDate(quotation.due_date)}</td>
                          <td>
                            Rs. {quotation.finalAmount?.toFixed(2) || "0.00"}
                          </td>
                          <td>{getUsername(quotation.createdBy)}</td>
                          <td className="text-end">
                            <Link
                              to={`/quotation/${quotation.quotationId}`}
                              className="btn btn-sm btn-outline-primary me-2"
                              title="View Quotation"
                            >
                              <FaEye />
                            </Link>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              href="#"
                              data-bs-toggle="modal"
                              data-bs-target="#delete"
                              title="Delete Quotation"
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>
            {/* Orders */}
            <div className="card rounded-0 border-0">
              <div className="card-header border-0 rounded-0 bg-light">
                <h6>Orders</h6>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <Table hover className="table table-borderless">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Priority</th>
                        <th>Created By</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <Link
                              to={`/order/${order.id}`}
                              className="text-primary"
                            >
                              {order.id}
                            </Link>
                          </td>
                          <td>{order.title}</td>
                          <td>
                            <Badge
                              bg={
                                order.status === "DELIVERED"
                                  ? "success"
                                  : order.status === "CANCELED"
                                  ? "danger"
                                  : "warning"
                              }
                            >
                              {order.status}
                            </Badge>
                          </td>
                          <td>{formatDate(order.dueDate)}</td>
                          <td>{order.priority}</td>
                          <td>{getUsername(order.createdBy)}</td>
                          <td className="text-end">
                            <Link
                              to={`/order/${order.id}`}
                              className="btn btn-sm btn-outline-primary me-2"
                              title="View Order"
                            >
                              <FaEye />
                            </Link>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              href="#"
                              data-bs-toggle="modal"
                              data-bs-target="#delete"
                              title="Delete Order"
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
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
