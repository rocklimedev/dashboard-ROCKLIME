import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Dropdown,
  Form,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  useGetAllInvoicesQuery,
  useDeleteInvoiceMutation,
} from "../../api/invoiceApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { FaEye, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import EditInvoice from "./EditInvoice";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import "./recentinvoices.css";

const RecentInvoices = () => {
  const {
    data: invoiceData,
    isLoading: invoiceLoading,
    error: invoiceError,
  } = useGetAllInvoicesQuery();
  const {
    data: customerData,
    isLoading: customerLoading,
    error: customerError,
  } = useGetCustomersQuery();
  const {
    data: addressData,
    isLoading: addressLoading,
    error: addressError,
  } = useGetAllAddressesQuery();
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useGetAllUsersQuery();
  const [deleteInvoice, { isLoading: isDeleting }] = useDeleteInvoiceMutation();

  const invoices = invoiceData?.data || [];
  const customers = customerData?.data || [];
  const addresses = addressData?.data || [];
  const users = userData?.users || [];

  // State management
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Memoized maps
  const customerMap = useMemo(() => {
    const map = {};
    customers.forEach((cust) => {
      if (cust.customerId && typeof cust.customerId === "string") {
        map[cust.customerId.trim()] = cust.name || "Unnamed Customer";
      }
    });
    return map;
  }, [customers]);

  const addressMap = useMemo(() => {
    const map = {};
    addresses.forEach((addr) => {
      const addressParts = [
        addr.street,
        addr.city,
        addr.state,
        addr.postalCode || addr.zip,
        addr.country,
      ].filter((part) => part != null && part !== "");
      map[addr.addressId] =
        addressParts.length > 0
          ? addressParts.join(", ")
          : "Incomplete Address";
    });
    return map;
  }, [addresses]);

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((user) => {
      map[user.userId] = user.name || "Unknown User";
    });
    return map;
  }, [users]);

  const statuses = useMemo(() => {
    const invoiceStatuses = [
      ...new Set(invoices.map((inv) => inv.status).filter(Boolean)),
    ];
    const customerStatuses = [
      ...new Set(customers.map((cust) => cust.invoiceStatus).filter(Boolean)),
    ];
    return (
      [...new Set([...invoiceStatuses, ...customerStatuses])] || [
        "Paid",
        "Unpaid",
        "Overdue",
        "Draft",
      ]
    );
  }, [invoices, customers]);

  const getInvoiceStatus = (invoice) => {
    if (invoice.status && invoice.status !== "N/A" && invoice.status !== "")
      return invoice.status;
    if (!invoice.customerId || typeof invoice.customerId !== "string")
      return "Unknown";
    const customer = customers.find(
      (cust) => cust.customerId === invoice.customerId.trim()
    );
    return customer?.invoiceStatus || "Unknown";
  };

  const normalizeName = (name) =>
    name
      ?.toLowerCase()
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "N/A";

  // Filtered and sorted invoices
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    if (selectedCustomer) {
      result = result.filter(
        (inv) =>
          inv.customerId &&
          typeof inv.customerId === "string" &&
          inv.customerId.trim() === selectedCustomer
      );
    }

    if (selectedStatus) {
      result = result.filter((inv) => getInvoiceStatus(inv) === selectedStatus);
    }

    if (searchQuery) {
      result = result.filter((inv) => {
        const customerName =
          inv.customerId && customerMap[inv.customerId?.trim()]
            ? customerMap[inv.customerId.trim()]
            : normalizeName(inv.billTo);
        return (
          inv.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.billTo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (inv.shipTo &&
            addressMap[inv.shipTo]
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()))
        );
      });
    }

    switch (sortBy) {
      case "Ascending":
        result.sort((a, b) => a.invoiceNo.localeCompare(b.invoiceNo));
        break;
      case "Descending":
        result.sort((a, b) => b.invoiceNo.localeCompare(a.invoiceNo));
        break;
      case "Recently Added":
        result.sort(
          (a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate)
        );
        break;
      case "Last 7 Days":
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        result = result.filter(
          (inv) => inv.invoiceDate && new Date(inv.invoiceDate) >= sevenDaysAgo
        );
        result.sort(
          (a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate)
        );
        break;
      case "Last Month":
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        result = result.filter(
          (inv) => inv.invoiceDate && new Date(inv.invoiceDate) >= oneMonthAgo
        );
        result.sort(
          (a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate)
        );
        break;
      default:
        break;
    }

    return result;
  }, [
    invoices,
    selectedCustomer,
    selectedStatus,
    sortBy,
    searchQuery,
    customerMap,
    addressMap,
  ]);

  // Paginated invoices
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInvoices.slice(startIndex, endIndex);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  // Handlers
  const handleSelectAll = () => {
    const currentPageInvoices = paginatedInvoices.map((inv) => inv.invoiceId);
    setSelectedInvoices(
      selectedInvoices.length === currentPageInvoices.length
        ? []
        : currentPageInvoices
    );
  };

  const toggleInvoice = (id) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleEditClick = (invoice) => {
    setSelectedInvoice(invoice);
    setShowEditModal(true);
  };

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const confirmDelete = async (invoice) => {
    try {
      await deleteInvoice(invoice.invoiceId).unwrap();
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
      if (paginatedInvoices.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      alert("Failed to delete invoice. Please try again.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setInvoiceToDelete(null);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelectedInvoices([]);
  };

  const isLoading =
    invoiceLoading || customerLoading || addressLoading || userLoading;
  const hasError = invoiceError || customerError || addressError || userError;

  return (
    <div className="page-wrapper notes-page-wrapper">
      <div className="content">
        <Container fluid className="recent-invoices-container">
          <h1 className="page-title">Recent Invoices</h1>
          <p className="page-subtitle">Manage your recent invoices</p>

          {isLoading && (
            <div className="text-center my-5">
              <Spinner
                animation="border"
                variant="primary"
                role="status"
                aria-label="Loading invoices"
              />
              <p>Loading invoices...</p>
            </div>
          )}
          {hasError && (
            <Alert variant="danger" role="alert" className="my-4">
              Error loading data: {JSON.stringify(hasError)}. Please try again.
            </Alert>
          )}

          <div className="filters-section mb-4">
            <Row className="align-items-center">
              <Col md={6} lg={4} className="mb-3">
                <div className="search-input-wrapper">
                  <FaSearch className="search-icon" />
                  <Form.Control
                    type="text"
                    placeholder="Search invoices, customers, or addresses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search invoices"
                  />
                </div>
              </Col>
              <Col md={6} lg={4} className="mb-3">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" className="w-100">
                    {selectedCustomer
                      ? customerMap[selectedCustomer] || "Unknown Customer"
                      : "All Customers"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setSelectedCustomer("")}>
                      All Customers
                    </Dropdown.Item>
                    {customers.map((cust) => (
                      <Dropdown.Item
                        key={cust.customerId}
                        onClick={() => setSelectedCustomer(cust.customerId)}
                      >
                        {cust.name || "Unnamed Customer"}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
              <Col md={6} lg={2} className="mb-3">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" className="w-100">
                    {selectedStatus || "All Statuses"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setSelectedStatus("")}>
                      All Statuses
                    </Dropdown.Item>
                    {statuses.map((status) => (
                      <Dropdown.Item
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                      >
                        {status}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
              <Col md={6} lg={2} className="mb-3">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" className="w-100">
                    Sort By: {sortBy}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {[
                      "Recently Added",
                      "Ascending",
                      "Descending",
                      "Last Month",
                      "Last 7 Days",
                    ].map((sort) => (
                      <Dropdown.Item key={sort} onClick={() => setSortBy(sort)}>
                        {sort}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
          </div>

          {filteredInvoices.length === 0 ? (
            <Alert variant="info" className="text-center">
              No invoices found.
            </Alert>
          ) : (
            <Row>
              {paginatedInvoices.map((invoice) => (
                <Col md={6} lg={4} key={invoice.invoiceId} className="mb-4">
                  <Card className="invoice-card shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="card-title">
                          <Link
                            to={`/invoice/${invoice.invoiceId}`}
                            className="invoice-link"
                          >
                            #{invoice.invoiceNo}
                          </Link>
                        </h5>
                        <Form.Check
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice.invoiceId)}
                          onChange={() => toggleInvoice(invoice.invoiceId)}
                          aria-label={`Select invoice ${invoice.invoiceNo}`}
                        />
                      </div>
                      <p className="card-text">
                        <strong>Customer:</strong>{" "}
                        {invoice.customerId &&
                        customerMap[invoice.customerId?.trim()]
                          ? customerMap[invoice.customerId.trim()]
                          : normalizeName(invoice.billTo) || "Unknown Customer"}
                      </p>
                      <p className="card-text">
                        <strong>Amount:</strong>{" "}
                        {invoice.amount ? `Rs ${invoice.amount}` : "N/A"}
                      </p>
                      <p className="card-text">
                        <strong>Invoice Date:</strong>{" "}
                        {invoice.invoiceDate &&
                        invoice.invoiceDate !== "0000-00-00"
                          ? new Date(invoice.invoiceDate).toLocaleDateString()
                          : "N/A"}
                      </p>
                      <p className="card-text">
                        <strong>Due Date:</strong>{" "}
                        {invoice.dueDate && invoice.dueDate !== "0000-00-00"
                          ? new Date(invoice.dueDate).toLocaleDateString()
                          : "N/A"}
                      </p>
                      <p className="card-text">
                        <strong>Status:</strong>{" "}
                        <span
                          className={`status-badge status-${getInvoiceStatus(
                            invoice
                          ).toLowerCase()}`}
                        >
                          {getInvoiceStatus(invoice)}
                        </span>
                      </p>
                      <div className="action-buttons mt-3">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          as={Link}
                          to={`/invoice/${invoice.invoiceId}`}
                          title="View Invoice"
                          aria-label={`View invoice ${invoice.invoiceNo}`}
                        >
                          <FaEye />
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEditClick(invoice)}
                          title="Edit Invoice"
                          aria-label={`Edit invoice ${invoice.invoiceNo}`}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(invoice)}
                          disabled={isDeleting}
                          title="Delete Invoice"
                          aria-label={`Delete invoice ${invoice.invoiceNo}`}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          <div className="pagination-section mt-4">
            <DataTablePagination
              totalItems={filteredInvoices.length}
              itemNo={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>

          {showEditModal && selectedInvoice && (
            <EditInvoice
              invoice={selectedInvoice}
              onClose={() => {
                setShowEditModal(false);
                setSelectedInvoice(null);
              }}
            />
          )}

          <DeleteModal
            item={invoiceToDelete}
            itemType="Invoice"
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
            isVisible={showDeleteModal}
          />
        </Container>
      </div>
    </div>
  );
};

export default RecentInvoices;
