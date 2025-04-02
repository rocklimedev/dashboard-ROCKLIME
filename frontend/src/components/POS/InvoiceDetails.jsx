import React, { useEffect, useState } from "react";
import {
  useCreateAddressMutation,
  useGetAllAddressesQuery,
} from "../../api/addressApi";
import { useGetProfileQuery } from "../../api/userApi";
import { Modal, Button, Form } from "react-bootstrap";

const InvoiceDetails = ({ invoiceData, onChange, error }) => {
  const { shipTo, invoiceDate, dueDate, signatureName, billTo } = invoiceData;
  const { data: userProfile } = useGetProfileQuery();
  const { data: addresses, refetch } = useGetAllAddressesQuery();
  const [createAddress] = useCreateAddressMutation();
  const userId = userProfile?.user?.userId;

  const [showModal, setShowModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  useEffect(() => {
    if (userId) {
      refetch(); // Fetch latest addresses when user profile is available
    }
  }, [userId, refetch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAddress = async () => {
    if (!userId) return;
    const response = await createAddress({ ...newAddress, userId });
    if (response?.data) {
      onChange("shipTo", response.data);
      refetch();
      setShowModal(false);
    }
  };

  return (
    <div className="card payment-method p-3">
      <div className="card-body">
        <h5 className="mb-3 text-lg font-semibold">Invoice</h5>
        <div className="row g-3">
          <div className="col-md-12 position-relative">
            <label className="form-label">Shipping Address</label>
            <Form.Select
              className="form-control"
              value={shipTo?.id || ""}
              onChange={(e) => {
                const selectedAddress = addresses?.find(
                  (addr) => addr.id === e.target.value
                );
                onChange("shipTo", selectedAddress || {});
              }}
            >
              <option value="">Select an Address</option>
              {addresses?.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {`${addr.street}, ${addr.city}, ${addr.state}, ${addr.country}`}
                </option>
              ))}
            </Form.Select>
            <button
              className="btn btn-sm btn-primary mt-2"
              onClick={() => setShowModal(true)}
            >
              + Add New Address
            </button>
          </div>
        </div>
        <div className="row g-3 mt-3">
          <div className="col-md-6">
            <label className="form-label">Bill To</label>
            <input
              type="text"
              className="form-control"
              value={billTo || ""}
              onChange={(e) => onChange("billTo", e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Invoice Date</label>
            <input
              type="date"
              className="form-control"
              value={invoiceDate || ""}
              onChange={(e) => onChange("invoiceDate", e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="form-control"
              value={dueDate || ""}
              onChange={(e) => onChange("dueDate", e.target.value)}
            />
          </div>
        </div>
        <div className="row g-3 mt-3">
          <div className="col-md-12">
            <label className="form-label">Signature Name</label>
            <input
              type="text"
              className="form-control"
              value={signatureName || ""}
              onChange={(e) => onChange("signatureName", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Modal for Creating Address */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Address</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {Object.keys(newAddress).map((field) => (
            <input
              key={field}
              type="text"
              className="form-control mb-2"
              name={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={newAddress[field]} // Ensure the input reflects the state
              onChange={handleChange}
              required
            />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateAddress}>
            Save Address
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InvoiceDetails;
