import React, { useState, useMemo } from "react";
import PageHeader from "../Common/PageHeader";
import {
  useGetAllAddressesQuery,
  useDeleteAddressMutation,
} from "../../api/addressApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { AiOutlineEdit } from "react-icons/ai";
import { BiTrash } from "react-icons/bi";
import AddAddress from "./AddAddressModal";
import DeleteModal from "../Common/DeleteModal";
import { toast } from "sonner";
import DataTablePagination from "../Common/DataTablePagination";
import { Link } from "react-router-dom";
import { Input, Select } from "antd";

const { Option } = Select;

// Custom CSS for search bar and sort dropdown
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
  .address-list-sort .ant-select-selector {
    border-radius: 8px;
    border: 1px solid #e31e24;
    padding: 8px 12px;
    background-color: #fff;
    font-size: 16px;
    color: #333;
    height: 40px;
    transition: all 0.3s ease;
  }
  .address-list-sort .ant-select-selector:hover,
  .address-list-sort .ant-select-focused .ant-select-selector {
    border-color: #ff4d4f;
    box-shadow: 0 0 5px rgba(227, 30, 36, 0.3);
  }
  .address-list-sort .ant-select-arrow {
    color: #e31e24;
  }
  .address-list-sort .ant-select-item-option-selected {
    background-color: #ffe6e6;
    color: #e31e24;
  }
  .address-list-sort .ant-select-item-option-active {
    background-color: #fff1f0;
  }
  .address-list-card-header {
    padding: 16px;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
  }
  @media (max-width: 768px) {
    .address-list-search .ant-input-affix-wrapper {
      width: 100% !important;
      margin-bottom: 12px;
    }
    .address-list-sort .ant-select {
      width: 100% !important;
    }
    .address-list-card-header {
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
  const [selectedAddresses, setSelectedAddresses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const itemsPerPage = 10;

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

    result.sort((a, b) => {
      const fieldA =
        sortField === "username"
          ? userMap[a.userId] || "No User"
          : a[sortField];
      const fieldB =
        sortField === "username"
          ? userMap[b.userId] || "No User"
          : b[sortField];

      if (!fieldA && !fieldB) return 0;
      if (!fieldA) return sortOrder === "asc" ? 1 : -1;
      if (!fieldB) return sortOrder === "asc" ? -1 : 1;

      if (sortField === "createdAt") {
        const dateA = new Date(fieldA);
        const dateB = new Date(fieldB);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }

      const valueA = typeof fieldA === "string" ? fieldA.toLowerCase() : fieldA;
      const valueB = typeof fieldB === "string" ? fieldB.toLowerCase() : fieldB;
      if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
      if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [addresses, userMap, searchQuery, sortField, sortOrder]);

  const formattedAddresses = filteredAndSortedAddresses.map((address) => ({
    addressId: address.addressId,
    street: address.street || "—",
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    createdAt: new Date(address.createdAt).toLocaleDateString(),
    username:
      userMap[address.userId] || (userLoading ? "Loading..." : "No User"),
  }));

  const paginatedAddresses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedAddresses
      .map((address) => ({
        ...address,
        username:
          userMap[address.userId] || (userLoading ? "Loading..." : "No User"),
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
      toast.success("Address deleted successfully!");
      if (paginatedAddresses.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      setShowDeleteModal(false);
      setAddressToDelete(null);
      setSelectedAddresses([]);
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

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelectedAddresses([]);
  };

  const handleSelectAll = () => {
    const currentIds = paginatedAddresses.map((a) => a.addressId);
    setSelectedAddresses(
      selectedAddresses.length === currentIds.length ? [] : currentIds
    );
  };

  const toggleAddress = (id) => {
    setSelectedAddresses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    const [field, order] = value.split(":");
    setSortField(field);
    setSortOrder(order);
  };

  if (addressLoading || userLoading) return <p>Loading...</p>;
  if (addressError)
    return <p>Error fetching addresses: {JSON.stringify(addressError)}</p>;
  if (userError)
    return <p>Error fetching users: {JSON.stringify(userError)}</p>;
  if (addresses.length === 0) return <p>No addresses available.</p>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Addresses"
          subtitle="Manage user address records"
          onAdd={handleAddAddress}
          tableData={formattedAddresses}
        />
        <div className="card">
          <div className="card-header address-list-card-header">
            <div className="d-flex justify-content-between align-items-center">
              <Input
                className="address-list-search"
                placeholder="Search by username, street, city, etc."
                value={searchQuery}
                onChange={handleSearchChange}
                style={{ width: 300 }}
                prefix={<i className="fa fa-search" />}
              />
              <Select
                className="address-list-sort"
                defaultValue="createdAt:desc"
                style={{ width: 200 }}
                onChange={handleSortChange}
              >
                <Option value="username:asc">Username (A-Z)</Option>
                <Option value="username:desc">Username (Z-A)</Option>
                <Option value="city:asc">City (A-Z)</Option>
                <Option value="city:desc">City (Z-A)</Option>
                <Option value="createdAt:asc">Date Added (Oldest)</Option>
                <Option value="createdAt:desc">Date Added (Newest)</Option>
              </Select>
            </div>
          </div>
          <div className="card-body-2">
            {paginatedAddresses.length === 0 ? (
              <p>No matching addresses found.</p>
            ) : (
              paginatedAddresses.map((address) => (
                <div
                  className="card-list"
                  key={address.addressId}
                  style={{ fontSize: "20px" }}
                >
                  <div className="card-content" key={address.addressId}>
                    <div className="left-section">
                      <p>
                        <Link
                          to={`/user/${address.userId || "profile"}`}
                          style={{ color: "#e31e24", fontWeight: "bold" }}
                        >
                          {address.username}
                        </Link>
                      </p>
                      <div className="address-info">
                        <div className="line-1">
                          {address.street || "—"} {address.city} {address.state}
                        </div>
                        <div className="line-2">
                          {address.postalCode} {address.country}
                        </div>
                      </div>
                    </div>
                    <div className="actions">
                      <AiOutlineEdit
                        onClick={() => handleEditAddress(address)}
                      />
                      <BiTrash onClick={() => handleDeleteAddress(address)} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="card-footer">
            <DataTablePagination
              totalItems={filteredAndSortedAddresses.length}
              itemNo={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
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
  );
};

export default AddressList;
