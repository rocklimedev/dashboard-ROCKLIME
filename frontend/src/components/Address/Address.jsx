import React, { useState, useMemo } from "react";
import { FaSearch } from "react-icons/fa";
import {
  useGetAllAddressesQuery,
  useDeleteAddressMutation,
} from "../../api/addressApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { Dropdown, Menu, Button, Pagination, Input } from "antd";
import DeleteModal from "../Common/DeleteModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PageHeader from "../Common/PageHeader";
import AddAddress from "./AddAddressModal";

// Custom CSS for search bar and table styling
const styles = `
  .address-list-search .ant-input-affix-wrapper {
    border-radius: 8px;
    border: 1px solid #e31e24;
    padding: 8px 12px;
    background-color: #fff;
    transition: all 0.3s ease;
  }
  .address-list-search .ant-input {
    font-size: 16px;
    color: #333;
  }
  .address-list-search .ant-input-prefix {
    color: #e31e24;
    margin-right: 8px;
  }
  .address-list-search .ant-input-affix-wrapper:hover,
  .address-list-search .ant-input-affix-wrapper-focused {
    border-color: #ff4d4f;
    box-shadow: 0 0 5px rgba(227, 30, 36, 0.3);
  }
  .address-list-search .ant-input-clear-icon {
    color: #e31e24;
  }
  .table-responsive .ant-table {
    border-radius: 8px;
    overflow: hidden;
  }
  .table-responsive .ant-table-thead > tr > th {
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    font-weight: 600;
    color: #333;
  }
  .table-responsive .ant-table-tbody > tr:hover > td {
    background-color: #fff1f0;
  }
  .pagination-section .ant-pagination-item-active {
    border-color: #e31e24;
    background-color: #e31e24;
    color: #fff;
  }
  .pagination-section .ant-pagination-item-active a {
    color: #fff;
  }
  @media (max-width: 768px) {
    .address-list-search .ant-input-affix-wrapper {
      width: 100% !important;
      margin-bottom: 12px;
    }
    .address-list-controls {
      flex-direction: column;
      align-items: stretch !important;
    }
  }
`;

