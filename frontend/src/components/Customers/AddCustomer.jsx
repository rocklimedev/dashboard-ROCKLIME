import React, { useState, useEffect, useCallback } from "react";
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useGetInvoicesByCustomerIdQuery,
} from "../../api/customerApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Tab, Tabs } from "react-bootstrap";
import { useGetVendorsQuery } from "../../api/vendorApi";
const AddCustomer = ({ onClose, existingCustomer }) => {
  const [createCustomer, { isLoading: isCreating, error: createError }] =
    useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isEditing, error: editError }] =
    useUpdateCustomerMutation();

  const {
    data: invoices,
    isLoading: isInvoicesLoading,
    error: invoicesError,
    refetch,
  } = useGetInvoicesByCustomerIdQuery(existingCustomer?.customerId, {
    skip: !existingCustomer?.customerId,
  });

  const {
    data: vendors,
    isLoading: isVendorsLoading,
    error: vendorsError,
  } = useGetVendorsQuery();

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    mobileNumber: "",
    address: { street: "", city: "", state: "", zip: "" },
    isVendor: "false",
    vendorId: "",
    totalAmount: "0.00",
    paidAmount: "0.00",
    balance: "0.00",
    dueDate: "",
    paymentMode: "",
    invoiceStatus: "Draft",
    invoices: [],
    quotations: [],
  });

  // Calculate totalAmount and get dueDate from invoices
  const getInvoiceData = useCallback(() => {
    if (!invoices || !Array.isArray(invoices.data)) {
      console.log("No invoices or invalid data:", invoices);
      return { totalAmount: "0.00", dueDate: "" };
    }

    const total = invoices.data.reduce((sum, invoice) => {
      const payableAmount = parseFloat(invoice.amount || 0);
      return sum + (isNaN(payableAmount) ? 0 : payableAmount);
    }, 0);

    // Use the latest dueDate
    const dueDate =
      invoices.data.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))[0]
        ?.dueDate || "";

    console.log("Invoice Data:", { totalAmount: total.toFixed(2), dueDate });

    return {
      totalAmount: total.toFixed(2),
      dueDate,
    };
  }, [invoices]);

  // Debug invoices and vendors
  useEffect(() => {
    if (existingCustomer && invoices) {
      console.log("Customer ID:", existingCustomer.customerId);
      console.log("Invoices:", invoices);
    }
    if (vendors) {
      console.log("Vendors:", vendors);
    }
  }, [existingCustomer, invoices, vendors]);

  // Initialize form
  useEffect(() => {
    if (existingCustomer) {
      const { totalAmount, dueDate } = getInvoiceData();
      const paid = parseFloat(existingCustomer.paidAmount || "0.00");
      const balance = (parseFloat(totalAmount) - paid).toFixed(2);
      setFormData({
        ...existingCustomer,
        isVendor: existingCustomer.isVendor.toString(),
        address: existingCustomer.address || {
          street: "",
          city: "",
          state: "",
          zip: "",
        },
        totalAmount,
        paidAmount: paid.toFixed(2),
        balance: balance < 0 ? "0.00" : balance,
        dueDate: dueDate || existingCustomer.dueDate || "",
        invoices: existingCustomer.invoices || [],
        quotations: existingCustomer.quotations || [],
        vendorId: existingCustomer.vendorId || "",
      });
    }
  }, [existingCustomer, getInvoiceData]);

  // Recalculate balance
  useEffect(() => {
    if (existingCustomer) {
      const total = parseFloat(formData.totalAmount || "0.00");
      const paid = parseFloat(formData.paidAmount || "0.00");
      const balance = (total - paid).toFixed(2);
      setFormData((prev) => ({
        ...prev,
        balance: balance < 0 ? "0.00" : balance,
      }));
    }
  }, [existingCustomer, formData.totalAmount, formData.paidAmount]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "paidAmount" && existingCustomer) {
      if (value === "" || parseFloat(value) < 0) return;
      const total = parseFloat(formData.totalAmount || "0.00");
      const paid = parseFloat(value || "0.00");
      if (paid > total) {
        toast.error("Paid Amount cannot exceed Total Amount");
        return;
      }
    }

    if (name === "isVendor" && value === "false") {
      // Clear vendorId when isVendor is set to false
      setFormData((prev) => ({
        ...prev,
        isVendor: value,
        vendorId: "",
      }));
    } else if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle JSON field updates (invoices/quotations)
  const handleJsonChange = (field, index, key, value) => {
    setFormData((prev) => {
      const updatedArray = [...prev[field]];
      updatedArray[index] = { ...updatedArray[index], [key]: value };
      return { ...prev, [field]: updatedArray };
    });
  };

  // Add new invoice or quotation
  const addJsonEntry = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [
        ...prev[field],
        field === "invoices"
          ? { invoiceNo: "", amount: "0.00", dueDate: "" }
          : { quotationNo: "", amount: "0.00", date: "" },
      ],
    }));
  };

  // Remove invoice or quotation
  const removeJsonEntry = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        isVendor: formData.isVendor === "true",
        totalAmount: existingCustomer
          ? parseFloat(formData.totalAmount) || 0
          : 0,
        paidAmount: existingCustomer ? parseFloat(formData.paidAmount) || 0 : 0,
        balance: existingCustomer ? parseFloat(formData.balance) || 0 : 0,
        address: formData.address,
        invoices: existingCustomer ? formData.invoices : [],
        quotations: existingCustomer ? formData.quotations : [],
      };

      if (existingCustomer) {
        await updateCustomer({
          id: existingCustomer.customerId,
          ...payload,
        }).unwrap();
        toast.success("Customer updated successfully!");
      } else {
        await createCustomer(payload).unwrap();
        toast.success("Customer added successfully!");
      }
      onClose();
    } catch (err) {
      console.error("Failed to add/update customer:", err);
      toast.error(err?.data?.message || "Failed to process request.");
    }
  };

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">
              {existingCustomer ? "Edit Customer" : "Add Customer"}
            </h4>
            <button type="button" className="close" onClick={onClose}>
              <span>×</span>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {isInvoicesLoading && existingCustomer && (
                <p>Loading invoice data...</p>
              )}
              {invoicesError && existingCustomer && (
                <p className="text-danger">
                  Failed to load invoices:{" "}
                  {invoicesError?.data?.message || "Error"}
                </p>
              )}
              {!isInvoicesLoading &&
                existingCustomer &&
                !invoices?.data?.length && (
                  <p className="text-warning">
                    No invoices found for this customer.
                  </p>
                )}
              {isVendorsLoading && formData.isVendor === "true" && (
                <p>Loading vendors...</p>
              )}
              {vendorsError && formData.isVendor === "true" && (
                <p className="text-danger">
                  Failed to load vendors:{" "}
                  {vendorsError?.data?.message || "Error"}
                </p>
              )}

              <Tabs
                defaultActiveKey="general"
                id="customer-tabs"
                className="mb-3"
              >
                {/* General Tab */}
                <Tab eventKey="general" title="General">
                  <div className="row">
                    <div className="col-lg-6 mb-3">
                      <label className="form-label">
                        Name<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-lg-6 mb-3">
                      <label className="form-label">Company Name</label>
                      <input
                        type="text"
                        name="companyName"
                        className="form-control"
                        value={formData.companyName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-lg-6 mb-3">
                      <label className="form-label">
                        Email<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-lg-6 mb-3">
                      <label className="form-label">
                        Phone<span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobileNumber"
                        className="form-control"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-lg-6 mb-3">
                      <label className="form-label">
                        Is Vendor?<span className="text-danger ms-1">*</span>
                      </label>
                      <select
                        name="isVendor"
                        className="form-control"
                        value={formData.isVendor}
                        onChange={handleChange}
                        required
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    {formData.isVendor === "true" && (
                      <div className="col-lg-6 mb-3">
                        <label className="form-label">Vendor</label>
                        <select
                          name="vendorId"
                          className="form-control"
                          value={formData.vendorId}
                          onChange={handleChange}
                          disabled={isVendorsLoading}
                        >
                          <option value="">Select a vendor</option>
                          {vendors?.data?.map((vendor) => (
                            <option
                              key={vendor.vendorId}
                              value={vendor.vendorId}
                            >
                              {vendor.name ||
                                vendor.vendorName ||
                                vendor.vendorId}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="col-lg-12 mb-3">
                      <label className="form-label">Address</label>
                      <div className="row">
                        <div className="col-lg-6 mb-2">
                          <input
                            type="text"
                            name="address.street"
                            className="form-control"
                            placeholder="Street"
                            value={formData.address.street}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="col-lg-6 mb-2">
                          <input
                            type="text"
                            name="address.city"
                            className="form-control"
                            placeholder="City"
                            value={formData.address.city}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="col-lg-6 mb-2">
                          <input
                            type="text"
                            name="address.state"
                            className="form-control"
                            placeholder="State"
                            value={formData.address.state}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="col-lg-6 mb-2">
                          <input
                            type="text"
                            name="address.zip"
                            className="form-control"
                            placeholder="ZIP Code"
                            value={formData.address.zip}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Tab>

                {/* Financial Tab (Edit mode only) */}
                {existingCustomer && (
                  <Tab eventKey="financial" title="Financial">
                    <div className="row">
                      <div className="col-lg-6 mb-3">
                        <label className="form-label">Total Amount</label>
                        <input
                          type="number"
                          name="totalAmount"
                          className="form-control"
                          value={formData.totalAmount}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                          disabled
                        />
                        <small className="form-text text-muted">
                          Sourced from invoice data
                        </small>
                      </div>
                      <div className="col-lg-6 mb-3">
                        <label className="form-label">Paid Amount</label>
                        <input
                          type="number"
                          name="paidAmount"
                          className="form-control"
                          value={formData.paidAmount}
                          onChange={handleChange}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-lg-6 mb-3">
                        <label className="form-label">Balance</label>
                        <input
                          type="number"
                          name="balance"
                          className="form-control"
                          value={formData.balance}
                          min="0"
                          step="0.01"
                          disabled
                        />
                      </div>
                      <div className="col-lg-6 mb-3">
                        <label className="form-label">Due Date</label>
                        <input
                          type="date"
                          name="dueDate"
                          className="form-control"
                          value={formData.dueDate}
                          onChange={handleChange}
                          disabled={formData.dueDate}
                        />
                        {formData.dueDate && (
                          <small className="form-text text-muted">
                            Sourced from invoice data
                          </small>
                        )}
                      </div>
                      <div className="col-lg-6 mb-3">
                        <label className="form-label">Payment Mode</label>
                        <input
                          type="text"
                          name="paymentMode"
                          className="form-control"
                          value={formData.paymentMode}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-lg-6 mb-3">
                        <label className="form-label">Invoice Status</label>
                        <select
                          name="invoiceStatus"
                          className="form-control"
                          value={formData.invoiceStatus}
                          onChange={handleChange}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          {/* Add other statuses from INVOICE_STATUS */}
                        </select>
                      </div>
                    </div>
                  </Tab>
                )}

                {/* Invoices Tab (Edit mode only) */}
                {existingCustomer && (
                  <Tab eventKey="invoices" title="Invoices">
                    <button
                      type="button"
                      className="btn btn-success mb-2"
                      onClick={() => addJsonEntry("invoices")}
                    >
                      Add Invoice
                    </button>
                    {formData.invoices.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>Invoice No</th>
                              <th>Amount</th>
                              <th>Due Date</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.invoices.map((invoice, index) => (
                              <tr key={index}>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={invoice.invoiceNo || ""}
                                    onChange={(e) =>
                                      handleJsonChange(
                                        "invoices",
                                        index,
                                        "invoiceNo",
                                        e.target.value
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={invoice.amount || ""}
                                    onChange={(e) =>
                                      handleJsonChange(
                                        "invoices",
                                        index,
                                        "amount",
                                        e.target.value
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="date"
                                    className="form-control"
                                    value={invoice.dueDate || ""}
                                    onChange={(e) =>
                                      handleJsonChange(
                                        "invoices",
                                        index,
                                        "dueDate",
                                        e.target.value
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() =>
                                      removeJsonEntry("invoices", index)
                                    }
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>No invoices available.</p>
                    )}
                  </Tab>
                )}

                {/* Quotations Tab (Edit mode only) */}
                {existingCustomer && (
                  <Tab eventKey="quotations" title="Quotations">
                    <button
                      type="button"
                      className="btn btn-success mb-2"
                      onClick={() => addJsonEntry("quotations")}
                    >
                      Add Quotation
                    </button>
                    {formData.quotations.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>Quotation No</th>
                              <th>Amount</th>
                              <th>Date</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.quotations.map((quotation, index) => (
                              <tr key={index}>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={quotation.quotationNo || ""}
                                    onChange={(e) =>
                                      handleJsonChange(
                                        "quotations",
                                        index,
                                        "quotationNo",
                                        e.target.value
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control"
                                    value={quotation.amount || ""}
                                    onChange={(e) =>
                                      handleJsonChange(
                                        "quotations",
                                        index,
                                        "amount",
                                        e.target.value
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="date"
                                    className="form-control"
                                    value={quotation.date || ""}
                                    onChange={(e) =>
                                      handleJsonChange(
                                        "quotations",
                                        index,
                                        "date",
                                        e.target.value
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() =>
                                      removeJsonEntry("quotations", index)
                                    }
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>No quotations available.</p>
                    )}
                  </Tab>
                )}
              </Tabs>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              {existingCustomer && (
                <button
                  type="button"
                  className="btn btn-info"
                  onClick={() => refetch()}
                  disabled={isInvoicesLoading}
                >
                  Refresh Invoices
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  isCreating ||
                  isEditing ||
                  isInvoicesLoading ||
                  isVendorsLoading
                }
              >
                {isCreating || isEditing
                  ? "Processing..."
                  : existingCustomer
                  ? "Update Customer"
                  : "Add Customer"}
              </button>
            </div>
            {(createError || editError) && (
              <p className="text-danger mt-2">
                {createError?.data?.message ||
                  editError?.data?.message ||
                  "Error processing request"}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCustomer;
