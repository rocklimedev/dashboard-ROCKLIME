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
import { Dropdown, Button, Menu, Pagination, Select } from "antd";
import { useNavigate } from "react-router-dom";
import { EditOutlined } from "@ant-design/icons";
import PermissionGate from "../../context/PermissionGate";

const { Option } = Select;

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
  const [customerTypeFilter, setCustomerTypeFilter] = useState("All"); // ← NEW

  // ──────────────────────────────────────────────────────
  // Customer types
  // ──────────────────────────────────────────────────────
  const customerTypes = [
    { value: "All", label: "All Customers" },
    { value: "Retail", label: "Retail" },
    { value: "Architect", label: "Architect" },
    { value: "Interior", label: "Interior" },
    { value: "Builder", label: "Builder" },
    { value: "Contractor", label: "Contractor" },
  ];

  // ──────────────────────────────────────────────────────
  // Filtered + sorted customers
  // ──────────────────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Filter by customer type
    if (customerTypeFilter !== "All") {
      result = result.filter((c) => {
        if (customerTypeFilter === "Retail") {
          return !c.customerType || c.customerType === "Retail";
        }
        return c.customerType === customerTypeFilter;
      });
    }

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
  }, [customers, customerTypeFilter, searchTerm, sortBy]);

  // ──────────────────────────────────────────────────────
  // Pagination
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
    if (newPageSize !== pageSize) setPageSize(newPageSize);
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

      if (paginatedCustomers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      if (err?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else if (err?.data?.message?.toLowerCase().includes("quotation")) {
        toast.error("Cannot delete — quotations are linked.");
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
    setCustomerTypeFilter("All");
    setCurrentPage(1);
  };

  // ──────────────────────────────────────────────────────
  // Loading / Error
  // ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading customers...</p>
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
            <div className="alert alert-danger">
              Error: {error?.data?.message || "Failed to load customers"}
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
            subtitle="Manage your customer database"
            onAdd={handleAddCustomer}
            tableData={paginatedCustomers}
          />

          <div className="card-body">
            {/* ── Filters: Type Dropdown + Search + Sort + Clear ── */}
            <div className="row mb-4 align-items-center g-3">
              {/* Customer Type Dropdown */}
              <div className="col-lg-3 col-md-6">
                <Select
                  value={customerTypeFilter}
                  onChange={(val) => {
                    setCustomerTypeFilter(val);
                    setCurrentPage(1);
                  }}
                  style={{ width: "100%" }}
                  size="large"
                >
                  {customerTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}{" "}
                      {type.value !== "All" &&
                        `(${
                          customers.filter((c) =>
                            type.value === "Retail"
                              ? !c.customerType || c.customerType === "Retail"
                              : c.customerType === type.value
                          ).length
                        })`}
                    </Option>
                  ))}
                </Select>
              </div>

              {/* Search */}
              <div className="col-lg-4 col-md-6">
                <div className="position-relative">
                  <FaSearch className="position-absolute top-50 start-3 translate-middle-y text-muted" />
                  <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="Search name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{ height: "40px" }}
                  />
                </div>
              </div>

              {/* Sort + Clear */}
              <div className="col-lg-5 d-flex gap-2 justify-content-end flex-wrap">
                <Select
                  value={sortBy}
                  onChange={(val) => {
                    setSortBy(val);
                    setCurrentPage(1);
                  }}
                  style={{ width: 180 }}
                >
                  <Option value="Recently Added">Recently Added</Option>
                  <Option value="Ascending">Name: A → Z</Option>
                  <Option value="Descending">Name: Z → A</Option>
                </Select>

                <Button onClick={clearFilters} type="default">
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* ── Table ── */}
            {paginatedCustomers.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <p>
                  No {customerTypeFilter.toLowerCase()} customers found.
                  {searchTerm && " Try adjusting your search."}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Company</th>
                      <th>Type</th>
                      <th className="text-end">Actions</th>
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
                            className="text-primary"
                          >
                            {c.name || "N/A"}
                          </a>
                        </td>
                        <td>{c.email || "—"}</td>
                        <td>{c.mobileNumber || "—"}</td>
                        <td>{c.companyName || "—"}</td>
                        <td>
                          <span className="badge bg-light text-dark">
                            {c.customerType || "Retail"}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            {/* Edit */}
                            <PermissionGate
                              api="edit"
                              module="Customer Management"
                            >
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleEditCustomer(c)}
                                title="Edit"
                              />
                            </PermissionGate>

                            {/* Dropdown: View + Delete */}
                            <PermissionGate
                              api="view|delete"
                              module="customers"
                            >
                              <Dropdown
                                trigger={["click"]}
                                overlay={
                                  <Menu>
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
                                          <FaEye className="me-2" /> View
                                        </a>
                                      </Menu.Item>
                                    </PermissionGate>

                                    <PermissionGate
                                      api="delete"
                                      module="customers"
                                    >
                                      <Menu.Item
                                        key="delete"
                                        danger
                                        onClick={() =>
                                          handleDelete(c.customerId)
                                        }
                                      >
                                        <BiTrash className="me-2" /> Delete
                                      </Menu.Item>
                                    </PermissionGate>
                                  </Menu>
                                }
                              >
                                <Button
                                  size="small"
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

                {/* ── Pagination (Integrated) ── */}
                {filteredCustomers.length > pageSize && (
                  <div
                    className="mt-4 p-3 bg-light rounded"
                    style={{
                      borderTop: "1px solid #eee",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div className="text-muted small">
                      Showing {(currentPage - 1) * pageSize + 1}–
                      {Math.min(
                        currentPage * pageSize,
                        filteredCustomers.length
                      )}{" "}
                      of {filteredCustomers.length} customers
                    </div>
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={filteredCustomers.length}
                      onChange={handlePageChange}
                      showSizeChanger
                      pageSizeOptions={["10", "20", "50", "100"]}
                      showQuickJumper
                      size="small"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Delete Modal ── */}
        <DeleteModal
          isVisible={showDeleteModal}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setCustomerToDelete(null);
          }}
          item={customerToDelete}
          itemType="Customer"
        />
      </div>
    </div>
  );
};

export default CustomerList;
