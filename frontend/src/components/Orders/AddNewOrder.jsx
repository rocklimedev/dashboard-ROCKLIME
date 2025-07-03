import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCreateOrderMutation,
  useUpdateOrderByIdMutation,
} from "../../api/orderApi";
import {
  useGetAllInvoicesQuery,
  useGetInvoiceByIdQuery,
} from "../../api/invoiceApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import AddNewTeam from "./AddNewTeam";
import { toast } from "sonner";

const AddNewOrder = ({ adminName, order }) => {
  const isEditMode = Boolean(order);
  const navigate = useNavigate();

  const [createOrder] = useCreateOrderMutation();
  const [updateOrder] = useUpdateOrderByIdMutation();
  const { data: invoicesData, isLoading, error } = useGetAllInvoicesQuery();
  const invoices = Array.isArray(invoicesData?.data) ? invoicesData.data : [];
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const { data: selectedInvoiceData } = useGetInvoiceByIdQuery(
    selectedInvoiceId,
    { skip: !selectedInvoiceId }
  );
  const selectedInvoice = selectedInvoiceData?.data;
  const { data: teamsData, refetch } = useGetAllTeamsQuery();
  const teams = Array.isArray(teamsData?.teams) ? teamsData.teams : [];

  const [formData, setFormData] = useState({
    title: "",
    createdFor: "",
    createdBy: "",
    assignedTo: "",
    pipeline: "",
    status: "CREATED",
    dueDate: "",
    followupDates: [],
    source: "",

    teamId: "",
    priority: "",
    description: "",
    invoiceId: "",
  });

  useEffect(() => {
    if (isEditMode && order) {
      setFormData({ ...order });
      setSelectedInvoiceId(order.invoiceId || "");
    }
  }, [isEditMode, order]);

  useEffect(() => {
    if (selectedInvoice) {
      const numericOrderNo =
        selectedInvoice.invoiceNo?.replace(/\D/g, "") || "";
      setFormData((prev) => ({
        ...prev,
        invoiceId: selectedInvoiceId,
        dueDate: selectedInvoice.dueDate || "",
        createdBy: selectedInvoice.createdBy || "",
        createdFor: selectedInvoice.customerId || "",
      }));
    }
  }, [selectedInvoice, selectedInvoiceId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "teamId") {
      setFormData((prev) => ({
        ...prev,
        teamId: value,
        assignedTo: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleInvoiceSelect = (e) => {
    setSelectedInvoiceId(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.pipeline || !formData.dueDate) {
      toast.error("Please fill all required fields.");
      return;
    }
    try {
      let response;
      if (isEditMode) {
        response = await updateOrder({
          id: order._id,
          updatedData: formData,
        }).unwrap();
        toast.success("Order updated successfully!");
      } else {
        response = await createOrder(formData).unwrap();
        toast.success("Order created successfully!");
      }
      navigate("/orders/list");
    } catch (err) {
      if (err?.status === 400) {
        toast.error(
          `Bad Request: ${err.data?.message || "Invalid data provided."}`
        );
      } else if (err?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  const handleCancel = () => {
    navigate("/orders/list");
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              {isEditMode ? "Edit Order" : "Add New Order"}
            </h4>
          </div>
          <div className="card-body p-4">
            {isLoading && <p className="text-muted">Loading invoices...</p>}
            {error && (
              <p className="text-danger">
                Error loading invoices: {error.data?.message || "Unknown error"}
              </p>
            )}
            <form onSubmit={handleSubmit}>
              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Invoice <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="invoiceId"
                    value={formData.invoiceId}
                    onChange={handleInvoiceSelect}
                    disabled={isEditMode || isLoading}
                    required
                  >
                    <option value="">Select Invoice</option>
                    {invoices.length > 0 ? (
                      invoices.map((invoice) => (
                        <option
                          key={invoice.invoiceId}
                          value={invoice.invoiceId}
                        >
                          {invoice.billTo} - {invoice.amount} (
                          {invoice.invoiceDate})
                        </option>
                      ))
                    ) : (
                      <option disabled>No Invoices Available</option>
                    )}
                  </select>
                </div>
              </div>

              {selectedInvoice && (
                <div className="border p-3 mb-4 rounded bg-light">
                  <h5 className="fw-bold">Invoice Details</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <p>
                        <strong>Bill To:</strong> {selectedInvoice.billTo}
                      </p>
                      <p>
                        <strong>Amount:</strong> {selectedInvoice.amount}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p>
                        <strong>Date:</strong> {selectedInvoice.invoiceDate}
                      </p>
                      <p>
                        <strong>Invoice No:</strong> {selectedInvoice.invoiceNo}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Source <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    required
                    placeholder="Enter source"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Due Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Customer</label>
                  <input
                    type="text"
                    className="form-control"
                    name="createdFor"
                    value={formData.createdFor}
                    readOnly
                    placeholder="Auto-filled from invoice"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Created By</label>
                  <input
                    type="text"
                    className="form-control"
                    name="createdBy"
                    value={formData.createdBy}
                    readOnly
                    placeholder="Auto-filled from invoice"
                  />
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Order Title <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter order title"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Pipeline <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="pipeline"
                    value={formData.pipeline}
                    onChange={handleChange}
                    required
                    placeholder="Enter pipeline"
                  />
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Status <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="CREATED">Created</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="CHECKING">Checking</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="DISPATCHED">Dispatched</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="PARTIALLY_DELIVERED">
                      Partially Delivered
                    </option>
                    <option value="CANCELED">Canceled</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ONHOLD">On Hold</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Priority <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">
                    Assigned To <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex align-items-center">
                    <select
                      className="form-select"
                      name="teamId"
                      value={formData.teamId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Team</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.teamName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline-primary ms-2"
                      onClick={() => setShowNewTeamModal(true)}
                    >
                      + New Team
                    </button>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-bold">Follow-up Dates</label>
                  {formData.followupDates.map((date, index) => (
                    <div key={index} className="d-flex align-items-center mb-2">
                      <input
                        type="date"
                        className="form-control"
                        value={date}
                        onChange={(e) => {
                          const updatedDates = [...formData.followupDates];
                          updatedDates[index] = e.target.value;
                          setFormData({
                            ...formData,
                            followupDates: updatedDates,
                          });
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-danger ms-2"
                        onClick={() => {
                          const updatedDates = formData.followupDates.filter(
                            (_, i) => i !== index
                          );
                          setFormData({
                            ...formData,
                            followupDates: updatedDates,
                          });
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline-primary mt-2"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        followupDates: [...formData.followupDates, ""],
                      })
                    }
                  >
                    + Add Follow-up Date
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">
                  Description <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  maxLength="60"
                  rows="4"
                  required
                  placeholder="Enter description (max 60 characters)"
                />
                <small className="text-muted">Maximum 60 Characters</small>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-4"
                  disabled={isLoading}
                >
                  {isLoading
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                    ? "Update Order"
                    : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
        {showNewTeamModal && (
          <AddNewTeam
            adminName={adminName}
            onClose={() => setShowNewTeamModal(false)}
            onTeamAdded={refetch}
          />
        )}
      </div>
    </div>
  );
};

export default AddNewOrder;
