import React, { useEffect, useState, useMemo } from "react";
import PageHeader from "../Common/PageHeader";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetAllInvoicesQuery } from "../../api/invoiceApi";
import { useGetCustomersQuery } from "../../api/customerApi";

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

  const invoices = invoiceData?.data || [];
  const customers = customerData?.data || [];
  const addresses = addressData?.data || [];
  const users = userData?.data || [];

  // State for filters, sorting, search, and checkboxes
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  // Log unmatched customers and addresses for debugging
  useEffect(() => {
    // Unmatched customers
    const unmatchedCustomerInvoices = invoices.filter(
      (inv) =>
        inv.customerId &&
        !customers.find((cust) => cust.customerId === inv.customerId)
    );
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

    // Unmatched addresses
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
  }, [invoices, customers, addresses]);

  // Memoized maps
  const customerMap = useMemo(() => {
    const map = {};
    customers.forEach((cust) => {
      map[cust.customerId] = cust.name;
    });
    return map;
  }, [customers]);

  const addressMap = useMemo(() => {
    const map = {};
    addresses.forEach((addr) => {
      // Collect non-null address fields
      const addressParts = [
        addr.street,
        addr.city,
        addr.state,
        addr.postalCode,
        addr.country,
      ].filter((part) => part != null && part !== "");

      // Format address: use "Incomplete Address" if no parts are available
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
      map[user.userId] = user.name;
    });
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
    const customer = customers.find(
      (cust) => cust.customerId === invoice.customerId
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

  // Checkbox handlers
  const handleSelectAll = () => {
    setSelectedInvoices(
      selectedInvoices.length === filteredInvoices.length
        ? []
        : filteredInvoices.map((inv) => inv.invoiceId)
    );
  };

  const toggleInvoice = (id) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Filtered and sorted invoices
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Filter by customer
    if (selectedCustomer) {
      result = result.filter((inv) => inv.customerId === selectedCustomer);
    }

    // Filter by status
    if (selectedStatus) {
      result = result.filter((inv) => getInvoiceStatus(inv) === selectedStatus);
    }

    // Filter by search query
    if (searchQuery) {
      result = result.filter(
        (inv) =>
          inv.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.billTo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customerMap[inv.customerId]
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          addressMap[inv.shipTo]
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Sort
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

  const isLoading =
    invoiceLoading || customerLoading || addressLoading || userLoading;
  const hasError = invoiceError || customerError || addressError || userError;

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Recent Invoices"
          subtitle="Manage your Recent Invoices"
        />

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
              {/* Customer Filter */}
              <div className="dropdown me-2">
                <a
                  href="#"
                  className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {selectedCustomer
                    ? customerMap[selectedCustomer]
                    : "Customer"}
                </a>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  <li>
                    <a
                      href="#"
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
                    <li key={cust.customerId}>
                      <a
                        href="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedCustomer(cust.customerId);
                        }}
                      >
                        {cust.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Status Filter */}
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
                      href="#"
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
                        href="#"
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

              {/* Sort By */}
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
                        href="#"
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
                              filteredInvoices.length
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
                      <th className="no-sort"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
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
                          <a href={`/invoice/${invoice.invoiceId}`}>
                            {invoice.invoiceNo}
                          </a>
                        </td>
                        <td>
                          {customerMap[invoice.customerId] ||
                            "Unknown Customer"}
                        </td>
                        <td>{normalizeName(invoice.billTo)}</td>
                        <td
                          className={
                            !addressMap[invoice.shipTo] ? "text-warning" : ""
                          }
                        >
                          {invoice.shipTo
                            ? addressMap[invoice.shipTo] || "Address Not Found"
                            : "N/A"}
                        </td>
                        <td>
                          {invoice.invoiceDate
                            ? new Date(invoice.invoiceDate).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td>
                          {invoice.dueDate
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
                                : "badge-soft-warning"
                            }`}
                          >
                            <i className="ti ti-point-filled me-1"></i>
                            {getInvoiceStatus(invoice)}
                          </span>
                        </td>
                        <td>
                          <a
                            href={`/invoice/${invoice.invoiceId}`}
                            className="btn btn-light"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentInvoices;
