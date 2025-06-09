import React, { useEffect, useState, useMemo } from "react";
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

  const addresses = useMemo(
    () =>
      Array.isArray(addressesData?.data)
        ? addressesData.data
        : Array.isArray(addressesData)
        ? addressesData
        : [],
    [addressesData]
  );

  useEffect(() => {
    if (userId) {
      refetch();
    }
  }, [userId, refetch]);

  useEffect(() => {
    console.log("Addresses:", addresses);
    console.log("Current shipTo:", shipTo);
  }, [addresses, shipTo]);

  const handleAddressCreated = (newAddress) => {
    if (newAddress?.addressId) {
      onChange("shipTo", newAddress.addressId);
      refetch();
      setShowModal(false);
      toast.success("Address added successfully!");
    } else {
      console.error("Invalid new address:", newAddress);
      toast.error("Failed to add address. Please try again.");
    }
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
              onChange={(e) => {
                const value = e.target.value || null;
                onChange("shipTo", value);
              }}
            >
              <option value="">Select an Address</option>
              {addresses.length === 0 ? (
                <option disabled>No addresses available</option>
              ) : (
                addresses.map((addr) => (
                  <option key={addr.addressId} value={addr.addressId}>
                    {`${
                      addr?.addressDetails?.street || addr?.street || "Unknown"
                    }, 
                      ${addr?.addressDetails?.city || addr?.city || "Unknown"}, 
                      ${
                        addr?.addressDetails?.state || addr?.state || "Unknown"
                      }, 
                      ${
                        addr?.addressDetails?.country ||
                        addr?.country ||
                        "Unknown"
                      }`}
                  </option>
                ))
              )}
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
