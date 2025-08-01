import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Form, Spinner, Alert } from "react-bootstrap"; // Removed Button, Dropdown
import {
  useGetAllInvoicesQuery,
  useDeleteInvoiceMutation,
  useCreateInvoiceMutation,
  useChangeInvoiceStatusMutation,
} from "../../api/invoiceApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { FaSearch, FaPen } from "react-icons/fa"; // Keep FaSearch, FaPen
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons"; // Ant Design icons
import { Select, Dropdown, Menu, Button } from "antd"; // Ant Design components
import EditInvoice from "../Invoices/EditInvoice";
import CreateInvoiceFromQuotation from "../Invoices/CreateInvoiceFromQuotation";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, subDays } from "date-fns";
import PageHeader from "../Common/PageHeader";

// Destructure Option from Select
const { Option } = Select;

const ShowInvoices = () => {
  // Queries
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
  const [changeInvoiceStatus, { isLoading: isChangingStatus }] =
    useChangeInvoiceStatusMutation();

  // Data assignments
  const invoices = invoiceData?.data || [];
  const customers = customerData?.data || [];
  const addresses = addressData?.data || [];
  const users = userData?.users || [];
  const quotations = Array.isArray(quotationData)
    ? quotationData
    : quotationData?.data || [];

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [createdDate, setCreatedDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [activeTab, setActiveTab] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentQuotationPage, setCurrentQuotationPage] = useState(1);
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [editingStatusInvoiceId, setEditingStatusInvoiceId] = useState(null);
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

  // Define valid statuses
  const statuses = ["paid", "unpaid", "partially paid", "void", "refund"];

  const getInvoiceStatus = (invoice) => {
    const validStatuses = statuses;
    const invoiceStatus = invoice.status ? invoice.status.toLowerCase() : null;
    if (validStatuses.includes(invoiceStatus)) {
      return invoiceStatus;
    }
    if (!invoice.customerId || typeof invoice.customerId !== "string") {
      return "unpaid";
    }
    const customer = customers.find(
      (cust) => cust.customerId === invoice.customerId.trim()
    );
    const customerStatus = customer?.invoiceStatus
      ? customer?.invoiceStatus.toLowerCase()
      : null;
    return validStatuses.includes(customerStatus) ? customerStatus : "unpaid";
  };

  const normalizeName = (name) =>
    name
      ?.toLowerCase()
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "N/A";

  // Handle status change
  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      await changeInvoiceStatus({
        invoiceId,
        status: newStatus.toLowerCase(),
      }).unwrap();
      setEditingStatusInvoiceId(null);
    } catch (error) {
      alert("Failed to update invoice status. Please try again.");
      console.error("Status update error:", error);
    }
  };

  // Memoized grouped invoices for tab-based filtering
  const groupedInvoices = useMemo(
    () => ({
      All: invoices,
      Paid: invoices.filter((inv) => getInvoiceStatus(inv) === "paid"),
      Unpaid: invoices.filter((inv) => getInvoiceStatus(inv) === "unpaid"),
      Overdue: invoices.filter((inv) =>
        ["partially paid", "void", "refund"].includes(getInvoiceStatus(inv))
      ),
    }),
    [invoices]
  );

  // Filtered and sorted invoices
  const filteredInvoices = useMemo(() => {
    let result = groupedInvoices[activeTab] || [];

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter((inv) => {
        const customerName =
          inv.customerId && customerMap[inv.customerId?.trim()]
            ? customerMap[inv.customerId.trim()]
            : normalizeName(inv.billTo);
        return (
          inv.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.billTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (inv.shipTo &&
            addressMap[inv.shipTo]
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()))
        );
      });
    }

    // Apply customer filter
    if (selectedCustomer) {
      result = result.filter(
        (inv) =>
          inv.customerId &&
          typeof inv.customerId === "string" &&
          inv.customerId.trim() === selectedCustomer
      );
    }

    // Apply created date filter
    if (createdDate) {
      result = result.filter((inv) => {
        const invoiceDate = new Date(inv.invoiceDate);
        return invoiceDate.toDateString() === createdDate.toDateString();
      });
    }

    // Apply due date filter
    if (dueDate) {
      result = result.filter((inv) => {
        const invDueDate = new Date(inv.dueDate || inv.invoiceDate);
        return invDueDate.toDateString() === dueDate.toDateString();
      });
    }

    // Apply status filter from dropdown
    if (selectedStatus) {
      result = result.filter(
        (inv) => getInvoiceStatus(inv) === selectedStatus.toLowerCase()
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "Ascending":
        result = [...result].sort((a, b) =>
          a.invoiceNo.localeCompare(b.invoiceNo)
        );
        break;
      case "Descending":
        result = [...result].sort((a, b) =>
          b.invoiceNo.localeCompare(a.invoiceNo)
        );
        break;
      case "Recently Added":
      case "Created Date":
        result = [...result].sort(
          (a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate)
        );
        break;
      case "Due Date":
        result = [...result].sort(
          (a, b) =>
            new Date(b.dueDate || b.invoiceDate) -
            new Date(a.dueDate || a.invoiceDate)
        );
        break;
      case "Last 7 Days":
        const sevenDaysAgo = subDays(new Date(), 7);
        result = result.filter(
          (inv) => new Date(inv.invoiceDate) >= sevenDaysAgo
        );
        result = [...result].sort(
          (a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate)
        );
        break;
      case "Last Month":
        const oneMonthAgo = subDays(new Date(), 30);
        result = result.filter(
          (inv) => new Date(inv.invoiceDate) >= oneMonthAgo
        );
        result = [...result].sort(
          (a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate)
        );
        break;
      default:
        break;
    }

    return result;
  }, [
    groupedInvoices,
    activeTab,
    searchTerm,
    createdDate,
    dueDate,
    selectedStatus,
    sortBy,
    selectedCustomer,
    customerMap,
    addressMap,
  ]);

  // Filtered and sorted quotations
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
    if (searchTerm) {
      result = result.filter((quo) => {
        const customerName =
          quo.customerId && customerMap[quo.customerId?.trim()]
            ? customerMap[quo.customerId.trim()]
            : normalizeName(quo.document_title);
        return (
          (quo.reference_number || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (quo.document_title || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          customerName.toLowerCase().includes(searchTerm.toLowerCase())
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
      case "Created Date":
        result.sort(
          (a, b) => new Date(b.quotation_date) - new Date(a.quotation_date)
        );
        break;
      case "Last 7 Days":
        const sevenDaysAgo = subDays(new Date(), 7);
        result = result.filter(
          (quo) =>
            quo.quotation_date && new Date(quo.quotation_date) >= sevenDaysAgo
        );
        result.sort(
          (a, b) => new Date(b.quotation_date) - new Date(a.quotation_date)
        );
        break;
      case "Last Month":
        const oneMonthAgo = subDays(new Date(), 30);
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
    return result;
  }, [quotations, selectedCustomer, sortBy, searchTerm, customerMap]);

  // Paginated invoices
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInvoices, currentPage]);

  // Paginated quotations
  const paginatedQuotations = useMemo(() => {
    const startIndex = (currentQuotationPage - 1) * itemsPerPage;
    const paginated = filteredQuotations.slice(
      startIndex,
      startIndex + itemsPerPage
    );
    if (
      paginated.length === 0 &&
      filteredQuotations.length > 0 &&
      currentQuotationPage > 1
    ) {
      setCurrentQuotationPage(1);
    }
    return paginated;
  }, [filteredQuotations, currentQuotationPage]);

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

  const clearFilters = () => {
    setSearchTerm("");
    setCreatedDate(null);
    setDueDate(null);
    setSelectedStatus("");
    setSortBy("Recently Added");
    setActiveTab("All");
    setSelectedCustomer("");
    setCurrentPage(1);
    setCurrentQuotationPage(1);
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

  if (isLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center">
            <Spinner
              animation="border"
              variant="primary"
              role="status"
              aria-label="Loading data"
            />
            <p>Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <Alert variant="danger" role="alert">
              Error loading data: {JSON.stringify(hasError)}. Please try again.
              {quotationError && (
                <p>Quotation Error: {JSON.stringify(quotationError)}</p>
              )}
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <PageHeader
          title="Invoices"
          subtitle="Manage your Invoices"
          tableData={paginatedInvoices}
        />
        <div className="card-body">
          <div className="row">
            <div className="col-lg-4">
              <div className="d-flex align-items-center flex-wrap row-gap-3 mb-3">
                <h6 className="me-2">Status</h6>
                <ul
                  className="nav nav-pills border d-inline-flex p-1 rounded bg-light todo-tabs"
                  id="pills-tab"
                  role="tablist"
                >
                  {Object.keys(groupedInvoices).map((status) => (
                    <li className="nav-item" role="presentation" key={status}>
                      <button
                        className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${
                          activeTab === status ? "active" : ""
                        }`}
                        id={`tab-${status}`}
                        data-bs-toggle="pill"
                        data-bs-target={`#pills-${status}`}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === status}
                        onClick={() => setActiveTab(status)}
                      >
                        {status} ({groupedInvoices[status].length})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                <div className="input-icon-start position-relative">
                  <span className="input-icon-addon">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Invoice"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search invoices"
                  />
                </div>
                <button
                  className="btn btn-outline-secondary ms-2"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
          <div className="tab-content" id="pills-tabContent">
            {Object.entries(groupedInvoices).map(([status, list]) => (
              <div
                className={`tab-pane fade ${
                  activeTab === status ? "show active" : ""
                }`}
                id={`pills-${status}`}
                role="tabpanel"
                aria-labelledby={`tab-${status}`}
                key={status}
              >
                {filteredInvoices.length === 0 ? (
                  <p className="text-muted">
                    No {status.toLowerCase()} invoices match the applied filters
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Client</th>
                          <th>Amount</th>
                          <th>Invoice Date</th>
                          <th>Due Date</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedInvoices.map((inv) => (
                          <tr key={inv.invoiceId}>
                            <td>
                              <Link
                                to={`/invoice/${inv.invoiceId}`}
                                className="invoice-link"
                              >
                                #{inv.invoiceNo || "N/A"}
                              </Link>
                            </td>
                            <td>
                              {inv.customerId &&
                              customerMap[inv.customerId?.trim()]
                                ? customerMap[inv.customerId.trim()]
                                : normalizeName(inv.billTo) || "Unknown"}
                            </td>
                            <td>
                              ₹
                              {parseFloat(inv.amount || 0).toLocaleString(
                                "en-IN"
                              )}
                            </td>
                            <td>
                              {inv.invoiceDate &&
                              inv.invoiceDate !== "0000-00-00"
                                ? new Date(inv.invoiceDate).toLocaleDateString(
                                    "en-IN"
                                  )
                                : "N/A"}
                            </td>
                            <td>
                              {inv.dueDate && inv.dueDate !== "0000-00-00"
                                ? new Date(inv.dueDate).toLocaleDateString(
                                    "en-IN"
                                  )
                                : "N/A"}
                            </td>
                            <td
                              style={{ position: "relative" }}
                              onMouseEnter={() =>
                                setEditingStatusInvoiceId(inv.invoiceId)
                              }
                              onMouseLeave={() =>
                                setEditingStatusInvoiceId(null)
                              }
                            >
                              {editingStatusInvoiceId === inv.invoiceId ? (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                  }}
                                >
                                  <span
                                    className={`badge ${
                                      getInvoiceStatus(inv) === "paid"
                                        ? "bg-success"
                                        : getInvoiceStatus(inv) === "unpaid"
                                        ? "bg-warning"
                                        : [
                                            "partially paid",
                                            "void",
                                            "refund",
                                          ].includes(getInvoiceStatus(inv))
                                        ? "bg-danger"
                                        : "bg-secondary"
                                    }`}
                                  >
                                    {getInvoiceStatus(inv)}
                                  </span>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() =>
                                      setEditingStatusInvoiceId(
                                        editingStatusInvoiceId === inv.invoiceId
                                          ? null
                                          : inv.invoiceId
                                      )
                                    }
                                    style={{
                                      padding: "2px 6px",
                                      fontSize: "12px",
                                    }}
                                    aria-label={`Edit status for invoice ${inv.invoiceNo}`}
                                  >
                                    <FaPen />
                                  </Button>
                                  {editingStatusInvoiceId === inv.invoiceId && (
                                    <Select
                                      style={{
                                        width: "120px",
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        zIndex: 1000,
                                      }}
                                      value={getInvoiceStatus(inv)}
                                      onChange={(value) =>
                                        handleStatusChange(inv.invoiceId, value)
                                      }
                                      onBlur={() =>
                                        setEditingStatusInvoiceId(null)
                                      }
                                      open
                                      autoFocus
                                      disabled={isChangingStatus}
                                    >
                                      {statuses.map((status) => (
                                        <Option key={status} value={status}>
                                          {status.charAt(0).toUpperCase() +
                                            status.slice(1)}
                                        </Option>
                                      ))}
                                    </Select>
                                  )}
                                </div>
                              ) : (
                                <span
                                  className={`badge ${
                                    getInvoiceStatus(inv) === "paid"
                                      ? "bg-success"
                                      : getInvoiceStatus(inv) === "unpaid"
                                      ? "bg-warning"
                                      : [
                                          "partially paid",
                                          "void",
                                          "refund",
                                        ].includes(getInvoiceStatus(inv))
                                      ? "bg-danger"
                                      : "bg-secondary"
                                  }`}
                                >
                                  {getInvoiceStatus(inv)}
                                </span>
                              )}
                            </td>
                            <td>
                              <Dropdown
                                overlay={
                                  <Menu>
                                    <Menu.Item key="view">
                                      <Link
                                        to={`/invoice/${inv.invoiceId}`}
                                        style={{
                                          textDecoration: "none",
                                          color: "inherit",
                                        }}
                                        title="View Invoice"
                                      >
                                        <EyeOutlined
                                          style={{ marginRight: 8 }}
                                        />
                                        View Invoice
                                      </Link>
                                    </Menu.Item>
                                    <Menu.Item
                                      key="edit"
                                      onClick={() => handleEditClick(inv)}
                                      title="Edit Invoice"
                                    >
                                      <EditOutlined
                                        style={{ marginRight: 8 }}
                                      />
                                      Edit Invoice
                                    </Menu.Item>
                                    <Menu.Item
                                      key="delete"
                                      onClick={() => handleDeleteClick(inv)}
                                      disabled={isDeleting}
                                      style={{ color: "#ff4d4f" }}
                                      title="Delete Invoice"
                                    >
                                      <DeleteOutlined
                                        style={{ marginRight: 8 }}
                                      />
                                      Delete Invoice
                                    </Menu.Item>
                                  </Menu>
                                }
                                trigger={["click"]}
                                placement="bottomRight"
                              >
                                <Button
                                  type="text"
                                  icon={<MoreOutlined />}
                                  aria-label={`More actions for invoice ${inv.invoiceNo}`}
                                />
                              </Dropdown>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="pagination-section mt-4">
                      <DataTablePagination
                        totalItems={filteredInvoices.length}
                        itemNo={itemsPerPage}
                        onPageChange={handlePageChange}
                        currentPage={currentPage}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
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
    </>
  );
};

export default ShowInvoices;
