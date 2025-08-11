import React, { useState, useMemo } from "react";
import {
  useGetCustomersQuery,
  useDeleteCustomerMutation,
} from "../../api/customerApi";
import AddCustomer from "./AddCustomer";
import { BiEdit, BiTrash } from "react-icons/bi";
import { FaEye, FaSearch } from "react-icons/fa";
import { toast } from "sonner";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import PageHeader from "../Common/PageHeader";
import { BsThreeDotsVertical } from "react-icons/bs";
import { Dropdown, Button, Menu } from "antd";

const CustomerList = () => {
  const { data, error, isLoading } = useGetCustomersQuery();
  const customers = data?.data || [];
  const [deleteCustomer] = useDeleteCustomerMutation();

  // State for modals, selected customer, pagination, and filters
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [activeTab, setActiveTab] = useState("All");
  const itemsPerPage = 20;

  // Memoized grouped customers for tab-based filtering
  const groupedCustomers = useMemo(
    () => ({
      All: customers,
      Active: customers.filter((c) => c.isActive !== false), // Assuming isActive boolean
      Inactive: customers.filter((c) => c.isActive === false),
    }),
    [customers]
  );

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    let result = groupedCustomers[activeTab] || [];

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter((c) =>
        [c.name, c.email, c.companyName, c.mobileNumber]
          .filter(Boolean)
          .some((field) =>
            field.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "Ascending":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "Descending":
        result = [...result].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "Recently Added":
        result = [...result].sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        ); // Assuming createdAt exists
        break;
      default:
        break;
    }

    return result;
  }, [groupedCustomers, activeTab, searchTerm, sortBy]);

  // Paginated customers
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  // Handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setShowModal(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer({ ...customer });
    setShowModal(true);
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

      if (paginatedCustomers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      if (
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
  };

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
            <div className="row">
              <div className="col-lg-12">
                <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                  <div className="input-icon-start position-relative">
                    <span className="input-icon-addon">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Customers"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Search customers"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="tab-content" id="pills-tabContent">
              {Object.entries(groupedCustomers).map(([status, list]) => (
                <div
                  className={`tab-pane fade ${
                    activeTab === status ? "show active" : ""
                  }`}
                  id={`pills-${status}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${status}`}
                  key={status}
                >
                  {paginatedCustomers.length === 0 ? (
                    <p className="text-muted">
                      No {status.toLowerCase()} customers match the applied
                      filters
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
                            <th>Total Amount</th>
                            <th>Balance</th>
                            <th>Paid Amount</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedCustomers.map((customer) => (
                            <tr key={customer.customerId}>
                              <td>
                                {" "}
                                <a
                                  href={`/customer/${customer.customerId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {customer.name || "N/A"}
                                </a>
                              </td>
                              <td>{customer.email || "N/A"}</td>
                              <td>{customer.mobileNumber || "N/A"}</td>
                              <td>{customer.companyName || "N/A"}</td>
                              <td>{customer.totalAmount || "0"}</td>
                              <td>{customer.balance || "0"}</td>
                              <td>{customer.paidAmount || "0"}</td>
                              <td>
                                <Dropdown
                                  trigger={["click"]}
                                  overlay={
                                    <Menu>
                                      <Menu.Item key="view">
                                        <a
                                          href={`/customer/${customer.customerId}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <FaEye className="me-2" />
                                          View
                                        </a>
                                      </Menu.Item>
                                      <Menu.Item
                                        key="edit"
                                        onClick={() =>
                                          handleEditCustomer(customer)
                                        }
                                      >
                                        <BiEdit className="me-2" />
                                        Edit
                                      </Menu.Item>
                                      <Menu.Item
                                        key="delete"
                                        onClick={() =>
                                          handleDelete(customer.customerId)
                                        }
                                        danger
                                      >
                                        <BiTrash className="me-2" />
                                        Delete
                                      </Menu.Item>
                                    </Menu>
                                  }
                                  placement="bottomRight"
                                >
                                  <Button
                                    type="text"
                                    icon={<BsThreeDotsVertical />}
                                  />
                                </Dropdown>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredCustomers.length > itemsPerPage && (
                        <div className="pagination-section mt-4">
                          <DataTablePagination
                            totalItems={filteredCustomers.length}
                            itemNo={itemsPerPage}
                            onPageChange={handlePageChange}
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

        {showModal && (
          <AddCustomer
            key={selectedCustomer?.customerId || "new"}
            onClose={() => setShowModal(false)}
            existingCustomer={selectedCustomer}
          />
        )}

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
