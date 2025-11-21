import React, { useState, useMemo } from "react";
import {
  useGetCustomersQuery,
  useDeleteCustomerMutation,
} from "../../api/customerApi";
import Avatar from "react-avatar";
import { BiTrash } from "react-icons/bi";
import { FaEye, FaSearch, FaThList, FaThLarge } from "react-icons/fa";
import { message } from "antd";
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

  // State
  const [viewMode, setViewMode] = useState("list"); // that's it!
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("All");

  const customerTypes = [
    { value: "All", label: "All Customers" },
    { value: "Retail", label: "Retail" },
    { value: "Architect", label: "Architect" },
    { value: "Interior", label: "Interior" },
    { value: "Builder", label: "Builder" },
    { value: "Contractor", label: "Contractor" },
  ];

  // Safe helpers
  const safeString = (val) => (val ? String(val).trim() : "");
  const getInitials = (name) => {
    if (!name) return "CU";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Filtered & sorted
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

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((c) =>
        [c.name, c.email, c.companyName, c.mobileNumber]
          .filter(Boolean)
          .some((f) => safeString(f).toLowerCase().includes(term))
      );
    }

    switch (sortBy) {
      case "Ascending":
        result = [...result].sort((a, b) =>
          safeString(a.name).localeCompare(safeString(b.name))
        );
        break;
      case "Descending":
        result = [...result].sort((a, b) =>
          safeString(b.name).localeCompare(safeString(a.name))
        );
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

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Handlers
  const handlePageChange = (page, newPageSize) => {
    setCurrentPage(page);
    if (newPageSize !== pageSize) setPageSize(newPageSize);
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
      if (paginatedCustomers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      if (err?.data?.message?.toLowerCase().includes("quotation")) {
        message.error("Cannot delete — quotations are linked.");
      } else {
        message.error(err?.data?.message || "Failed to delete customer");
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

  // Loading / Error
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
            {/* Filters + View Toggle */}
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
                      {type.label}{" "}
                      {type.value !== "All" && (
                        <span className="text-muted">
                          (
                          {
                            customers.filter((c) =>
                              type.value === "Retail"
                                ? !c.customerType || c.customerType === "Retail"
                                : c.customerType === type.value
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
                  />
                </div>
              </div>

              <div className="col-lg-5 d-flex justify-content-end gap-2 flex-wrap">
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ width: 180 }}
                >
                  <Option value="Recently Added">Recently Added</Option>
                  <Option value="Ascending">Name: A to Z</Option>
                  <Option value="Descending">Name: Z to A</Option>
                </Select>

                <Button onClick={clearFilters}>Clear</Button>

                {/* View Toggle */}
                <div className="btn-group">
                  <Button
                    type={viewMode === "list" ? "primary" : "default"}
                    onClick={() => setViewMode("list")}
                    icon={<FaThList />}
                  />
                  <Button
                    type={viewMode === "card" ? "primary" : "default"}
                    onClick={() => setViewMode("card")}
                    icon={<FaThLarge />}
                  />
                </div>
              </div>
            </div>

            {/* CARD VIEW */}
            {viewMode === "card" && (
              <div className="row g-4">
                {paginatedCustomers.map((c) => (
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
                          color="#1890ff"
                          fgColor="#fff"
                        />
                        <h6 className="mb-1">{c.name || "Unnamed Customer"}</h6>
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
                          <PermissionGate
                            api="edit"
                            module="Customer Management"
                          >
                            <Button
                              size="small"
                              onClick={() => handleEditCustomer(c)}
                            >
                              <EditOutlined />
                            </Button>
                          </PermissionGate>

                          <PermissionGate api="view|delete" module="customers">
                            <Dropdown
                              trigger={["click"]}
                              overlay={
                                <Menu>
                                  <PermissionGate api="view" module="customers">
                                    <Menu.Item>
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
                                      danger
                                      onClick={() => handleDelete(c.customerId)}
                                    >
                                      <BiTrash className="me-2" /> Delete
                                    </Menu.Item>
                                  </PermissionGate>
                                </Menu>
                              }
                            >
                              <Button
                                size="small"
                                icon={<BsThreeDotsVertical />}
                              />
                            </Dropdown>
                          </PermissionGate>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === "list" && (
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
                          <div className="d-flex align-items-center gap-3">
                            <Avatar
                              name={c.name || c.companyName}
                              round
                              size="40"
                              color="#1890ff"
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
                            <PermissionGate
                              api="edit"
                              module="Customer Management"
                            >
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
                                trigger={["click"]}
                                overlay={
                                  <Menu>
                                    <PermissionGate
                                      api="view"
                                      module="customers"
                                    >
                                      <Menu.Item>
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
              </div>
            )}

            {/* Pagination */}
            {filteredCustomers.length > pageSize && (
              <div className="mt-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="text-muted small">
                  Showing {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filteredCustomers.length)}{" "}
                  of {filteredCustomers.length}
                </div>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredCustomers.length}
                  onChange={handlePageChange}
                  showSizeChanger
                  pageSizeOptions={["10", "20", "50", "100"]}
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
