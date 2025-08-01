import React, { useState } from "react";
import { useParams } from "react-router-dom";
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
  Accordion,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import {
  useGetCustomerByIdQuery,
  useGetInvoicesByCustomerIdQuery,
} from "../../api/customerApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllOrdersQuery } from "../../api/orderApi"; // Import order hook
import {
  FaEye,
  FaTrash,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaGlobe,
  FaMapMarkerAlt,
} from "react-icons/fa";
import "./customerdetails.css";

const CustomerDetails = () => {
  const { id } = useParams();
  const [activeAccordion, setActiveAccordion] = useState("0");

  // Fetch data
  const {
    data: customerData,
    error: customerError,
    isLoading: isCustomerLoading,
  } = useGetCustomerByIdQuery(id);
  const customer = customerData?.data;

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
      <Container className="text-center my-5">
        <Spinner
          animation="border"
          variant="primary"
          role="status"
          aria-label="Loading"
        />
        <p className="mt-3">Loading customer details...</p>
      </Container>
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
      <Container className="my-5">
        <Alert variant="danger" role="alert">
          Error:{" "}
          {customerError?.data?.message ||
            invoiceError?.data?.message ||
            usersError?.data?.message ||
            addressesError?.data?.message ||
            quotationsError?.data?.message ||
            ordersError?.data?.message ||
            "Unknown error"}
        </Alert>
      </Container>
    );
  }

  // No customer data
  if (!customer) {
    return (
      <Container className="my-5">
        <Alert variant="warning" role="alert">
          No customer data found.
        </Alert>
      </Container>
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
  const formatAddress = (shipTo) => {
    const address = addresses.find((addr) => addr.addressId === shipTo);
    if (!address) return "No address available";
    const { street, city, state, postalCode, country } = address;
    return (
      [street, city, state, postalCode, country].filter(Boolean).join(", ") ||
      "No address available"
    );
  };

  const getUsername = (userId) => {
    const user = users.find((u) => u.userId === userId);
    return user ? user.username || user.name || "Unknown User" : "Unknown User";
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <Container fluid className="customer-details-container">
          <h1 className="page-title mb-4">{customer.name}</h1>

          {/* Accordion for Customer Info, Invoices, Quotations, and Orders */}
          <Accordion
            activeKey={activeAccordion}
            onSelect={(key) => setActiveAccordion(key)}
            className="customer-accordion"
          >
            {/* Customer Information */}
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                <FaUser className="me-2" /> Customer Information
              </Accordion.Header>
              <Accordion.Body>
                <Card className="customer-card shadow-sm">
                  <Card.Body>
                    <Row>
                      <Col md={6} lg={4} className="mb-3">
                        <div className="customer-info d-flex align-items-center">
                          <FaEnvelope className="info-icon me-3" />
                          <div>
                            <h6 className="info-label">Email</h6>
                            <p>{customer.email}</p>
                          </div>
                        </div>
                      </Col>
                      <Col md={6} lg={4} className="mb-3">
                        <div className="customer-info d-flex align-items-center">
                          <FaPhone className="info-icon me-3" />
                          <div>
                            <h6 className="info-label">Phone</h6>
                            <p>{customer.mobileNumber}</p>
                          </div>
                        </div>
                      </Col>
                      <Col md={6} lg={4} className="mb-3">
                        <div className="customer-info d-flex align-items-center">
                          <FaBuilding className="info-icon me-3" />
                          <div>
                            <h6 className="info-label">Company</h6>
                            <p>{customer.companyName || "N/A"}</p>
                          </div>
                        </div>
                      </Col>
                      <Col md={6} lg={4} className="mb-3">
                        <div className="customer-info d-flex align-items-center">
                          <FaGlobe className="info-icon me-3" />
                          <div>
                            <h6 className="info-label">Website</h6>
                            <p>{customer.website || "N/A"}</p>
                          </div>
                        </div>
                      </Col>
                      <Col md={6} lg={4} className="mb-3">
                        <div className="customer-info d-flex align-items-center">
                          <FaMapMarkerAlt className="info-icon me-3" />
                          <div>
                            <h6 className="info-label">Address</h6>
                            <p>{formatAddress(customer.address)}</p>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Accordion.Body>
            </Accordion.Item>

            {/* Invoices */}
            <Accordion.Item eventKey="1">
              <Accordion.Header>
                <FaEye className="me-2" /> Invoices
              </Accordion.Header>
              <Accordion.Body>
                <Card className="shadow-sm">
                  <Card.Body>
                    <div className="table-responsive">
                      <Table hover className="customer-table">
                        <thead>
                          <tr>
                            <th>
                              <input
                                type="checkbox"
                                aria-label="Select all invoices"
                              />
                            </th>
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
                                <input
                                  type="checkbox"
                                  aria-label={`Select invoice ${invoice.invoiceNo}`}
                                />
                              </td>
                              <td>
                                <a
                                  href={`/invoice/${invoice.invoiceId}`}
                                  className="invoice-link"
                                >
                                  {invoice.invoiceNo}
                                </a>
                              </td>
                              <td>{invoice.billTo}</td>
                              <td>{formatAddress(invoice.shipTo)}</td>
                              <td>
                                {new Date(
                                  invoice.invoiceDate
                                ).toLocaleDateString()}
                              </td>
                              <td>
                                {new Date(invoice.dueDate).toLocaleDateString()}
                              </td>
                              <td>${invoice.amount}</td>
                              <td>{getUsername(invoice.createdBy)}</td>
                              <td>
                                <Badge
                                  bg={
                                    invoice.status === "Paid"
                                      ? "success"
                                      : invoice.status === "Unpaid"
                                      ? "danger"
                                      : "warning"
                                  }
                                >
                                  {invoice.status}
                                </Badge>
                              </td>
                              <td className="text-end">
                                <OverlayTrigger
                                  overlay={<Tooltip>View Invoice</Tooltip>}
                                >
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    href={`/invoice/${invoice.invoiceId}`}
                                    target="_blank"
                                    className="me-2 action-btn"
                                    aria-label={`View invoice ${invoice.invoiceNo}`}
                                  >
                                    <FaEye />
                                  </Button>
                                </OverlayTrigger>
                                <OverlayTrigger
                                  overlay={<Tooltip>Delete Invoice</Tooltip>}
                                >
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete"
                                    className="action-btn"
                                    aria-label={`Delete invoice ${invoice.invoiceNo}`}
                                  >
                                    <FaTrash />
                                  </Button>
                                </OverlayTrigger>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </Accordion.Body>
            </Accordion.Item>

            {/* Quotations */}
            <Accordion.Item eventKey="2">
              <Accordion.Header>
                <FaEye className="me-2" /> Quotations
              </Accordion.Header>
              <Accordion.Body>
                <Card className="shadow-sm">
                  <Card.Body>
                    <div className="table-responsive">
                      <Table hover className="customer-table">
                        <thead>
                          <tr>
                            <th>
                              <input
                                type="checkbox"
                                aria-label="Select all quotations"
                              />
                            </th>
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
                          {quotations.map((quotation) => (
                            <tr key={quotation.quotationId}>
                              <td>
                                <input
                                  type="checkbox"
                                  aria-label={`Select quotation ${quotation.reference_number}`}
                                />
                              </td>
                              <td>
                                <a
                                  href={`/quotation/${quotation.quotationId}`}
                                  className="invoice-link"
                                >
                                  {quotation.reference_number || "N/A"}
                                </a>
                              </td>
                              <td>{quotation.document_title}</td>
                              <td>{formatAddress(quotation.shipTo)}</td>
                              <td>
                                {new Date(
                                  quotation.quotation_date
                                ).toLocaleDateString()}
                              </td>
                              <td>
                                {new Date(
                                  quotation.due_date
                                ).toLocaleDateString()}
                              </td>
                              <td>${quotation.finalAmount}</td>
                              <td>{getUsername(quotation.createdBy)}</td>
                              <td className="text-end">
                                <OverlayTrigger
                                  overlay={<Tooltip>View Quotation</Tooltip>}
                                >
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    href={`/quotation/${quotation.quotationId}`}
                                    target="_blank"
                                    className="me-2 action-btn"
                                    aria-label={`View quotation ${quotation.reference_number}`}
                                  >
                                    <FaEye />
                                  </Button>
                                </OverlayTrigger>
                                <OverlayTrigger
                                  overlay={<Tooltip>Delete Quotation</Tooltip>}
                                >
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete"
                                    className="action-btn"
                                    aria-label={`Delete quotation ${quotation.reference_number}`}
                                  >
                                    <FaTrash />
                                  </Button>
                                </OverlayTrigger>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </Accordion.Body>
            </Accordion.Item>

            {/* Orders */}
            <Accordion.Item eventKey="3">
              <Accordion.Header>
                <FaEye className="me-2" /> Orders
              </Accordion.Header>
              <Accordion.Body>
                <Card className="shadow-sm">
                  <Card.Body>
                    <div className="table-responsive">
                      <Table hover className="customer-table">
                        <thead>
                          <tr>
                            <th>
                              <input
                                type="checkbox"
                                aria-label="Select all orders"
                              />
                            </th>
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
                                <input
                                  type="checkbox"
                                  aria-label={`Select order ${order.id}`}
                                />
                              </td>
                              <td>
                                <a
                                  href={`/order/${order.id}`}
                                  className="invoice-link"
                                >
                                  {order.id}
                                </a>
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
                              <td>
                                {order.dueDate
                                  ? new Date(order.dueDate).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td>{order.priority}</td>
                              <td>{getUsername(order.createdBy)}</td>
                              <td className="text-end">
                                <OverlayTrigger
                                  overlay={<Tooltip>View Order</Tooltip>}
                                >
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    href={`/order/${order.id}`}
                                    target="_blank"
                                    className="me-2 action-btn"
                                    aria-label={`View order ${order.id}`}
                                  >
                                    <FaEye />
                                  </Button>
                                </OverlayTrigger>
                                <OverlayTrigger
                                  overlay={<Tooltip>Delete Order</Tooltip>}
                                >
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete"
                                    className="action-btn"
                                    aria-label={`Delete order ${order.id}`}
                                  >
                                    <FaTrash />
                                  </Button>
                                </OverlayTrigger>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Container>
      </div>
    </div>
  );
};

export default CustomerDetails;
