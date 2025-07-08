import React, { useState } from "react";
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
import Avatar from "react-avatar";
import { Tooltip } from "antd";
import { Link } from "react-router-dom";

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
  const itemsPerPage = 10;

  // Create a map of userId to username for efficient lookup
  const userMap = users.reduce((acc, user) => {
    acc[user.userId] = user.username || "Unknown User";
    return acc;
  }, {});

  // Format addresses for tableData prop, including username
  const formattedAddresses = addresses.map((address) => ({
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

  const paginatedAddresses = (() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return addresses
      .map((address) => ({
        ...address,
        username:
          userMap[address.userId] || (userLoading ? "Loading..." : "No User"),
      }))
      .slice(startIndex, endIndex);
  })();

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
          <div className="card-body-2">
            {paginatedAddresses.map((address) => (
              <div
                className="card-list"
                key={address.addressId}
                style={{ fontSize: "20px" }}
              >
                <div className="card-content" key={address.addressId}>
                  <div className="left-section">
                    <div className="address-info">
                      <div className="line-1">
                        {address.street || "—"} {address.city} {address.state}
                      </div>
                      <div className="line-2">
                        {address.postalCode} {address.country}
                      </div>
                    </div>
                    <p>
                      of{" "}
                      <Link
                        to={`/user/${address.userId || "profile"}`}
                        style={{ color: "#e31e24" }}
                      >
                        {address.username}
                      </Link>
                    </p>
                  </div>
                  <div className="actions">
                    <AiOutlineEdit onClick={() => handleEditAddress(address)} />
                    <BiTrash onClick={() => handleDeleteAddress(address)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card-footer">
            <DataTablePagination
              totalItems={addresses.length}
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
