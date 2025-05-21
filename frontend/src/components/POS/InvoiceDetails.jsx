import React, { useEffect, useState } from "react";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetProfileQuery } from "../../api/userApi";
import { Form } from "react-bootstrap";
import { toast } from "sonner";
import AddAddress from "../Address/AddAddressModal";

const InvoiceDetails = ({ invoiceData, onChange, error }) => {
  const { shipTo, invoiceDate, dueDate, signatureName, billTo } = invoiceData;
  const { data: userProfile } = useGetProfileQuery();
  const userId = userProfile?.user?.userId;
  const { data: addressesData, refetch } = useGetAllAddressesQuery(userId, {
    skip: !userId,
  });

  const [showModal, setShowModal] = useState(false);

  const addresses = Array.isArray(addressesData) ? addressesData : [];

  useEffect(() => {
    if (userId) {
      refetch();
    }
  }, [userId, refetch]);

  useEffect(() => {
    // Debug: Log addresses and shipTo to verify data
    console.log("Addresses:", addresses);
    console.log("Current shipTo:", shipTo);
  }, [addresses, shipTo]);

  const handleAddressCreated = (newAddress) => {
    onChange("shipTo", newAddress.addressId);
    refetch();
    setShowModal(false);
    toast.success("Address added successfully!");
  };

  return (
    <div className="card payment-method p-3">
      <div className="card-body">
        <h5 className="mb-3 text-lg font-semibold">Invoice</h5>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <div className="row g-3">
          <div className="col-md-12 position-relative">
            <label className="form-label">Shipping Address (Optional)</label>
            <Form.Select
              className="form-control"
              value={shipTo || ""}
              onChange={(e) => onChange("shipTo", e.target.value || null)}
            >
              <option value="">Select an Address</option>
              {addresses.map((addr) => (
                <option key={addr.addressId} value={addr.addressId}>
                  {`${addr?.street || "Unknown"}, ${addr?.city || "Unknown"}, ${
                    addr?.state || "Unknown"
                  }, ${addr?.country || "Unknown"}`}
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
              placeholder="Enter billing name or address"
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

      {showModal && (
        <AddAddress
          onClose={() => setShowModal(false)}
          existingAddress={null}
          onAddressCreated={handleAddressCreated}
        />
      )}
    </div>
  );
};

export default InvoiceDetails;
