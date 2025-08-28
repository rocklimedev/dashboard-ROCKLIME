import React, { useEffect, useState, useMemo } from "react";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetProfileQuery } from "../../api/userApi";
import { Form, Button } from "react-bootstrap"; // Added Button for consistency
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
    console.log("Current dueDate:", dueDate); // Debug dueDate
  }, [addresses, shipTo, dueDate]);

  const handleAddressCreated = (newAddress) => {
    if (newAddress?.addressId) {
      onChange("shipTo", newAddress.addressId);
      refetch();
      setShowModal(false);
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
        <Form>
          <div className="row g-3">
            <div className="col-md-12 position-relative">
              <Form.Label>Shipping Address (Optional)</Form.Label>
              <Form.Select
                className="form-control"
                value={shipTo || ""}
                onChange={(e) => {
                  const value = e.target.value || null;
                  console.log("Selected shipTo:", value); // Debug
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
                        addr?.addressDetails?.street ||
                        addr?.street ||
                        "Unknown"
                      }, 
                        ${
                          addr?.addressDetails?.city || addr?.city || "Unknown"
                        }, 
                        ${
                          addr?.addressDetails?.state ||
                          addr?.state ||
                          "Unknown"
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
              <Button
                variant="primary"
                size="sm"
                className="mt-2"
                onClick={() => setShowModal(true)}
              >
                + Add New Address
              </Button>
            </div>
          </div>
          <div className="row g-3 mt-3">
            <div className="col-md-6">
              <Form.Label>Bill To *</Form.Label>
              <Form.Control
                type="text"
                value={billTo || ""}
                onChange={(e) => {
                  console.log("Bill To:", e.target.value); // Debug
                  onChange("billTo", e.target.value);
                }}
                placeholder="Enter billing name or address"
                required
              />
            </div>
            <div className="col-md-6">
              <Form.Label>Invoice Date *</Form.Label>
              <Form.Control
                type="date"
                value={invoiceDate || ""}
                onChange={(e) => {
                  console.log("Invoice Date:", e.target.value); // Debug
                  onChange("invoiceDate", e.target.value);
                }}
                required
              />
            </div>
            <div className="col-md-6">
              <Form.Label>Due Date *</Form.Label>
              <Form.Control
                type="date"
                value={dueDate || ""}
                onChange={(e) => {
                  console.log("Due Date:", e.target.value); // Debug
                  onChange("dueDate", e.target.value);
                }}
                required
                isInvalid={!!error && error.includes("Due date")} // Highlight if error
              />
              <Form.Control.Feedback type="invalid">
                {error && error.includes("Due date") ? error : ""}
              </Form.Control.Feedback>
            </div>
          </div>
          <div className="row g-3 mt-3">
            <div className="col-md-12">
              <Form.Label>Signature Name</Form.Label>
              <Form.Control
                type="text"
                value={signatureName || ""}
                onChange={(e) => {
                  console.log("Signature Name:", e.target.value); // Debug
                  onChange("signatureName", e.target.value);
                }}
                placeholder="Enter signature name"
              />
            </div>
          </div>
        </Form>
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
