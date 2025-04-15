import React, { useState, useEffect } from "react";
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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddNewOrder = ({ onClose, adminName, orderToEdit }) => {
  const isEditMode = Boolean(orderToEdit);

  const [createOrder] = useCreateOrderMutation();
  const [updateOrder] = useUpdateOrderByIdMutation();

  const { data: invoicesData, isLoading, error } = useGetAllInvoicesQuery();
  const invoices = invoicesData?.data || [];

  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

  const { data: selectedInvoiceData } = useGetInvoiceByIdQuery(
    selectedInvoiceId,
    { skip: !selectedInvoiceId }
  );
  const selectedInvoice = selectedInvoiceData?.data;

  const { data: teamsData, refetch } = useGetAllTeamsQuery();
  const teams = teamsData?.teams || [];

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
    orderNo: "",
    teamId: "",
    priority: "",
    description: "",
    invoiceId: "",
  });

  useEffect(() => {
    if (isEditMode && orderToEdit) {
      setFormData({ ...orderToEdit });
      setSelectedInvoiceId(orderToEdit.invoiceId);
    }
  }, [isEditMode, orderToEdit]);

  useEffect(() => {
    if (selectedInvoice) {
      // Extract only numeric part from invoiceNo
      const numericOrderNo = selectedInvoice.invoiceNo?.replace(/\D/g, "");

      setFormData((prev) => ({
        ...prev,
        invoiceId: selectedInvoiceId,
        dueDate: selectedInvoice.dueDate || "",
        createdBy: selectedInvoice.createdBy || "",
        createdFor: selectedInvoice.customerId || "",
        orderNo: numericOrderNo || "", // set only numeric orderNo
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
          id: orderToEdit._id,
          updatedData: formData,
        }).unwrap();
        toast.success("Order updated successfully!");
      } else {
        response = await createOrder(formData).unwrap();
        toast.success("Order created successfully!");
      }
      console.log("Order response:", response);
      onClose();
    } catch (err) {
      console.error("Error submitting order:", err);
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

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h4>Add New Order</h4>
            <button type="button" className="close" onClick={onClose}>
              &times;
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Order Title</label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Pipeline</label>
                <input
                  type="text"
                  className="form-control"
                  name="pipeline"
                  value={formData.pipeline}
                  onChange={handleChange}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Source</label>
                <input
                  type="text"
                  className="form-control"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Follow-up Dates</label>
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
                      className="btn btn-danger ms-2"
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
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-primary mt-2"
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

              <div className="mb-3">
                <label className="form-label">Invoice</label>
                <select
                  className="form-select"
                  name="invoiceId"
                  value={formData.invoiceId}
                  onChange={handleInvoiceSelect}
                  disabled={isEditMode} // disable in edit mode
                  required
                >
                  <option value="">Select Invoice</option>
                  {invoices.length > 0 ? (
                    invoices.map((invoice) => (
                      <option key={invoice.invoiceId} value={invoice.invoiceId}>
                        {invoice.billTo} - {invoice.amount} (
                        {invoice.invoiceDate})
                      </option>
                    ))
                  ) : (
                    <option disabled>No Invoices Available</option>
                  )}
                </select>
              </div>

              {/* Render selected invoice details */}
              {selectedInvoice && (
                <div className="border p-3 mb-3">
                  <h5>Invoice Details</h5>
                  <p>
                    <strong>Bill To:</strong> {selectedInvoice.billTo}
                  </p>
                  <p>
                    <strong>Amount:</strong> {selectedInvoice.amount}
                  </p>
                  <p>
                    <strong>Date:</strong> {selectedInvoice.invoiceDate}
                  </p>
                  <p>
                    <strong>INVOCIE NO:</strong> {selectedInvoice.invoiceNo}
                  </p>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Order No</label>
                <input
                  type="text"
                  className="form-control"
                  name="orderNo"
                  value={formData.orderNo}
                  readOnly
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Customer</label>
                <input
                  type="text"
                  className="form-control"
                  name="createdFor"
                  value={formData.createdFor}
                  readOnly
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Created By</label>
                <input
                  type="text"
                  className="form-control"
                  name="createdBy"
                  value={formData.createdBy}
                  readOnly
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Status</label>
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
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Priority</label>
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
              <div className="mb-3">
                <label className="form-label">Assigned To</label>
                <button
                  type="button"
                  className="btn btn-primary ms-2"
                  onClick={() => setShowNewTeamModal(true)}
                >
                  + New Team
                </button>
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
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  maxLength="60"
                  required
                />
                <small>Maximum 60 Characters</small>
              </div>

              {error && <p className="text-danger">Error creating order</p>}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
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
      </div>
      {/* New Team Modal */}
      {showNewTeamModal && (
        <AddNewTeam
          adminName={adminName}
          onClose={() => setShowNewTeamModal(false)}
          onTeamAdded={refetch}
        />
      )}
    </div>
  );
};

export default AddNewOrder;
