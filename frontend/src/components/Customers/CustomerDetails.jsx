import React, { useState } from "react";
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
  Modal,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import {
  useGetCustomerByIdQuery,
  useGetInvoicesByCustomerIdQuery,
} from "../../api/customerApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import {
  useGetAllAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} from "../../api/addressApi";
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
import Avatar from "react-avatar";
import "./customerdetails.css";
import { LeftOutlined, CalendarOutlined } from "@ant-design/icons";
import { Form as AntdForm, Input, Button as AntdButton } from "antd";
import { toast } from "react-toastify";
import { Helmet } from "react-helmet";
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
    refetch: refetchAddresses,
  } = useGetAllAddressesQuery(
    { customerId: customer?.customerId },
    { skip: !customer?.customerId }
  );

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

  const [createAddress, { isLoading: isCreatingAddress }] =
    useCreateAddressMutation();
  const [updateAddress, { isLoading: isUpdatingAddress }] =
    useUpdateAddressMutation();
  const [deleteAddress, { isLoading: isDeletingAddress }] =
    useDeleteAddressMutation();

  // State management
  const [activeTab, setActiveTab] = useState("quotations");
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm] = AntdForm.useForm();

  // Filter addresses by customerId
  const customerAddresses =
    addressesData?.filter(
      (address) => address.customerId === customer.customerId
    ) || [];

  // Derive first address for Basic Information
  const address =
    customerAddresses.length > 0
      ? `${customerAddresses[0].street || ""}, ${
          customerAddresses[0].city || ""
        }, ${customerAddresses[0].state || ""}, ${
          customerAddresses[0].country || ""
        } ${customerAddresses[0].postalCode || ""}`.trim()
      : "N/A";

  // Calculate financial summary from quotations
  const quotations = Array.isArray(quotationsData?.data)
    ? quotationsData.data.filter((q) => q.customerId === customer.customerId)
    : Array.isArray(quotationsData)
    ? quotationsData.filter((q) => q.customerId === customer.customerId)
    : [];
  const totalAmount = (
    Number(
      quotations.reduce(
        (sum, quotation) => sum + (Number(quotation.finalAmount) || 0),
        0
      )
    ) || 0
  ).toFixed(2);
  const paidAmount = "0.00"; // Placeholder: No payment data in quotations table
  const balance = totalAmount; // Since paidAmount is 0, balance equals totalAmount
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
            Error loading data:{" "}
            {customerError?.data?.message ||
              invoiceError?.data?.message ||
              usersError?.data?.message ||
              addressesError?.data?.message ||
              quotationsError?.data?.message ||
              ordersError?.data?.message ||
              "Unknown error"}
            <Button
              variant="link"
              onClick={() => {
                refetchCustomer();
                refetchAddresses();
              }}
            >
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

  // Address Modal Handlers
  const showAddressModal = (address = null) => {
    setEditingAddress(address);
    if (address) {
      addressForm.setFieldsValue({
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        postalCode: address.postalCode || "",
        country: address.country || "",
      });
    } else {
      addressForm.resetFields();
    }
    setIsAddressModalVisible(true);
  };

  const handleAddressSubmit = async (values) => {
    try {
      if (editingAddress) {
        await updateAddress({
          addressId: editingAddress.addressId,
          updatedData: { ...values, customerId: customer.customerId },
        }).unwrap();
      } else {
        await createAddress({
          ...values,
          customerId: customer.customerId,
        }).unwrap();
      }
      setIsAddressModalVisible(false);
      addressForm.resetFields();
      refetchAddresses();
    } catch (error) {
      toast.error(
        `Failed to ${editingAddress ? "update" : "add"} address: ${
          error.data?.message || "Unknown error"
        }`
      );
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await deleteAddress(addressId).unwrap();
      refetchAddresses();
    } catch (error) {
      toast.error(
        `Failed to delete address: ${error.data?.message || "Unknown error"}`
      );
    }
  };

  // Address table columns
  const addressColumns = [
    {
      title: "Street",
      dataIndex: "street",
      key: "street",
      render: (text) => text || "N/A",
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
      render: (text) => text || "N/A",
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
      render: (text) => text || "N/A",
    },
    {
      title: "Postal Code",
      dataIndex: "postalCode",
      key: "postalCode",
      render: (text) => text || "N/A",
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      render: (text) => text || "N/A",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div>
          <Button
            variant="link"
            onClick={() => showAddressModal(record)}
            className="text-primary"
          >
            Edit
          </Button>
          <Button
            variant="link"
            className="text-danger"
            onClick={() => handleDeleteAddress(record.addressId)}
            disabled={isDeletingAddress}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Tooltip for Financial Summary
  const renderTooltip = (props) => (
    <Tooltip id="financial-summary-tooltip" {...props}>
      Financial summary is based on quotations only, not orders. Paid amount is
      unavailable as it is not tracked in quotations.
    </Tooltip>
  );

  return (
    <div className="page-wrapper">
      <Helmet>
        <title>{customer?.name}</title>
      </Helmet>
      <div className="content">
        <div className="page-header">
          <div>
            <Link
              to="/customers/list"
              className="d-inline-flex align-items-center"
            >
              <LeftOutlined />
              Back to List
            </Link>
          </div>
        </div>
        <div className="row">
          <div className="col-xl-4 theiaStickySidebar">
            <div className="card rounded-0 border-0">
              <div className="card-header rounded-0 bg-primary d-flex align-items-center">
                <span className="avatar avatar-xl flex-shrink-0 border border-white border-3 me-3">
                  <Avatar
                    name={customer.name || "Customer"}
                    src={customer.avatar || "/assets/img/users/user-32.jpg"}
                    size="60"
                    round={true}
                    color="#4A90E2"
                    textSizeRatio={2.5}
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
                  <Link
                    to={`/customers/edit/${customer.customerId}`}
                    state={{ customer }} // ← THIS IS THE MISSING LINE!
                    className="btn btn-white"
                  >
                    Edit Customer
                  </Link>
                </div>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="d-inline-flex align-items-center">
                    <FaBuilding />
                    Company
                  </span>
                  <p className="text-dark">{customer.companyName || "N/A"}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="d-inline-flex align-items-center">
                    <CalendarOutlined />
                    Date
                  </span>
                  <p className="text-dark">{formatDate(customer.createdAt)}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="d-inline-flex align-items-center">
                    <FaMapMarkerAlt />
                    Primary Address
                  </span>
                  <p className="text-dark">{address}</p>
                </div>
              </div>
            </div>
            <div className="card rounded-0 border-0 mt-3">
              <div className="card-header border-0 rounded-0 bg-light">
                <OverlayTrigger placement="top" overlay={renderTooltip}>
                  <h6>Financial Summary</h6>
                </OverlayTrigger>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span>Total Amount</span>
                  <p className="text-dark">Rs. {totalAmount}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span>Paid Amount</span>
                  <p className="text-dark">Rs. {paidAmount}</p>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span>Balance</span>
                  <p className="text-dark">Rs. {balance}</p>
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
                      <span className="text-gray-900 fs-13">{address}</span>
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
                      <p className="fs-13 mb-2">Due Date</p>
                      <span className="text-gray-900 fs-13">
                        {formatDate(customer.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card rounded-0 border-0">
              <div className="card-header border-0 rounded-0 bg-light">
                <ul
                  className="nav nav-pills border d-inline-flex p-1 rounded bg-light"
                  id="pills-tab"
                  role="tablist"
                >
                  {["Quotations", "Orders", "Addresses"].map((tab) => (
                    <li className="nav-item" role="presentation" key={tab}>
                      <button
                        className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${
                          activeTab === tab.toLowerCase() ? "active" : ""
                        }`}
                        id={`tab-${tab}`}
                        data-bs-toggle="pill"
                        data-bs-target={`#pills-${tab}`}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.toLowerCase()}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                      >
                        {tab}
                      </button>
                    </li>
                  ))}
                </ul>
                {activeTab === "addresses" && (
                  <Button
                    variant="primary"
                    className="float-end"
                    onClick={() => showAddressModal()}
                  >
                    Add Address
                  </Button>
                )}
              </div>
              <div className="card-body">
                <div className="tab-content" id="pills-tabContent">
                  <div
                    className={`tab-pane fade ${
                      activeTab === "quotations" ? "show active" : ""
                    }`}
                    id="pills-Quotations"
                    role="tabpanel"
                    aria-labelledby="tab-Quotations"
                  >
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
                          {quotations.map((quotation) => (
                            <tr key={quotation.quotationId}>
                              <td>
                                <Link
                                  to={`/quotations/${quotation.quotationId}`}
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
                                Rs.{" "}
                                {(Number(quotation.finalAmount) || 0).toFixed(
                                  2
                                )}
                              </td>
                              <td>{getUsername(quotation.createdBy)}</td>
                              <td className="text-end">
                                <Link
                                  to={`/quotations/${quotation.quotationId}`}
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
                  <div
                    className={`tab-pane fade ${
                      activeTab === "orders" ? "show active" : ""
                    }`}
                    id="pills-Orders"
                    role="tabpanel"
                    aria-labelledby="tab-Orders"
                  >
                    <div className="table-responsive">
                      <Table hover className="table table-borderless">
                        <thead>
                          <tr>
                            <th>Order Number</th>
                            <th>Status</th>
                            <th>Due Date</th>
                            <th>Priority</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order) => (
                            <tr key={order.id}>
                              <td>{order.orderNo}</td>
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
                              <td>
                                <span
                                  className={`priority-badge ${
                                    order.priority?.toLowerCase() || "medium"
                                  }`}
                                >
                                  {order.priority || "Medium"}
                                </span>
                              </td>
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
                  <div
                    className={`tab-pane fade ${
                      activeTab === "addresses" ? "show active" : ""
                    }`}
                    id="pills-Addresses"
                    role="tabpanel"
                    aria-labelledby="tab-Addresses"
                  >
                    <div className="table-responsive">
                      <Table hover className="table table-borderless">
                        <thead>
                          <tr>
                            <th>Street</th>
                            <th>City</th>
                            <th>State</th>
                            <th>Postal Code</th>
                            <th>Country</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerAddresses.map((address) => (
                            <tr key={address.addressId}>
                              <td>{address.street || "N/A"}</td>
                              <td>{address.city || "N/A"}</td>
                              <td>{address.state || "N/A"}</td>
                              <td>{address.postalCode || "N/A"}</td>
                              <td>{address.country || "N/A"}</td>
                              <td className="text-end">
                                <Button
                                  variant="link"
                                  onClick={() => showAddressModal(address)}
                                  className="text-primary"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="link"
                                  className="text-danger"
                                  onClick={() =>
                                    handleDeleteAddress(address.addressId)
                                  }
                                  disabled={isDeletingAddress}
                                >
                                  Delete
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

        {/* Address Modal */}
        <Modal
          show={isAddressModalVisible}
          onHide={() => setIsAddressModalVisible(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {editingAddress ? "Edit Address" : "Add Address"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <AntdForm
              form={addressForm}
              onFinish={handleAddressSubmit}
              layout="vertical"
            >
              <AntdForm.Item
                name="street"
                label="Street"
                rules={[{ required: true, message: "Please enter the street" }]}
              >
                <Input />
              </AntdForm.Item>
              <AntdForm.Item
                name="city"
                label="City"
                rules={[{ required: true, message: "Please enter the city" }]}
              >
                <Input />
              </AntdForm.Item>
              <AntdForm.Item
                name="state"
                label="State"
                rules={[{ required: true, message: "Please enter the state" }]}
              >
                <Input />
              </AntdForm.Item>
              <AntdForm.Item
                name="postalCode"
                label="Postal Code"
                rules={[
                  { required: true, message: "Please enter the postal code" },
                ]}
              >
                <Input />
              </AntdForm.Item>
              <AntdForm.Item
                name="country"
                label="Country"
                rules={[
                  { required: true, message: "Please enter the country" },
                ]}
              >
                <Input />
              </AntdForm.Item>
            </AntdForm>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setIsAddressModalVisible(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => addressForm.submit()}
              disabled={isCreatingAddress || isUpdatingAddress}
            >
              {editingAddress ? "Update Address" : "Add Address"}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default CustomerDetails;
