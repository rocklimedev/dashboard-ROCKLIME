import React, { useState, useMemo } from "react";
import {
  useGetCustomersQuery,
  useDeleteCustomerMutation,
} from "../../api/customerApi";
import { BiTrash } from "react-icons/bi";
import { FaEye, FaSearch } from "react-icons/fa";
import { toast } from "sonner";
import DeleteModal from "../Common/DeleteModal";
import PageHeader from "../Common/PageHeader";
import { BsThreeDotsVertical } from "react-icons/bs";
import { Dropdown, Button, Menu, Pagination } from "antd";
import { useNavigate } from "react-router-dom";
import { EditOutlined } from "@ant-design/icons";
import PermissionGate from "../../context/PermissionGate";

const CustomerList = () => {
  const navigate = useNavigate();
  const { data, error, isLoading } = useGetCustomersQuery();
  const customers = Array.isArray(data?.data) ? data.data : [];
  const [deleteCustomer] = useDeleteCustomerMutation();

  // ──────────────────────────────────────────────────────
  // State
  // ──────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [activeTab, setActiveTab] = useState("All");

  // ──────────────────────────────────────────────────────
  // Customer types (from schema)
  // ──────────────────────────────────────────────────────
  const customerTypes = [
    "Retail",
    "Architect",
    "Interior",
    "Builder",
    "Contractor",
  ];

  // ──────────────────────────────────────────────────────
  // Grouped customers (only All + type tabs)
  // ──────────────────────────────────────────────────────
  const groupedCustomers = useMemo(() => {
    if (!Array.isArray(customers)) {
      const init = { All: [] };
      customerTypes.forEach((t) => (init[t] = []));
      return init;
    }

    const groups = {
      All: customers,
    };

    customerTypes.forEach((type) => {
      groups[type] = customers.filter(
        (c) => c.customerType === type || (type === "Retail" && !c.customerType)
      );
    });

    return groups;
  }, [customers]);

  // ──────────────────────────────────────────────────────
  // Filtered + sorted customers
  // ──────────────────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    let result = groupedCustomers[activeTab] || [];

    // Search
    if (searchTerm.trim()) {
      result = result.filter((c) =>
        [c.name, c.email, c.companyName, c.mobileNumber]
          .filter(Boolean)
          .some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort
    switch (sortBy) {
      case "Ascending":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "Descending":
        result = [...result].sort((a, b) => b.name.localeCompare(b.name));
        break;
      case "Recently Added":
        result = [...result].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      default:
        break;
    }

    return result;
  }, [groupedCustomers, activeTab, searchTerm, sortBy]);

  // ──────────────────────────────────────────────────────
  // Pagination (client-side)
  // ──────────────────────────────────────────────────────
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // ──────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────
  const handlePageChange = (page, newPageSize) => {
    setCurrentPage(page);
    setPageSize(newPageSize);
  };

  const handleAddCustomer = () => navigate("/customers/add");

  const handleEditCustomer = (customer) => {
    navigate(`/customers/edit/${customer.customerId}`, { state: { customer } });
  };

  const handleDelete = (customerId) => {
    setCustomerToDelete(customerId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) {
      toast.warn("No customer selected to delete.");
      return;
    }

    try {
      await deleteCustomer(customerToDelete).unwrap();
      toast.success("Customer deleted successfully");

      // Adjust page if current page becomes empty
      if (paginatedCustomers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      if (err?.status === 500) {
        toast.error(
          "Server error occurred while deleting customer. Please try again later."
        );
      } else if (
        err?.data?.message?.toLowerCase().includes("quotation") ||
        err?.status === 400
      ) {
        toast.error(
          "Cannot delete customer — quotations are associated with this customer."
        );
      } else {
        toast.error("Failed to delete customer!");
      }
    } finally {
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSortBy("Recently Added");
    setActiveTab("All");
    setCurrentPage(1);
    setPageSize(20);
  };

  // ──────────────────────────────────────────────────────
  // Loading / Error
  // ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading customers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              Error fetching customers:{" "}
              {error?.data?.message || error?.message || "Unknown error"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Customers"
            subtitle="Manage your Customers"
            onAdd={handleAddCustomer}
            tableData={paginatedCustomers}
          />

          <div className="card-body">
            {/* ── Tabs + Search ── */}
            <div className="row">
              <div className="col-lg-4">
                <ul
                  className="nav nav-pills border d-inline-flex p-1 rounded bg-light todo-tabs"
                  id="pills-tab"
                  role="tablist"
                >
                  {Object.keys(groupedCustomers).map((tab) => (
                    <li className="nav-item" role="presentation" key={tab}>
                      <button
                        className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${
                          activeTab === tab ? "active" : ""
                        }`}
                        id={`tab-${tab}`}
                        data-bs-toggle="pill"
                        data-bs-target={`#pills-${tab}`}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab}
                        onClick={() => {
                          setActiveTab(tab);
                          setCurrentPage(1);
                        }}
                      >
                        {tab} ({groupedCustomers[tab].length})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-lg-8">
                <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                  <div className="input-icon-start position-relative me-2">
                    <span className="input-icon-addon">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Customers"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      aria-label="Search customers"
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

            {/* ── Tab Content ── */}
            <div className="tab-content" id="pills-tabContent">
              {Object.keys(groupedCustomers).map((tab) => (
                <div
                  key={tab}
                  className={`tab-pane fade ${
                    activeTab === tab ? "show active" : ""
                  }`}
                  id={`pills-${tab}`}
                  role="tabpanel"
                >
                  {paginatedCustomers.length === 0 ? (
                    <p className="text-muted">
                      No {tab.toLowerCase()} customers match the applied filters
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Customer</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Company</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedCustomers.map((c) => (
                            <tr key={c.customerId}>
                              <td>
                                <a
                                  href={`/customer/${c.customerId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {c.name || "N/A"}
                                </a>
                              </td>
                              <td>{c.email || "N/A"}</td>
                              <td>{c.mobileNumber || "N/A"}</td>
                              <td>{c.companyName || "N/A"}</td>

                              {/* ── ACTIONS (GATED) ── */}
                              <td>
                                <div className="d-flex align-items-center">
                                  {/* EDIT */}
                                  <PermissionGate
                                    api="edit"
                                    module="Customer Management"
                                  >
                                    <span
                                      onClick={() => handleEditCustomer(c)}
                                      style={{
                                        cursor: "pointer",
                                        marginRight: 8,
                                      }}
                                      title="Edit Customer"
                                    >
                                      <EditOutlined />
                                    </span>
                                  </PermissionGate>

                                  {/* DROPDOWN (View + Delete) */}
                                  <PermissionGate
                                    api="view|delete"
                                    module="customers"
                                  >
                                    <Dropdown
                                      trigger={["click"]}
                                      overlay={
                                        <Menu>
                                          {/* VIEW */}
                                          <PermissionGate
                                            api="view"
                                            module="customers"
                                          >
                                            <Menu.Item key="view">
                                              <a
                                                href={`/customer/${c.customerId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                              >
                                                <FaEye className="me-2" />
                                                View
                                              </a>
                                            </Menu.Item>
                                          </PermissionGate>

                                          {/* DELETE */}
                                          <PermissionGate
                                            api="delete"
                                            module="customers"
                                          >
                                            <Menu.Item
                                              key="delete"
                                              onClick={() =>
                                                handleDelete(c.customerId)
                                              }
                                              danger
                                            >
                                              <BiTrash className="me-2" />
                                              Delete
                                            </Menu.Item>
                                          </PermissionGate>
                                        </Menu>
                                      }
                                      placement="bottomRight"
                                    >
                                      <Button
                                        type="text"
                                        icon={<BsThreeDotsVertical />}
                                      />
                                    </Dropdown>
                                  </PermissionGate>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* ANT DESIGN PAGINATION */}
                      {filteredCustomers.length > pageSize && (
                        <div className="d-flex justify-content-end mt-4">
                          <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredCustomers.length}
                            onChange={handlePageChange}
                            showSizeChanger
                            pageSizeOptions={["10", "20", "50", "100"]}
                            showQuickJumper
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Delete Modal ── */}
        {showDeleteModal && (
          <DeleteModal
            item={customerToDelete}
            itemType="Customer"
            isVisible={showDeleteModal}
            onConfirm={confirmDelete}
            onCancel={() => {
              setShowDeleteModal(false);
              setCustomerToDelete(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerList;
