import React, { useState, useEffect } from "react";
import PageHeader from "../Common/PageHeader";
import { useGetCustomersQuery } from "../../api/customerApi";
import AddCustomer from "./AddCustomer";
import Actions from "../Common/Actions";
import DeleteModal from "../Common/DeleteModal";
import { BiEdit, BiTrash } from "react-icons/bi";
const CustomerList = () => {
  const { data, error, isLoading } = useGetCustomersQuery();
  const customers = data?.data || [];

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching customers.</p>;
  if (customers.length === 0) return <p>No customers available.</p>;

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setShowModal(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer({ ...customer }); // Ensure new reference
    setShowModal(true); // Close the modal first
    // Open modal after a slight delay
  };

  const handleDelete = (customerId) => {
    setCustomerToDelete(customerId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    console.log("Deleting customer:", customerToDelete);
    setShowDeleteModal(false);
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
                              class="me-2 p-2"
                              onClick={() => handleEditCustomer(customer)}
                            >
                              <BiEdit />
                            </a>
                            <a
                              data-bs-toggle="modal"
                              data-bs-target="#delete-modal"
                              class="p-2"
                              href="javascript:void(0);"
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
