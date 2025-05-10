import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../Common/PageHeader";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import {
  useGetAllInvoicesQuery,
  useDeleteInvoiceMutation,
} from "../../api/invoiceApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import EditInvoice from "./EditInvoice";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";

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
  console.log(users);
  // State for filters, sorting, search, checkboxes, modals, and pagination
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
  const itemsPerPage = 20;

  // Memoized maps
  const customerMap = useMemo(() => {
    const map = {};
    customers.forEach((cust) => {
      if (cust.customerId && typeof cust.customerId === "string") {
        map[cust.customerId.trim()] = cust.name || "Unnamed Customer";
      } else {
        console.warn("Invalid customerId:", cust);
      }
    });
    return map;
  }, [customers]);

  const addressMap = useMemo(() => {
    const map = {};
    if (addresses.length === 0) {
      console.warn("No addresses available in addressMap");
    }
    addresses.forEach((addr) => {
      const hasNullFields =
        addr.state === null ||
        addr.postalCode === null ||
        addr.country === null;
      if (hasNullFields) {
        map[addr.addressId] = "N/A";
      } else {
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
      }
    });
    return map;
  }, [addresses]);

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((user) => {
      map[user.userId] = user.name || "Unknown User";
    });
    console.log(users);
    return map;
  }, [users]);

  // Derive statuses dynamically
  const statuses = useMemo(() => {
    const invoiceStatuses = [
      ...new Set(invoices.map((inv) => inv.status).filter(Boolean)),
    ];
    const customerStatuses = [
      ...new Set(customers.map((cust) => cust.invoiceStatus).filter(Boolean)),
    ];
    const combined = [...new Set([...invoiceStatuses, ...customerStatuses])];
    return combined.length > 0
      ? combined
      : ["Paid", "Unpaid", "Overdue", "Draft"];
  }, [invoices, customers]);

  // Get invoice status with fallback
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

  // Normalize names for display
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
        result.sort((a, b) => b.invoiceNo.localeCompare(b.invoiceNo));
        break;
      case "Recently Added":
        result.sort((a, b) => {
          const dateA = a.invoiceDate ? new Date(a.invoiceDate) : new Date(0);
          const dateB = b.invoiceDate ? new Date(b.invoiceDate) : new Date(0);
          return dateB - dateA;
        });
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

  // Format invoices for tableData prop
  const formattedInvoices = useMemo(() => {
    return filteredInvoices.map((invoice) => ({
      invoiceId: invoice.invoiceId,
      invoiceNo: invoice.invoiceNo,
      customer:
        invoice.customerId && customerMap[invoice.customerId?.trim()]
          ? customerMap[invoice.customerId.trim()]
          : normalizeName(invoice.billTo) || "Unknown Customer",
      billTo: normalizeName(invoice.billTo) || "N/A",
      shipTo: invoice.shipTo
        ? addressMap[invoice.shipTo] || "Address Not Found"
        : customers.find((cust) => cust.customerId === invoice.customerId)
            ?.address
        ? Object.values(
            customers.find((cust) => cust.customerId === invoice.customerId)
              .address
          )
            .filter(Boolean)
            .join(", ")
        : "N/A",
      invoiceDate:
        invoice.invoiceDate && invoice.invoiceDate !== "0000-00-00"
          ? new Date(invoice.invoiceDate).toLocaleDateString()
          : "N/A",
      dueDate:
        invoice.dueDate && invoice.dueDate !== "0000-00-00"
          ? new Date(invoice.dueDate).toLocaleDateString()
          : "N/A",
      amount: invoice.amount ? `Rs ${invoice.amount}` : "N/A",
      createdBy: userMap[invoice.createdBy] || "Unknown User",
      status: getInvoiceStatus(invoice),
    }));
  }, [
    filteredInvoices,
    customerMap,
    addressMap,
    userMap,
    normalizeName,
    getInvoiceStatus,
  ]);

  // Log data for debugging
  useEffect(() => {
    const unmatchedCustomerInvoices = invoices.filter((inv) => {
      if (!inv.customerId || typeof inv.customerId !== "string") {
        console.warn("Invalid invoice customerId:", inv);
        return true;
      }
      return !customers.find(
        (cust) => cust.customerId === inv.customerId.trim()
      );
    });
    if (unmatchedCustomerInvoices.length > 0) {
      console.warn(
        "Unmatched customer IDs:",
        unmatchedCustomerInvoices.map((inv) => ({
          invoiceNo: inv.invoiceNo,
          customerId: inv.customerId,
          billTo: inv.billTo,
        }))
      );
    }

    const unmatchedAddressInvoices = invoices.filter(
      (inv) =>
        inv.shipTo && !addresses.find((addr) => addr.addressId === inv.shipTo)
    );
    if (unmatchedAddressInvoices.length > 0) {
      console.warn(
        "Unmatched shipTo address IDs:",
        unmatchedAddressInvoices.map((inv) => ({
          invoiceNo: inv.invoiceNo,
          shipTo: inv.shipTo,
        }))
      );
    }
  }, [invoices, customers, addresses, customerMap, addressMap]);

  // Checkbox handlers
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

  // Handle edit button click
  const handleEditClick = (invoice) => {
    setSelectedInvoice(invoice);
    setShowEditModal(true);
  };

  // Handle delete button click
  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  // Confirm deletion
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

  // Cancel deletion
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setInvoiceToDelete(null);
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelectedInvoices([]);
  };

  // Paginated invoices
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInvoices.slice(startIndex, endIndex);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  const isLoading =
    invoiceLoading || customerLoading || addressLoading || userLoading;
  const hasError = invoiceError || customerError || addressError || userError;

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Recent Invoices"
          subtitle="Manage your Recent Invoices"
          tableData={formattedInvoices}
        />

        {isLoading && <p className="text-center">Loading data...</p>}
        {hasError && (
          <p className="text-danger text-center">
            Error loading data: {JSON.stringify(hasError)}. Please try again.
          </p>
        )}

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set">
              <div className="search-input">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by invoice, customer, bill to, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="btn-searchset">
                  <i className="ti ti-search fs-14 feather-search"></i>
                </span>
              </div>
            </div>

            <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
              <div className="dropdown me-2">
                <a
                  href="#"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {selectedCustomer
                    ? customerMap[selectedCustomer] || "Unknown Customer"
                    : "Customer"}
                </a>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  <li>
                    <a
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedCustomer("");
                      }}
                    >
                      All Customers
                    </a>
                  </li>
                  {customers.map((cust) => (
                    <li key={cust.customerId || `cust-${Math.random()}`}>
                      <a
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedCustomer(cust.customerId);
                        }}
                      >
                        {cust.name || "Unnamed Customer"}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="dropdown me-2">
                <a
                  href="#"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {selectedStatus || "Status"}
                </a>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  <li>
                    <a
                      className="dropdown-item rounded-1"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedStatus("");
                      }}
                    >
                      All Statuses
                    </a>
                  </li>
                  {statuses.map((status) => (
                    <li key={status}>
                      <a
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedStatus(status);
                        }}
                      >
                        {status}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="dropdown">
                <a
                  href="#"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Sort By: {sortBy}
                </a>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  {[
                    "Recently Added",
                    "Ascending",
                    "Descending",
                    "Last Month",
                    "Last 7 Days",
                  ].map((sort) => (
                    <li key={sort}>
                      <a
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setSortBy(sort);
                        }}
                      >
                        {sort}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              {isLoading ? (
                <p className="text-center">Loading...</p>
              ) : hasError ? (
                <p className="text-danger text-center">
                  Error loading data. Please try again.
                </p>
              ) : filteredInvoices.length === 0 ? (
                <p className="text-center">No invoices found.</p>
              ) : (
                <>
                  <table className="table datatable">
                    <thead className="thead-light">
                      <tr>
                        <th className="no-sort">
                          <label className="checkboxs">
                            <input
                              type="checkbox"
                              id="select-all"
                              checked={
                                selectedInvoices.length ===
                                paginatedInvoices.length
                              }
                              onChange={handleSelectAll}
                            />
                            <span className="checkmarks"></span>
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
                        <th className="no-sort">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedInvoices.map((invoice) => (
                        <tr key={invoice.invoiceId}>
                          <td>
                            <input
                              type="checkbox"
                              aria-label="Select invoice"
                              checked={selectedInvoices.includes(
                                invoice.invoiceId
                              )}
                              onChange={() => toggleInvoice(invoice.invoiceId)}
                            />
                          </td>
                          <td>
                            <Link
                              to={`/invoice/${invoice.invoiceId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="invoice-link"
                            >
                              {invoice.invoiceNo}
                            </Link>
                          </td>
                          <td
                            className={
                              !invoice.customerId ||
                              !customerMap[invoice.customerId?.trim()]
                                ? "text-warning"
                                : ""
                            }
                            title={
                              !invoice.customerId
                                ? "Missing customerId"
                                : !customerMap[invoice.customerId?.trim()]
                                ? `Customer ID ${invoice.customerId} not found`
                                : undefined
                            }
                          >
                            {invoice.customerId &&
                            customerMap[invoice.customerId?.trim()]
                              ? customerMap[invoice.customerId.trim()]
                              : normalizeName(invoice.billTo) ||
                                "Unknown Customer"}
                          </td>
                          <td>{normalizeName(invoice.billTo) || "N/A"}</td>
                          <td
                            className={
                              invoice.shipTo && !addressMap[invoice.shipTo]
                                ? "text-warning"
                                : ""
                            }
                            title={
                              invoice.shipTo && !addressMap[invoice.shipTo]
                                ? `Address ID ${invoice.shipTo} not found`
                                : undefined
                            }
                          >
                            {invoice.shipTo
                              ? addressMap[invoice.shipTo] ||
                                "Address Not Found"
                              : customers.find(
                                  (cust) =>
                                    cust.customerId === invoice.customerId
                                )?.address
                              ? Object.values(
                                  customers.find(
                                    (cust) =>
                                      cust.customerId === invoice.customerId
                                  ).address
                                )
                                  .filter(Boolean)
                                  .join(", ")
                              : "N/A"}
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
                            {invoice.amount ? `Rs ${invoice.amount}` : "N/A"}
                          </td>
                          <td
                            className={
                              !userMap[invoice.createdBy] ? "text-warning" : ""
                            }
                          >
                            {userMap[invoice.createdBy] || "Unknown User"}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                getInvoiceStatus(invoice) === "Paid"
                                  ? "badge-soft-success"
                                  : getInvoiceStatus(invoice) === "Unpaid"
                                  ? "badge-soft-danger"
                                  : getInvoiceStatus(invoice) === "Draft"
                                  ? "badge-soft-info"
                                  : getInvoiceStatus(invoice) === "Overdue"
                                  ? "badge-soft-danger"
                                  : "badge-soft-warning"
                              }`}
                            >
                              <i className="ti ti-point-filled me-1"></i>
                              {getInvoiceStatus(invoice)}
                            </span>
                          </td>
                          <td className="action-buttons">
                            <Link
                              to={`/invoice/${invoice.invoiceId}`}
                              className="btn btn-icon btn-sm btn-light me-1"
                              title="View Invoice"
                              data-bs-toggle="tooltip"
                              data-bs-placement="top"
                            >
                              <FaEye />
                            </Link>
                            <button
                              className="btn btn-icon btn-sm btn-primary me-1"
                              title="Edit Invoice"
                              onClick={() => handleEditClick(invoice)}
                              data-bs-toggle="tooltip"
                              data-bs-placement="top"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn btn-icon btn-sm btn-danger"
                              title="Delete Invoice"
                              onClick={() => handleDeleteClick(invoice)}
                              disabled={isDeleting}
                              data-bs-toggle="tooltip"
                              data-bs-placement="top"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="card-footer">
                    <DataTablePagination
                      totalItems={filteredInvoices.length}
                      itemNo={itemsPerPage}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </>
              )}
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

        <DeleteModal
          item={invoiceToDelete}
          itemType="Invoice"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          isVisible={showDeleteModal}
        />
      </div>
    </div>
  );
};

export default RecentInvoices;
