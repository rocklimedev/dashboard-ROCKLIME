import React, { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useGetInvoicesByCustomerIdQuery,
  customerApi as api,
} from "../../api/customerApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetVendorsQuery } from "../../api/vendorApi";
import { toast } from "sonner";
import { Tab, Tabs } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import PageHeader from "../Common/PageHeader";

const AddCustomer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const existingCustomer = location.state?.customer || null;

  const [createCustomer, { isLoading: isCreating, error: createError }] =
    useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isEditing, error: editError }] =
    useUpdateCustomerMutation();
  const { data: allCustomersData, isLoading: isCustomersLoading } =
    useGetCustomersQuery();
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
    customerType: "",
    email: "",
    mobileNumber: "",
    phone2: "",
    address: { street: "", city: "", state: "", zip: "" },
    isVendor: "false",
    totalAmount: "0.00",
    paidAmount: "0.00",
    balance: "0.00",
    dueDate: "",
    paymentMode: "",
    invoiceStatus: "Draft",
    invoices: [],
    quotations: [],
    vendorId: "",
    gstNumber: "", // NEW
  });

  const getInvoiceData = useCallback(() => {
    if (!invoices?.data?.length) return { totalAmount: 0, dueDate: null };

    const total = invoices.data.reduce((sum, invoice) => {
      const payableAmount = parseFloat(invoice.amount || 0);
      return sum + (isNaN(payableAmount) ? 0 : payableAmount);
    }, 0);

    const dueDate =
      invoices.data.sort(
        (a, b) => new Date(b.dueDate) - new Date(a.dueDate)
      )?.[0]?.dueDate || null;

    return { totalAmount: total, dueDate };
  }, [invoices]);

  useEffect(() => {
    if (!existingCustomer && allCustomersData?.data?.length > 0) {
      const isDuplicate = allCustomersData.data.some(
        (cust) =>
          cust.email === formData.email.trim() ||
          cust.mobileNumber === formData.mobileNumber.trim()
      );

      if (isDuplicate) {
        toast.error(
          "Customer with same email or mobile number already exists."
        );
      }
    }
  }, [
    existingCustomer,
    allCustomersData,
    formData.email,
    formData.mobileNumber,
  ]);

  useEffect(() => {
    if (existingCustomer && invoices) {
      const { totalAmount, dueDate } = getInvoiceData();
      const paid = parseFloat(existingCustomer.paidAmount || 0);
      const balance = totalAmount - paid;

      setFormData({
        ...existingCustomer,
        customerType: existingCustomer.customerType || "",
        phone2: existingCustomer.phone2 || "",
        gstNumber: existingCustomer.gstNumber || "", // NEW
        address: existingCustomer.address || {
          street: "",
          city: "",
          state: "",
          zip: "",
        },
        totalAmount: totalAmount.toFixed(2),
        paidAmount: paid.toFixed(2),
        balance: balance < 0 ? "0.00" : balance.toFixed(2),
        dueDate: dueDate || existingCustomer.dueDate || null,
        invoices: existingCustomer.invoices || [],
        quotations: existingCustomer.quotations || [],
        vendorId: existingCustomer.vendorId || "",
      });
    }
  }, [existingCustomer, invoices, getInvoiceData]);

  useEffect(() => {
    if (existingCustomer) {
      const total = parseFloat(formData.totalAmount || 0);
      const paid = parseFloat(formData.paidAmount || 0);
      const balance = total - paid;

      setFormData((prev) => ({
        ...prev,
        balance: balance < 0 ? "0.00" : balance.toFixed(2),
      }));
    }
  }, [existingCustomer, formData.totalAmount, formData.paidAmount]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "paidAmount" && existingCustomer) {
      if (value === "" || parseFloat(value) < 0) return;

      const total = parseFloat(formData.totalAmount || 0);
      const paid = parseFloat(value || 0);
      if (paid > total) {
        toast.error("Paid Amount cannot exceed Total Amount");
        return;
      }
    }

    if (name === "isVendor" && value === "false") {
      setFormData((prev) => ({ ...prev, isVendor: value, vendorId: "" }));
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

  const handleJsonChange = (field, index, key, value) => {
    setFormData((prev) => {
      const updatedArray = [...prev[field]];
      updatedArray[index] = { ...updatedArray[index], [key]: value };
      return { ...prev, [field]: updatedArray };
    });
  };

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

  const removeJsonEntry = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!existingCustomer && allCustomersData?.data?.length > 0) {
        const isDuplicate = allCustomersData.data.some(
          (cust) =>
            cust.email === formData.email.trim() ||
            cust.mobileNumber === formData.mobileNumber.trim()
        );

        if (isDuplicate) {
          toast.error(
            "Customer with same email or mobile number already exists."
          );
          return;
        }
      }

      const payload = {
        ...formData,
        customerType: formData.customerType || null,
        phone2: formData.phone2 || null,
        gstNumber: formData.gstNumber || null, // NEW
        isVendor: formData.isVendor === "true",
        totalAmount: existingCustomer
          ? parseFloat(formData.totalAmount) || 0
          : 0,
        paidAmount: existingCustomer ? parseFloat(formData.paidAmount) || 0 : 0,
        balance: existingCustomer ? parseFloat(formData.balance) || 0 : 0,
        address:
          formData.address.street ||
          formData.address.city ||
          formData.address.state ||
          formData.address.zip
            ? formData.address
            : null,
        invoices: null,
        quotations: null,
        dueDate: formData.dueDate || null,
        vendorId:
          formData.isVendor === "true" && formData.vendorId?.trim()
            ? formData.vendorId
            : null,
      };

      if (existingCustomer) {
        await updateCustomer({
          id: existingCustomer.customerId,
          ...payload,
        }).unwrap();
        dispatch(
          api.util.invalidateTags([
            { type: "Customer", id: existingCustomer.customerId },
          ])
        );
      } else {
        await createCustomer(payload).unwrap();
        dispatch(api.util.invalidateTags(["Customer"]));
      }

      navigate("/customers/list");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to process request.");
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title={existingCustomer ? "Edit Customer" : "Add Customer"}
            subtitle={
              existingCustomer
                ? "Update customer details"
                : "Create a new customer"
            }
            exportOptions={{ pdf: false, excel: false }}
            buttonText="Back to Customers"
          />
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {isInvoicesLoading && existingCustomer && (
                <p>Loading invoice data...</p>
              )}
              {invoicesError && existingCustomer && (
                <p className="text-danger">
                  Failed to load invoices:{" "}
                  {invoicesError?.data?.message || "Error"}
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
                      <label className="form-label">Customer Type</label>
                      <select
                        name="customerType"
                        className="form-select"
                        value={formData.customerType}
                        onChange={handleChange}
                      >
                        <option value="">Select Type</option>
                        <option value="Retail">Retail</option>
                        <option value="Architect">Architect</option>
                        <option value="Interior">Interior</option>
                        <option value="Builder">Builder</option>
                        <option value="Contractor">Contractor</option>
                      </select>
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
                      <label className="form-label">Email</label>
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
                      <label className="form-label">Phone 2</label>
                      <input
                        type="tel"
                        name="phone2"
                        className="form-control"
                        value={formData.phone2}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-lg-6 mb-3">
                      <label className="form-label">GST Number</label>
                      <input
                        type="text"
                        name="gstNumber"
                        className="form-control"
                        value={formData.gstNumber}
                        onChange={handleChange}
                        placeholder="Enter GST Number"
                      />
                    </div>

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
              </Tabs>
              <div className="d-flex justify-content-end mt-4">
                <button
                  type="button"
                  className="btn btn-secondary me-2"
                  onClick={() => navigate("/customers/list")}
                >
                  Cancel
                </button>
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
                <p className="text-danger mt-3">
                  {createError?.data?.message ||
                    editError?.data?.message ||
                    "Error processing request"}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCustomer;