// Inject styles into the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const AddressList = () => {
  const {
    data: addressesData,
    error: addressError,
    isLoading: addressLoading,
    refetch,
  } = useGetAllAddressesQuery();
  const [deleteAddress, { isLoading: isDeleting }] = useDeleteAddressMutation();
  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
  } = useGetAllUsersQuery();
  const addresses = Array.isArray(addressesData) ? addressesData : [];
  const users = Array.isArray(userData?.users) ? userData.users : [];

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const itemsPerPage = 10;

  const navigate = useNavigate();

  const userMap = users.reduce((acc, user) => {
    acc[user.userId] = user.username || "Unknown User";
    return acc;
  }, {});

  const filteredAndSortedAddresses = useMemo(() => {
    let result = [...addresses];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (address) =>
          (userMap[address.userId] || "No User")
            .toLowerCase()
            .includes(query) ||
          (address.street || "").toLowerCase().includes(query) ||
          address.city.toLowerCase().includes(query) ||
          address.state.toLowerCase().includes(query) ||
          address.postalCode.toLowerCase().includes(query) ||
          address.country.toLowerCase().includes(query)
      );
    }

    switch (sortBy) {
      case "Username Ascending":
        result = [...result].sort((a, b) =>
          (userMap[a.userId] || "No User").localeCompare(
            userMap[b.userId] || "No User"
          )
        );
        break;
      case "Username Descending":
        result = [...result].sort((a, b) =>
          (userMap[b.userId] || "No User").localeCompare(
            userMap[a.userId] || "No User"
          )
        );
        break;
      case "City Ascending":
        result = [...result].sort((a, b) => a.city.localeCompare(b.city));
        break;
      case "City Descending":
        result = [...result].sort((a, b) => b.city.localeCompare(a.city));
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
  }, [addresses, userMap, searchQuery, sortBy]);

  const paginatedAddresses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedAddresses
      .map((address) => ({
        ...address,
        username:
          userMap[address.userId] || (userLoading ? "Loading..." : "No User"),
        createdAt: new Date(address.createdAt).toLocaleDateString(),
      }))
      .slice(startIndex, endIndex);
  }, [filteredAndSortedAddresses, currentPage, userMap, userLoading]);

  const handleAddAddress = () => {
    setEditMode(false);
    setSelectedAddress(null);
    setShowModal(true);
  };

  const handleEditAddress = (address) => {
    setEditMode(true);
    setSelectedAddress(address);
    setShowModal(true);
  };

  const handleDeleteAddress = (address) => {
    setAddressToDelete(address);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!addressToDelete?.addressId) {
      toast.error("No address selected for deletion");
      setShowDeleteModal(false);
      return;
    }
    try {
      await deleteAddress(addressToDelete.addressId).unwrap();
      if (paginatedAddresses.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }

      setShowDeleteModal(false);
      setAddressToDelete(null);
      refetch();
    } catch (err) {
      toast.error(
        `Failed to delete address: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedAddress(null);
    refetch();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("Recently Added");
    setCurrentPage(1);
  };

  if (addressLoading || userLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading addresses...</p>
          </div>
        </div>
      </div>
    );
  }

  if (addressError || userError) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              Error fetching data:{" "}
              {addressError?.data?.message ||
                userError?.data?.message ||
                "Unknown error"}
              <button className="btn btn-link ms-2" onClick={refetch}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (username, record) => (
        <a
          onClick={() => navigate(`/user/${record.userId || "profile"}`)}
          style={{ color: "#e31e24" }}
        >
          {username}
        </a>
      ),
    },
    {
      title: "Street",
      dataIndex: "street",
      key: "street",
      render: (street) => street || "—",
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
    },
    {
      title: "State",
      dataIndex: "state",
      key: "state",
    },
    {
      title: "Postal Code",
      dataIndex: "postalCode",
      key: "postalCode",
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="view"
                onClick={() => navigate(`/user/${record.userId || "profile"}`)}
                title={`View ${record.username || "user"}'s profile`}
              >
                <EyeOutlined style={{ marginRight: 8 }} />
                View User
              </Menu.Item>
              <Menu.Item
                key="edit"
                onClick={() => handleEditAddress(record)}
                title={`Edit ${record.username || "address"}`}
              >
                <EditOutlined style={{ marginRight: 8 }} />
                Edit Address
              </Menu.Item>
              <Menu.Item
                key="delete"
                onClick={() => handleDeleteAddress(record)}
                disabled={isDeleting}
                style={{ color: "#ff4d4f" }}
                title={`Delete ${record.username || "address"}`}
              >
                <DeleteOutlined style={{ marginRight: 8 }} />
                Delete Address
              </Menu.Item>
            </Menu>
          }
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            aria-label={`More actions for ${record.username || "address"}`}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Addresses"
            subtitle="Manage user address records"
            onAdd={handleAddAddress}
            tableData={filteredAndSortedAddresses}
          />
          <div className="card-body">
            <div className="row">
              <div className="col-lg-12">
                <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3 address-list-controls">
                  <div className="input-icon-start position-relative">
                    <Input
                      className="address-list-search"
                      placeholder="Search by username, street, city, etc."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      prefix={<FaSearch />}
                      style={{ width: 300 }}
                    />
                  </div>
                  <div className="d-flex align-items-center">
                    <select
                      className="form-select me-2"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{ width: 200 }}
                    >
                      <option value="Username Ascending">Username (A-Z)</option>
                      <option value="Username Descending">
                        Username (Z-A)
                      </option>
                      <option value="City Ascending">City (A-Z)</option>
                      <option value="City Descending">City (Z-A)</option>
                      <option value="Recently Added">Recently Added</option>
                    </select>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Street</th>
                    <th>City</th>
                    <th>State</th>
                    <th>Postal Code</th>
                    <th>Country</th>
                    <th>Created At</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAddresses.map((address) => (
                    <tr key={address.addressId}>
                      <td>
                        <a
                          onClick={() =>
                            navigate(`/user/${address.userId || "profile"}`)
                          }
                          style={{ color: "#e31e24" }}
                        >
                          {address.username}
                        </a>
                      </td>
                      <td>{address.street || "—"}</td>
                      <td>{address.city}</td>
                      <td>{address.state}</td>
                      <td>{address.postalCode}</td>
                      <td>{address.country}</td>
                      <td>{address.createdAt}</td>
                      <td>
                        <Dropdown
                          overlay={
                            <Menu>
                              <Menu.Item
                                key="view"
                                onClick={() =>
                                  navigate(
                                    `/user/${address.userId || "profile"}`
                                  )
                                }
                                title={`View ${
                                  address.username || "user"
                                }'s profile`}
                              >
                                <EyeOutlined style={{ marginRight: 8 }} />
                                View User
                              </Menu.Item>
                              <Menu.Item
                                key="edit"
                                onClick={() => handleEditAddress(address)}
                                title={`Edit ${address.username || "address"}`}
                              >
                                <EditOutlined style={{ marginRight: 8 }} />
                                Edit Address
                              </Menu.Item>
                              <Menu.Item
                                key="delete"
                                onClick={() => handleDeleteAddress(address)}
                                disabled={isDeleting}
                                style={{ color: "#ff4d4f" }}
                                title={`Delete ${
                                  address.username || "address"
                                }`}
                              >
                                <DeleteOutlined style={{ marginRight: 8 }} />
                                Delete Address
                              </Menu.Item>
                            </Menu>
                          }
                          trigger={["click"]}
                          placement="bottomRight"
                        >
                          <Button
                            type="text"
                            icon={<MoreOutlined />}
                            aria-label={`More actions for ${
                              address.username || "address"
                            }`}
                          />
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAndSortedAddresses.length > itemsPerPage && (
                <div className="pagination-section mt-4 d-flex justify-content-end">
                  <Pagination
                    current={currentPage}
                    pageSize={itemsPerPage}
                    total={filteredAndSortedAddresses.length}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showQuickJumper
                  />
                </div>
              )}
            </div>
            {paginatedAddresses.length === 0 && (
              <p className="text-muted">
                No addresses match the applied filters
              </p>
            )}
          </div>
        </div>
        {showModal && (
          <AddAddress
            onClose={handleCloseModal}
            existingAddress={selectedAddress}
          />
        )}
        {showDeleteModal && (
          <DeleteModal
            item={addressToDelete}
            itemType="Address"
            isVisible={showDeleteModal}
            onConfirm={handleConfirmDelete}
            onCancel={() => {
              setShowDeleteModal(false);
              setAddressToDelete(null);
            }}
            isLoading={isDeleting}
          />
        )}
      </div>
    </div>
  );
};

export default AddressList;
