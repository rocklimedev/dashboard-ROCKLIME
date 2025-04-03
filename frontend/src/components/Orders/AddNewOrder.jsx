import React, { useState, useEffect } from "react";
import { useCreateOrderMutation } from "../../api/orderApi";
import {
  useGetAllInvoicesQuery,
  useGetInvoiceByIdQuery,
} from "../../api/invoiceApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import AddNewTeam from "./AddNewTeam";
const AddNewOrder = ({ onClose, adminName }) => {
  const [createOrder, { isLoading, error }] = useCreateOrderMutation();
  const { data: invoicesData } = useGetAllInvoicesQuery();
  const invoices = invoicesData?.data || [];
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const { data: selectedInvoiceData } = useGetInvoiceByIdQuery(
    selectedInvoiceId,
    {
      skip: !selectedInvoiceId, // Skip query if no invoice is selected
    }
  );
  const selectedInvoice = selectedInvoiceData?.data;
  const { data: teamsData, refetch } = useGetAllTeamsQuery();
  const teams = teamsData?.data || [];
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
    priority: "",
    description: "",
    invoiceId: "",
    orderNo: "",
  });

  useEffect(() => {
    if (selectedInvoice) {
      setFormData((prev) => ({
        ...prev,
        invoiceId: selectedInvoiceId,
        createdBy: selectedInvoice.createdBy || "",
        createdFor: selectedInvoice.customerId || "",
        orderNo: selectedInvoice.orderId || "",
      }));
    }
  }, [selectedInvoice, selectedInvoiceId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInvoiceSelect = (e) => {
    setSelectedInvoiceId(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createOrder(formData);
      onClose();
    } catch (err) {
      console.error("Error creating order", err);
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
                <label className="form-label">Invoice</label>
                <select
                  className="form-select"
                  name="invoiceId"
                  value={formData.invoiceId}
                  onChange={handleInvoiceSelect}
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
                <label className="form-label">Assigned To</label>{" "}
                <button
                  type="button"
                  className="btn btn-primary ms-2"
                  onClick={() => setShowNewTeamModal(true)}
                >
                  + New Team
                </button>
                <select
                  className="form-select"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Team Member</option>
                  {teams.length > 0 ? (
                    teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No Team Members Available</option>
                  )}
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
                  {isLoading ? "Submitting..." : "Submit"}
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
