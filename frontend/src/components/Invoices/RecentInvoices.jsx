import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Table,
  Button,
  Form,
  Spinner,
  Alert,
  Tabs,
  Tab,
} from "react-bootstrap";
import {
  useGetAllInvoicesQuery,
  useDeleteInvoiceMutation,
  useCreateInvoiceMutation,
} from "../../api/invoiceApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFileInvoice,
} from "react-icons/fa";
import { Select } from "antd"; // Import Ant Design Select
import EditInvoice from "./EditInvoice";
import CreateInvoiceFromQuotation from "./CreateInvoiceFromQuotation";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import "./recentinvoices.css";

// Destructure Option from Select for cleaner code
const { Option } = Select;

const RecentInvoices = () => {
  // Queries (unchanged)
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
  const {
    data: quotationData,
    isLoading: quotationLoading,
    error: quotationError,
  } = useGetAllQuotationsQuery();
  const [createInvoice, { isLoading: isCreatingInvoice }] =
    useCreateInvoiceMutation();
  const [deleteInvoice, { isLoading: isDeleting }] = useDeleteInvoiceMutation();

  // Log quotation data for debugging (unchanged)
  useEffect(() => {
    console.log("Quotation Data:", quotationData);
  }, [quotationData]);

  // Data assignments (unchanged)
  const invoices = invoiceData?.data || [];
  const customers = customerData?.data || [];
  const addresses = addressData?.data || [];
  const users = userData?.users || [];
  const quotations = Array.isArray(quotationData)
    ? quotationData
    : quotationData?.data || [];

  // Log quotations to confirm assignment (unchanged)
  useEffect(() => {
    console.log("Quotations:", quotations);
  }, [quotations]);

  // State management (unchanged)
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
  const [currentQuotationPage, setCurrentQuotationPage] = useState(1);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const itemsPerPage = 12;

  // Memoized maps (unchanged)
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

  // Filtered and sorted invoices (unchanged)
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

  // Filtered and sorted quotations (unchanged)
  const filteredQuotations = useMemo(() => {
    let result = [...quotations];
    if (selectedCustomer) {
      result = result.filter(
        (quo) =>
          quo.customerId &&
          typeof quo.customerId === "string" &&
          quo.customerId.trim() === selectedCustomer
      );
    }
    if (searchQuery) {
      result = result.filter((quo) => {
        const customerName =
          quo.customerId && customerMap[quo.customerId?.trim()]
            ? customerMap[quo.customerId.trim()]
            : normalizeName(quo.document_title);
        return (
          (quo.reference_number || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (quo.document_title || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          customerName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }
    switch (sortBy) {
      case "Ascending":
        result.sort((a, b) =>
          (a.reference_number || "").localeCompare(b.reference_number || "")
        );
        break;
      case "Descending":
        result.sort((a, b) =>
          (b.reference_number || "").localeCompare(a.reference_number || "")
        );
        break;
      case "Recently Added":
        result.sort(
          (a, b) => new Date(b.quotation_date) - new Date(a.quotation_date)
        );
        break;
      case "Last 7 Days":
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        result = result.filter(
          (quo) =>
            quo.quotation_date && new Date(quo.quotation_date) >= sevenDaysAgo
        );
        result.sort(
          (a, b) => new Date(b.quotation_date) - new Date(a.quotation_date)
        );
        break;
      case "Last Month":
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        result = result.filter(
          (quo) =>
            quo.quotation_date && new Date(quo.quotation_date) >= oneMonthAgo
        );
        result.sort(
          (a, b) => new Date(b.quotation_date) - new Date(a.quotation_date)
        );
        break;
      default:
        break;
    }
    console.log("Filtered Quotations:", result);
    return result;
  }, [quotations, selectedCustomer, sortBy, searchQuery, customerMap]);

  // Paginated invoices (unchanged)
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInvoices.slice(startIndex, endIndex);
  }, [filteredInvoices, currentPage]);

  // Paginated quotations (unchanged)
  const paginatedQuotations = useMemo(() => {
    const startIndex = (currentQuotationPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredQuotations.slice(startIndex, endIndex);
    console.log("Paginated Quotations:", paginated);
    if (
      paginated.length === 0 &&
      filteredQuotations.length > 0 &&
      currentQuotationPage > 1
    ) {
      setCurrentQuotationPage(1);
    }
    return paginated;
  }, [filteredQuotations, currentQuotationPage]);

  // Handlers (unchanged)
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

  const handleConvertToInvoice = (quotation) => {
    setSelectedQuotation(quotation);
    setShowCreateInvoiceModal(true);
  };

  const handleCreateInvoiceClose = () => {
    setShowCreateInvoiceModal(false);
    setSelectedQuotation(null);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelectedInvoices([]);
  };

  const handleQuotationPageChange = (pageNumber) => {
    setCurrentQuotationPage(pageNumber);
  };

  const isLoading =
    invoiceLoading ||
    customerLoading ||
    addressLoading ||
    userLoading ||
    quotationLoading;
  const hasError =
    invoiceError ||
    customerError ||
    addressError ||
    userError ||
    quotationError;

  return (
    <div className="page-wrapper">
      <div className="content">
        <Container fluid className="recent-invoices-container">
          <h1 className="page-title">Recent Invoices & Quotations</h1>
          <p className="page-subtitle">
            Manage your recent invoices and quotations
          </p>

          {isLoading && (
            <div className="text-center my-5">
              <Spinner
                animation="border"
                variant="primary"
                role="status"
                aria-label="Loading data"
              />
              <p>Loading data...</p>
            </div>
          )}
          {hasError && (
            <Alert variant="danger" role="alert" className="my-4">
              Error loading data: {JSON.stringify(hasError)}. Please try again.
              {quotationError && (
                <p>Quotation Error: {JSON.stringify(quotationError)}</p>
              )}
            </Alert>
          )}

          <div className="filters-section mb-4">
            <Row className="align-items-center">
              <Col md={6} lg={4} className="mb-3">
                <div className="search-input-wrapper">
                  <FaSearch className="search-icon" />
                  <Form.Control
                    type="text"
                    placeholder="Search invoices, quotations, customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search invoices and quotations"
                  />
                </div>
              </Col>
              <Col md={6} lg={4} className="mb-3">
                <Select
                  style={{ width: "100%" }}
                  placeholder="All Customers"
                  value={selectedCustomer || undefined}
                  onChange={(value) => setSelectedCustomer(value)}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  <Option value="">All Customers</Option>
                  {customers.map((cust) => (
                    <Option key={cust.customerId} value={cust.customerId}>
                      {cust.name || "Unnamed Customer"}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col md={6} lg={2} className="mb-3">
                <Select
                  style={{ width: "100%" }}
                  placeholder="All Statuses"
                  value={selectedStatus || undefined}
                  onChange={(value) => setSelectedStatus(value)}
                  allowClear
                >
                  <Option value="">All Statuses</Option>
                  {statuses.map((status) => (
                    <Option key={status} value={status}>
                      {status}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col md={6} lg={2} className="mb-3">
                <Select
                  style={{ width: "100%" }}
                  value={sortBy}
                  onChange={(value) => setSortBy(value)}
                >
                  {[
                    "Recently Added",
                    "Ascending",
                    "Descending",
                    "Last Month",
                    "Last 7 Days",
                  ].map((sort) => (
                    <Option key={sort} value={sort}>
                      {sort}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </div>

          {/* Tabs for Invoices and Quotations (unchanged) */}
          <Tabs
            defaultActiveKey="invoices"
            id="invoices-quotations-tabs"
            className="mb-4"
          >
            <Tab eventKey="invoices" title="Invoices">
              <h2 className="section-title mt-3">Invoices</h2>
              {filteredInvoices.length === 0 ? (
                <Alert variant="info" className="text-center">
                  No invoices found.
                </Alert>
              ) : (
                <div className="cm-table-wrapper">
                  <table className="cm-table">
                    <thead>
                      <tr>
                        <th>
                          <Form.Check
                            type="checkbox"
                            checked={
                              selectedInvoices.length ===
                                paginatedInvoices.length &&
                              paginatedInvoices.length > 0
                            }
                            onChange={handleSelectAll}
                            aria-label="Select all invoices"
                          />
                        </th>
                        <th>Invoice #</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Invoice Date</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedInvoices.map((invoice) => (
                        <tr key={invoice.invoiceId}>
                          <td>
                            <Form.Check
                              type="checkbox"
                              checked={selectedInvoices.includes(
                                invoice.invoiceId
                              )}
                              onChange={() => toggleInvoice(invoice.invoiceId)}
                              aria-label={`Select invoice ${invoice.invoiceNo}`}
                            />
                          </td>
                          <td>
                            <Link
                              to={`/invoice/${invoice.invoiceId}`}
                              className="invoice-link"
                            >
                              #{invoice.invoiceNo}
                            </Link>
                          </td>
                          <td>
                            {invoice.customerId &&
                            customerMap[invoice.customerId?.trim()]
                              ? customerMap[invoice.customerId.trim()]
                              : normalizeName(invoice.billTo) ||
                                "Unknown Customer"}
                          </td>
                          <td>
                            {invoice.amount ? `Rs ${invoice.amount}` : "N/A"}
                          </td>
                          <td>
                            {invoice.invoiceDate &&
                            invoice.invoiceDate !== "0000-00-00"
                              ? new Date(
                                  invoice.invoiceDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td>
                            {invoice.dueDate && invoice.dueDate !== "0000-00-00"
                              ? new Date(invoice.dueDate).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td>
                            <span
                              className={`status-badge status-${getInvoiceStatus(
                                invoice
                              ).toLowerCase()}`}
                            >
                              {getInvoiceStatus(invoice)}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                as={Link}
                                to={`/invoice/${invoice.invoiceId}`}
                                title="View Invoice"
                                aria-label={`View invoice ${invoice.invoiceNo}`}
                                className="me-1"
                              >
                                <FaEye />
                              </Button>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditClick(invoice)}
                                title="Edit Invoice"
                                aria-label={`Edit invoice ${invoice.invoiceNo}`}
                                className="me-1"
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="pagination-section mt-4">
                <DataTablePagination
                  totalItems={filteredInvoices.length}
                  itemNo={itemsPerPage}
                  onPageChange={handlePageChange}
                  currentPage={currentPage}
                />
              </div>
            </Tab>

            <Tab eventKey="quotations" title="Quotations">
              <h2 className="section-title mt-3">Quotations</h2>
              {quotations.length === 0 && !isLoading && !quotationError ? (
                <Alert variant="info" className="text-center">
                  No quotations available.
                </Alert>
              ) : filteredQuotations.length === 0 ? (
                <Alert variant="info" className="text-center">
                  No quotations match the current filters.
                </Alert>
              ) : (
                <div className="cm-table-wrapper">
                  <table className="cm-table">
                    <thead>
                      <tr>
                        <th>Quotation #</th>
                        <th>Title</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Quotation Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedQuotations.map((quotation) => (
                        <tr key={quotation.quotationId}>
                          <td>
                            <Link
                              to={`/quotation/${quotation.quotationId}`}
                              className="invoice-link"
                            >
                              #{quotation.reference_number || "N/A"}
                            </Link>
                          </td>
                          <td>{quotation.document_title || "N/A"}</td>
                          <td>
                            {quotation.customerId &&
                            customerMap[quotation.customerId?.trim()]
                              ? customerMap[quotation.customerId.trim()]
                              : normalizeName(quotation.document_title) ||
                                "Unknown Customer"}
                          </td>
                          <td>
                            {quotation.finalAmount
                              ? `Rs ${parseFloat(quotation.finalAmount).toFixed(
                                  2
                                )}`
                              : "N/A"}
                          </td>
                          <td>
                            {quotation.quotation_date &&
                            quotation.quotation_date !== "0000-00-00"
                              ? new Date(
                                  quotation.quotation_date
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() =>
                                  handleConvertToInvoice(quotation)
                                }
                                title="Convert to Invoice"
                                aria-label={`Convert quotation ${
                                  quotation.reference_number || "N/A"
                                } to invoice`}
                                disabled={isCreatingInvoice}
                              >
                                <FaFileInvoice />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="pagination-section mt-4">
                <DataTablePagination
                  totalItems={filteredQuotations.length}
                  itemNo={itemsPerPage}
                  onPageChange={handleQuotationPageChange}
                  currentPage={currentQuotationPage}
                />
              </div>
            </Tab>
          </Tabs>

          {showEditModal && selectedInvoice && (
            <EditInvoice
              invoice={selectedInvoice}
              onClose={() => {
                setShowEditModal(false);
                setSelectedInvoice(null);
              }}
            />
          )}

          {showCreateInvoiceModal && selectedQuotation && (
            <CreateInvoiceFromQuotation
              quotation={selectedQuotation}
              onClose={handleCreateInvoiceClose}
              createInvoice={createInvoice}
              customerMap={customerMap}
              addressMap={addressMap}
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
