import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  message,
  Button,
  Dropdown,
  Pagination,
  Select,
  Input,
  Avatar as AntAvatar,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  BarsOutlined,
  MoreOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { BiTrash } from "react-icons/bi";
import Avatar from "react-avatar";
import {
  useGetCustomersQuery,
  useDeleteCustomerMutation,
} from "../../api/customerApi";
import DeleteModal from "../../components/Common/DeleteModal";
import PageHeader from "../../components/Common/PageHeader";
import PermissionGate from "../../context/PermissionGate";

const { Option } = Select;

const CustomerList = () => {
  const navigate = useNavigate();

  // State
  const [viewMode, setViewMode] = useState("list"); // "list" or "card"
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Recently Added");

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch customers (server-side pagination + search)
  const {
    data: response,
    error,
    isLoading,
    isFetching,
  } = useGetCustomersQuery({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch || undefined,
  });

  const customers = response?.data || [];
  const pagination = response?.pagination || {
    total: 0,
    page: 1,
    limit: pageSize,
    totalPages: 0,
  };

  const [deleteCustomer] = useDeleteCustomerMutation();

  const customerTypes = [
    { value: "All", label: "All Customers" },
    { value: "Retail", label: "Retail" },
    { value: "Architect", label: "Architect" },
    { value: "Interior", label: "Interior" },
    { value: "Builder", label: "Builder" },
    { value: "Contractor", label: "Contractor" },
  ];

  // Client-side filtering & sorting
  const filteredCustomers = useMemo(() => {
    let result = customers;

    if (customerTypeFilter !== "All") {
      result = result.filter((c) => {
        if (customerTypeFilter === "Retail") {
          return !c.customerType || c.customerType === "Retail";
        }
        return c.customerType === customerTypeFilter;
      });
    }

    // Sorting
    switch (sortBy) {
      case "Ascending":
        return [...result].sort((a, b) =>
          (a.name || "").localeCompare(b.name || ""),
        );
      case "Descending":
        return [...result].sort((a, b) =>
          (b.name || "").localeCompare(a.name || ""),
        );
      case "Recently Added":
        return [...result].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
      default:
        return result;
    }
  }, [customers, customerTypeFilter, sortBy]);

  // Handlers
  const handlePageChange = (page, newPageSize) => {
    setCurrentPage(page);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(1);
    }
  };

  const handleAddCustomer = () => navigate("/customer/add");

  const handleEditCustomer = (customer) => {
    navigate(`/customer/edit/${customer.customerId}`, { state: { customer } });
  };

  const handleDelete = (customerId) => {
    setCustomerToDelete(customerId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      await deleteCustomer(customerToDelete).unwrap();
      message.success("Customer deleted successfully");

      if (filteredCustomers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      const msg = err?.data?.message || "Failed to delete customer";
      if (msg.toLowerCase().includes("quotation")) {
        message.error("Cannot delete — customer has linked quotations.");
      } else {
        message.error(msg);
      }
    } finally {
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCustomerTypeFilter("All");
    setSortBy("Recently Added");
    setCurrentPage(1);
  };

  // ── Shared Menu Items for Actions Dropdown ───────────────────────────────
  const getCustomerMenuItems = (customer) => [
    {
      key: "view",
      label: (
        <a
          href={`/customer/${customer.customerId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <EyeOutlined className="me-2" /> View
        </a>
      ),
    },
    {
      key: "delete",
      danger: true,
      label: (
        <>
          <BiTrash className="me-2" /> Delete
        </>
      ),
      onClick: () => handleDelete(customer.customerId),
    },
  ];

  // Loading / Error states
  if (isLoading) {
    return (
      <div className="content p-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading customers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content p-4">
        <div className="alert alert-danger">
          Error: {error?.data?.message || "Failed to load customers"}
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Customers"
            subtitle="Manage your customer database"
            onAdd={handleAddCustomer}
          />

          <div className="card-body">
            {/* Filters */}
            <div className="row mb-4 align-items-center g-3">
              <div className="col-lg-3">
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
                      {type.label}
                      {type.value !== "All" && (
                        <span className="text-muted ms-2">
                          (
                          {
                            customers.filter((c) =>
                              type.value === "Retail"
                                ? !c.customerType || c.customerType === "Retail"
                                : c.customerType === type.value,
                            ).length
                          }
                          )
                        </span>
                      )}
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="col-lg-4">
                <Input
                  prefix={<SearchOutlined className="text-muted" />}
                  placeholder="Search name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="large"
                  allowClear
                />
              </div>

              <div className="col-lg-5 d-flex justify-content-end gap-2 flex-wrap">
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ width: 180 }}
                  size="large"
                >
                  <Option value="Recently Added">Recently Added</Option>
                  <Option value="Ascending">Name: A to Z</Option>
                  <Option value="Descending">Name: Z to A</Option>
                </Select>

                <Button onClick={clearFilters} size="large">
                  Clear
                </Button>

                {/* View Mode Toggle */}
                <div className="btn-group" role="group">
                  <Button
                    className={viewMode === "list" ? "active-red-btn" : ""}
                    icon={<BarsOutlined />}
                    onClick={() => setViewMode("list")}
                    size="large"
                  />
                  <Button
                    className={viewMode === "card" ? "active-red-btn" : ""}
                    icon={<AppstoreOutlined />}
                    onClick={() => setViewMode("card")}
                    size="large"
                  />
                </div>
              </div>
            </div>

            {/* Loading indicator during fetch */}
            {isFetching && !isLoading && (
              <div className="text-center my-3">
                <span className="text-muted">Updating...</span>
              </div>
            )}

            {/* CARD VIEW */}
            {viewMode === "card" && (
              <div className="row g-4">
                {filteredCustomers.length === 0 ? (
                  <div className="col-12 text-center py-5">
                    <p className="text-muted">No customers found.</p>
                  </div>
                ) : (
                  filteredCustomers.map((c) => (
                    <div
                      key={c.customerId}
                      className="col-md-6 col-lg-4 col-xl-3"
                    >
                      <div className="card h-100 shadow-sm border-0 hover-shadow">
                        <div className="card-body text-center p-4">
                          <Avatar
                            name={c.name || c.companyName || "Customer"}
                            round
                            size="80"
                            className="mb-3"
                            color="#e31e24"
                            fgColor="#fff"
                          />

                          <h6 className="mb-1">
                            {c.name || "Unnamed Customer"}
                          </h6>
                          {c.companyName && (
                            <p className="text-muted small">{c.companyName}</p>
                          )}
                          <p className="text-muted small mb-2">
                            {c.email || c.mobileNumber || "—"}
                          </p>
                          <div className="d-flex justify-content-center gap-2 mb-3">
                            <span className="badge bg-light text-dark">
                              {c.customerType || "Retail"}
                            </span>
                          </div>

                          <div className="d-flex justify-content-center gap-2">
                            <PermissionGate api="edit" module="customers">
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleEditCustomer(c)}
                              />
                            </PermissionGate>

                            <PermissionGate
                              api="view|delete"
                              module="customers"
                            >
                              <Dropdown
                                menu={{ items: getCustomerMenuItems(c) }}
                                trigger={["click"]}
                              >
                                <Button size="small" icon={<MoreOutlined />} />
                              </Dropdown>
                            </PermissionGate>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === "list" && (
              <div className="table-responsive">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted">No customers found.</p>
                  </div>
                ) : (
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
                      {filteredCustomers.map((c) => (
                        <tr key={c.customerId}>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <Avatar
                                name={c.name || c.companyName}
                                round
                                size="40"
                                color="#e31e24"
                                fgColor="#fff"
                              />
                              <a
                                href={`/customer/${c.customerId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary fw-medium"
                              >
                                {c.name || "Unnamed"}
                              </a>
                            </div>
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
                              <PermissionGate api="edit" module="customers">
                                <Button
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() => handleEditCustomer(c)}
                                />
                              </PermissionGate>

                              <PermissionGate
                                api="view|delete"
                                module="customers"
                              >
                                <Dropdown
                                  menu={{ items: getCustomerMenuItems(c) }}
                                  trigger={["click"]}
                                >
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<MoreOutlined />}
                                  />
                                </Dropdown>
                              </PermissionGate>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Pagination */}
            {pagination.total > 0 && (
              <div className="mt-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="text-muted small">
                  Showing {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, pagination.total)} of{" "}
                  {pagination.total} customers
                </div>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  showSizeChanger
                  pageSizeOptions={["10", "20", "50", "100"]}
                  disabled={isFetching}
                />
              </div>
            )}
          </div>
        </div>

        <DeleteModal
          isVisible={showDeleteModal}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setCustomerToDelete(null);
          }}
          itemType="Customer"
        />
      </div>
    </div>
  );
};

export default CustomerList;
