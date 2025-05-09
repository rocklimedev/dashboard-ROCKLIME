import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import {
  useGetAllAddressesQuery,
  useDeleteAddressMutation,
} from "../../api/addressApi";
import { AiOutlineEdit } from "react-icons/ai";
import { FcEmptyTrash } from "react-icons/fc";
import AddAddress from "./AddAddressModal"; // You need to create this
import DeleteModal from "../Common/DeleteModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DataTablePagination from "../Common/DataTablePagination";

const AddressList = () => {
  const { data, error, isLoading, refetch } = useGetAllAddressesQuery();
  const [deleteAddress, { isLoading: isDeleting }] = useDeleteAddressMutation();
  const addresses = Array.isArray(data) ? data : [];

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAddresses, setSelectedAddresses] = useState([]);
  const itemsPerPage = 20;

  // Format addresses for tableData prop (optional: customize fields)
  const formattedAddresses = addresses.map((address) => ({
    addressId: address.addressId,
    street: address.street || "—",
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    createdAt: new Date(address.createdAt).toLocaleDateString(),
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
    return addresses.slice(startIndex, endIndex);
  })();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching addresses: {JSON.stringify(error)}</p>;
  if (addresses.length === 0) return <p>No addresses available.</p>;

  return (
    <div className="page-wrapper">
      <ToastContainer />
      <div className="content">
        <PageHeader
          title="Addresses"
          subtitle="Manage user address records"
          onAdd={handleAddAddress}
          tableData={formattedAddresses} // Pass formatted addresses to PageHeader
        />

        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>
                      <label className="checkboxs">
                        <input
                          type="checkbox"
                          checked={
                            selectedAddresses.length ===
                              paginatedAddresses.length &&
                            paginatedAddresses.length > 0
                          }
                          onChange={handleSelectAll}
                        />
                        <span className="checkmarks"></span>
                      </label>
                    </th>
                    <th>Street</th>
                    <th>City</th>
                    <th>State</th>
                    <th>Postal Code</th>
                    <th>Country</th>
                    <th>Created</th>
                    <th className="no-sort"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAddresses.map((address) => (
                    <tr key={address.addressId}>
                      <td>
                        <label className="checkboxs">
                          <input
                            type="checkbox"
                            checked={selectedAddresses.includes(
                              address.addressId
                            )}
                            onChange={() => toggleAddress(address.addressId)}
                          />
                          <span className="checkmarks"></span>
                        </label>
                      </td>
                      <td>{address.street || "—"}</td>
                      <td>{address.city}</td>
                      <td>{address.state}</td>
                      <td>{address.postalCode}</td>
                      <td>{address.country}</td>
                      <td>
                        {new Date(address.createdAt).toLocaleDateString()}
                      </td>
                      <td className="action-table-data">
                        <div className="edit-delete-action">
                          <a
                            className="me-2 p-2"
                            onClick={() => handleEditAddress(address)}
                            aria-label="Edit address"
                          >
                            <AiOutlineEdit />
                          </a>
                          <a
                            className="p-2"
                            onClick={() => handleDeleteAddress(address)}
                            aria-label="Delete address"
                          >
                            <FcEmptyTrash />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
