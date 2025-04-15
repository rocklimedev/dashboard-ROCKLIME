import React, { useState, useEffect } from "react";
import PageHeader from "../Common/PageHeader";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useDeleteCustomerMutation } from "../../api/customerApi";
import AddCustomer from "./AddCustomer";
import Actions from "../Common/Actions";
import DeleteModal from "../Common/DeleteModal";
import { BiEdit, BiTrash } from "react-icons/bi";
import { FaEye } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CustomerList = () => {
  const { data, error, isLoading } = useGetCustomersQuery();
  const customers = data?.data || [];
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteCustomer] = useDeleteCustomerMutation();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching customers.</p>;
  if (customers.length === 0) return <p>No customers available.</p>;

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setShowModal(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer({ ...customer }); // Ensure new reference
    setShowModal(true); // Open modal to edit customer
  };

  const handleDelete = (customerId) => {
    setCustomerToDelete(customerId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) {
      console.warn("No customer selected to delete.");
      return;
    }

    try {
      await deleteCustomer(customerToDelete).unwrap();
      toast.success("Customer deleted successfully!"); // Success toast
    } catch (err) {
      console.error("Error deleting customer:", err);
      toast.error("Failed to delete customer!"); // Error toast
    } finally {
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <PageHeader
            title="Customers"
            subtitle="Manage your Customers"
            onAdd={handleAddCustomer}
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
                    {customers.map((customer) => (
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
                          {/* <Actions
                            id={customer.customerId}
                            name={customer.name}
                            viewUrl={`/customer/${customer.customerId}`}
                            onEdit={() => handleEditCustomer(customer)}
                            onDelete={() => handleDelete(customer.customerId)}
                          /> */}

                          <div class="edit-delete-action">
                            <a
                              href={`/customer/${customer.customerId}`}
                              target="_blank"
                            >
                              <FaEye />
                            </a>
                            <a
                              class="me-2 p-2"
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
          </div>
        </div>
      </div>

      {showModal && (
        <AddCustomer
          key={selectedCustomer?.customerId || "new"} // Ensures fresh re-render
          onClose={() => setShowModal(false)}
          existingCustomer={selectedCustomer}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          itemType="Customer"
          isVisible={showDeleteModal}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
};

export default CustomerList;
