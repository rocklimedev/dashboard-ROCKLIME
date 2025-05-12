import React, { useState, useMemo } from "react";
import { useGetAllInvoicesQuery } from "../../api/invoiceApi";
import DatePicker from "react-datepicker"; // Add react-datepicker for date inputs
import "react-datepicker/dist/react-datepicker.css"; // Import datepicker styles
import { format, subDays } from "date-fns"; // For date manipulation

const ShowInvoices = () => {
  const { data: invoicesData, isLoading, isError } = useGetAllInvoicesQuery();
  const invoices = invoicesData?.data || [];

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [createdDate, setCreatedDate] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(""); // For dropdown status
  const [sortBy, setSortBy] = useState("Created Date");
  const [activeTab, setActiveTab] = useState("All");

  // Memoized grouped invoices for tab-based filtering
  const groupedInvoices = useMemo(
    () => ({
      All: invoices,
      Paid: invoices.filter((inv) => inv.status === "Paid"),
      Unpaid: invoices.filter((inv) => inv.status === "Unpaid"),
      Overdue: invoices.filter((inv) => inv.status === "Overdue"),
    }),
    [invoices]
  );

  // Memoized filtered invoices based on all filters
  const filteredInvoices = useMemo(() => {
    let result = groupedInvoices[activeTab] || [];

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter(
        (inv) =>
          inv.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.billTo?.toLowerCase().includes(searchTerm.toLowerCase())
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
        const invDueDate = new Date(inv.dueDate || inv.invoiceDate); // Fallback to invoiceDate if dueDate is not provided
        return invDueDate.toDateString() === dueDate.toDateString();
      });
    }

    // Apply status filter from dropdown (if not empty)
    if (selectedStatus) {
      result = result.filter((inv) => inv.status === selectedStatus);
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      if (sortBy === "Created Date") {
        return new Date(b.invoiceDate) - new Date(a.invoiceDate); // Newest first
      } else if (sortBy === "Due Date") {
        return (
          new Date(b.dueDate || b.invoiceDate) -
          new Date(a.dueDate || a.invoiceDate)
        );
      } else if (sortBy === "Last 7 Days") {
        const last7Days = subDays(new Date(), 7);
        return result.filter((inv) => new Date(inv.invoiceDate) >= last7Days);
      }
      return 0;
    });

    return result;
  }, [
    groupedInvoices,
    activeTab,
    searchTerm,
    createdDate,
    dueDate,
    selectedStatus,
    sortBy,
  ]);

  // Handle clearing all filters
  const clearFilters = () => {
    setSearchTerm("");
    setCreatedDate(null);
    setDueDate(null);
    setSelectedStatus("");
    setSortBy("Created Date");
    setActiveTab("All");
  };

  if (isLoading) {
    return <p>Loading invoices...</p>;
  }

  if (isError) {
    return <p className="text-danger">Failed to load invoices</p>;
  }

  return (
    <div className="content">
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <h4>Invoices</h4>
          <div className="d-flex align-items-center flex-wrap row-gap-3">
            <div className="d-flex align-items-center me-3">
              <p className="mb-0 me-3 pe-3 border-end fs-14">
                Total Invoices:{" "}
                <span className="text-dark">{invoices.length}</span>
              </p>
              <p className="mb-0 me-3 pe-3 border-end fs-14">
                Paid:{" "}
                <span className="text-dark">{groupedInvoices.Paid.length}</span>
              </p>
              <p className="mb-0 fs-14">
                Unpaid:{" "}
                <span className="text-dark">
                  {groupedInvoices.Unpaid.length}
                </span>
              </p>
            </div>
            <div className="input-icon-start position-relative">
              <span className="input-icon-addon">
                <i className="ti ti-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search Invoice"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

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
                  {Object.keys(groupedInvoices).map((status, index) => (
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
                        {status}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                <div className="input-icon w-120 position-relative me-2">
                  <DatePicker
                    selected={createdDate}
                    onChange={(date) => setCreatedDate(date)}
                    className="form-control datetimepicker"
                    placeholderText="Created Date"
                    dateFormat="dd/MM/yyyy"
                  />
                  <span className="input-icon-addon">
                    <i className="ti ti-calendar text-gray-9"></i>
                  </span>
                </div>
                <div className="input-icon w-120 position-relative me-2">
                  <DatePicker
                    selected={dueDate}
                    onChange={(date) => setDueDate(date)}
                    className="form-control datetimepicker"
                    placeholderText="Due Date"
                    dateFormat="dd/MM/yyyy"
                  />
                  <span className="input-icon-addon">
                    <i className="ti ti-calendar text-gray-9"></i>
                  </span>
                </div>
                <div className="dropdown me-2">
                  <a
                    href="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center p-2"
                    data-bs-toggle="dropdown"
                  >
                    {selectedStatus || "Select Status"}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    {["", "Paid", "Unpaid", "Overdue"].map((status) => (
                      <li key={status || "none"}>
                        <a
                          href="#"
                          className="dropdown-item rounded-1"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedStatus(status);
                          }}
                        >
                          {status || "All"}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="d-flex align-items-center border p-2 rounded">
                  <span className="d-inline-flex me-2">Sort By: </span>
                  <div className="dropdown">
                    <a
                      href="#"
                      className="dropdown-toggle btn btn-white d-inline-flex align-items-center border-0 bg-transparent p-0 text-dark"
                      data-bs-toggle="dropdown"
                    >
                      {sortBy}
                    </a>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      {["Created Date", "Due Date", "Last 7 Days"].map(
                        (option) => (
                          <li key={option}>
                            <a
                              href="#"
                              className="dropdown-item rounded-1"
                              onClick={(e) => {
                                e.preventDefault();
                                setSortBy(option);
                              }}
                            >
                              {option}
                            </a>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
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
            {Object.entries(groupedInvoices).map(([status, list], index) => (
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
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvoices.map((inv) => (
                          <tr key={inv.invoiceId}>
                            <td>{inv.invoiceNo || "N/A"}</td>
                            <td>{inv.billTo || "Unknown"}</td>
                            <td>
                              ₹
                              {parseFloat(inv.amount || 0).toLocaleString(
                                "en-IN"
                              )}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  inv.status === "Paid"
                                    ? "bg-success"
                                    : inv.status === "Unpaid"
                                    ? "bg-warning"
                                    : inv.status === "Overdue"
                                    ? "bg-danger"
                                    : "bg-secondary"
                                }`}
                              >
                                {inv.status || "Unknown"}
                              </span>
                            </td>
                            <td>
                              {inv.invoiceDate
                                ? new Date(inv.invoiceDate).toLocaleDateString(
                                    "en-IN"
                                  )
                                : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowInvoices;
