import React, { useState, useEffect } from "react";
import PageHeader from "../Common/PageHeader";
import {
  useGetCustomersQuery,
  useDeleteCustomerMutation,
} from "../../api/customerApi";
import AddCustomer from "./AddCustomer";
import { BiEdit, BiTrash } from "react-icons/bi";
import { FaEye } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";

const CustomerList = () => {
  const { data, error, isLoading } = useGetCustomersQuery();
  const customers = data?.data || [];
  const [deleteCustomer] = useDeleteCustomerMutation();

  // State for modals, selected customer, and pagination
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Format customers for tableData prop
  const formattedCustomers = customers.map((customer) => ({
    customerId: customer.customerId,
    name: customer.name,
    email: customer.email,
    mobileNumber: customer.mobileNumber,
    companyName: customer.companyName,
    isVendor: customer.isVendor ? "Yes" : "No",
    totalAmount: customer.totalAmount,
    balance: customer.balance,
    paidAmount: customer.paidAmount,
  }));

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Paginated customers
  const paginatedCustomers = (() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return customers.slice(startIndex, endIndex);
  })();

  // Handle add customer
  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setShowModal(true);
  };

  // Handle edit customer
  const handleEditCustomer = (customer) => {
    setSelectedCustomer({ ...customer });
    setShowModal(true);
  };

  // Handle delete customer
  const handleDelete = (customerId) => {
    setCustomerToDelete(customerId);
    setShowDeleteModal(true);
  };

  // Confirm deletion
  const confirmDelete = async () => {
    if (!customerToDelete) {
      console.warn("No customer selected to delete.");
      return;
    }

    try {
      await deleteCustomer(customerToDelete).unwrap();
      toast.success("Customer deleted successfully!");
      if (paginatedCustomers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      toast.error("Failed to delete customer!");
    } finally {
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching customers.</p>;
  if (customers.length === 0) return <p>No customers available.</p>;

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <PageHeader
            title="Customers"
            subtitle="Manage your Customers"
            onAdd={handleAddCustomer}
            tableData={formattedCustomers} // Pass formatted customers to PageHeader
          />

          <div className="card">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table datatable">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Company</th>
                      <th>Is Vendor</th>
                      <th>Total Amount</th>
                      <th>Balance</th>
                      <th>Paid Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCustomers.map((customer) => (
                      <tr key={customer.customerId}>
                        <td>{customer.name}</td>
                        <td>{customer.email}</td>
                        <td>{customer.mobileNumber}</td>
                        <td>{customer.companyName}</td>
                        <td>{customer?.isVendor ? "Yes" : "No"}</td>
                        <td>{customer.totalAmount}</td>
                        <td>{customer.balance}</td>
                        <td>{customer.paidAmount}</td>
                        <td>
                          <div className="edit-delete-action">
                            <a
                              href={`/customer/${customer.customerId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FaEye />
                            </a>
                            <a
                              className="me-2 p-2"
                              href="javascript:void(0);"
                              onClick={() => handleEditCustomer(customer)}
                            >
                              <BiEdit />
                            </a>
                            <a
                              className="p-2"
                              href="javascript:void(0);"
                              onClick={() => handleDelete(customer.customerId)}
                            >
                              <BiTrash />
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
                totalItems={customers.length}
                itemNo={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
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

      <ToastContainer />
    </>
  );
};

export default CustomerList;
