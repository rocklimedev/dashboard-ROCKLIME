import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Form,
  Spinner,
  Alert,
  Button as BootstrapButton,
} from "react-bootstrap";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Select, DatePicker, Button } from "antd";
import { toast } from "sonner";
import { debounce } from "lodash";
import PageHeader from "../Common/PageHeader";
import {
  useCreateOrderMutation,
  useUpdateOrderByIdMutation,
  useOrderByIdQuery,
} from "../../api/orderApi";
import {
  useGetAllInvoicesQuery,
  useGetInvoiceByIdQuery,
} from "../../api/invoiceApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import AddNewTeam from "./AddNewTeam";
import moment from "moment";
const { Option } = Select;

const AddNewOrder = ({ adminName }) => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  // Queries
  const {
    data: orderData,
    isLoading: isOrderLoading,
    error: orderError,
  } = useOrderByIdQuery(id, { skip: !isEditMode });
  const {
    data: invoicesData,
    isLoading: isInvoicesLoading,
    error: invoicesError,
  } = useGetAllInvoicesQuery();
  const [createOrder] = useCreateOrderMutation();
  const [updateOrder] = useUpdateOrderByIdMutation();
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
  const {
    data: teamsData,
    isLoading: isTeamsLoading,
    refetch: refetchTeams,
  } = useGetAllTeamsQuery();
  const { data: selectedInvoiceData, isLoading: isSelectedInvoiceLoading } =
    useGetInvoiceByIdQuery(formData.invoiceId, { skip: !formData.invoiceId });

  // Data assignments
  const order = orderData?.order;
  const invoices = Array.isArray(invoicesData?.data) ? invoicesData.data : [];
  const teams = Array.isArray(teamsData?.teams) ? teamsData.teams : [];
  const selectedInvoice = selectedInvoiceData?.data;

  // State

  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [filteredInvoices, setFilteredInvoices] = useState([]);

  // Populate formData in edit mode
  useEffect(() => {
    if (isEditMode && order) {
      setFormData({
        ...formData,
        ...order,
        followupDates: order.followupDates || [],
        invoiceId: order.invoiceId || "",
      });
    }
  }, [isEditMode, order]);

  // Update formData with invoice details
  useEffect(() => {
    if (selectedInvoice) {
      setFormData((prev) => ({
        ...prev,
        invoiceId: prev.invoiceId,
        dueDate: selectedInvoice.dueDate || prev.dueDate,
        createdBy: selectedInvoice.createdBy || prev.createdBy,
        createdFor: selectedInvoice.customerId || prev.createdFor,
      }));
    }
  }, [selectedInvoice]);

  // Debounced invoice search
  const debouncedInvoiceSearch = useCallback(
    debounce((value) => {
      setInvoiceSearch(value);
      if (value) {
        const filtered = invoices.filter(
          (invoice) =>
            invoice.billTo?.toLowerCase().includes(value.toLowerCase()) ||
            invoice.invoiceNo?.toLowerCase().includes(value.toLowerCase()) ||
            invoice.invoiceDate?.includes(value)
        );
        setFilteredInvoices(filtered);
      } else {
        setFilteredInvoices(invoices);
      }
    }, 300),
    [invoices]
  );

  useEffect(() => {
    setFilteredInvoices(invoices);
  }, [invoices]);

  // Handlers
  const handleChange = (name, value) => {
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

  const handleInvoiceSelect = (value) => {
    setFormData((prev) => ({ ...prev, invoiceId: value }));
  };

  const handleFollowupDateChange = (index, date) => {
    const updatedDates = [...formData.followupDates];
    updatedDates[index] = date ? date.format("YYYY-MM-DD") : "";
    setFormData({ ...formData, followupDates: updatedDates });
  };

  const addFollowupDate = () => {
    setFormData({
      ...formData,
      followupDates: [...formData.followupDates, ""],
    });
  };

  const removeFollowupDate = (index) => {
    setFormData({
      ...formData,
      followupDates: formData.followupDates.filter((_, i) => i !== index),
    });
  };

  const clearForm = () => {
    setFormData({
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
    setInvoiceSearch("");
    setFilteredInvoices(invoices);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.pipeline ||
      !formData.dueDate ||
      !formData.invoiceId
    ) {
      toast.error("Please fill all required fields.");
      return;
    }
    try {
      if (isEditMode) {
        await updateOrder({ id, updatedData: formData }).unwrap();
      } else {
        await createOrder(formData).unwrap();
      }
      navigate("/orders/list");
    } catch (err) {
      const errorMessage =
        err?.status === 400
          ? `Bad Request: ${err.data?.message || "Invalid data provided."}`
          : err?.status === 500
          ? "Server error. Please try again later."
          : "Something went wrong. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Loading state
  if (isOrderLoading || isInvoicesLoading || isTeamsLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center">
            <Spinner
              animation="border"
              variant="primary"
              role="status"
              aria-label="Loading data"
            />
            <p>Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (orderError || invoicesError) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <Alert variant="danger" role="alert">
              Error loading data:{" "}
              {orderError?.data?.message ||
                invoicesError?.data?.message ||
                "Unknown error"}
              . Please try again.
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title={isEditMode ? "Edit Order" : "Add New Order"}
            subtitle="Fill out the order details"
            exportOptions={{ pdf: false, excel: false }}
          />
          <div className="card-body">
            <div className="d-flex justify-content-end mb-3">
              <Link to="/orders/list" className="btn btn-secondary me-2">
                <FaArrowLeft className="me-2" /> Back to Orders
              </Link>
              <BootstrapButton variant="outline-secondary" onClick={clearForm}>
                Clear Form
              </BootstrapButton>
            </div>
            <Form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Invoice <span className="text-danger">*</span>
                    </Form.Label>
                    <div className="input-icon-start position-relative">
                      <span className="input-icon-addon">
                        <FaSearch />
                      </span>
                      <Select
                        showSearch
                        style={{ width: "100%" }}
                        placeholder="Search invoices"
                        value={formData.invoiceId || undefined}
                        onChange={handleInvoiceSelect}
                        onSearch={debouncedInvoiceSearch}
                        filterOption={false}
                        disabled={
                          isEditMode ||
                          isInvoicesLoading ||
                          isSelectedInvoiceLoading
                        }
                      >
                        {filteredInvoices.length > 0 ? (
                          filteredInvoices.map((invoice) => (
                            <Option
                              key={invoice.invoiceId}
                              value={invoice.invoiceId}
                            >
                              {invoice.billTo} - {invoice.amount} (
                              {invoice.invoiceDate})
                            </Option>
                          ))
                        ) : (
                          <Option value="" disabled>
                            No invoices available
                          </Option>
                        )}
                      </Select>
                    </div>
                  </Form.Group>
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

              <div className="row">
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Order Title <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={(e) =>
                        handleChange(e.target.name, e.target.value)
                      }
                      required
                      placeholder="Enter order title"
                    />
                  </Form.Group>
                </div>
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Pipeline <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="pipeline"
                      value={formData.pipeline}
                      onChange={(e) =>
                        handleChange(e.target.name, e.target.value)
                      }
                      required
                      placeholder="Enter pipeline"
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Customer</Form.Label>
                    <Form.Control
                      type="text"
                      name="createdFor"
                      value={formData.createdFor}
                      readOnly
                      placeholder="Auto-filled from invoice"
                    />
                  </Form.Group>
                </div>
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Created By</Form.Label>
                    <Form.Control
                      type="text"
                      name="createdBy"
                      value={formData.createdBy}
                      readOnly
                      placeholder="Auto-filled from invoice"
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Status <span className="text-danger">*</span>
                    </Form.Label>
                    <Select
                      style={{ width: "100%" }}
                      value={formData.status}
                      onChange={(value) => handleChange("status", value)}
                      required
                    >
                      {[
                        "CREATED",
                        "PREPARING",
                        "CHECKING",
                        "INVOICE",
                        "DISPATCHED",
                        "DELIVERED",
                        "PARTIALLY_DELIVERED",
                        "CANCELED",
                        "DRAFT",
                        "ONHOLD",
                      ].map((status) => (
                        <Option key={status} value={status}>
                          {status.charAt(0) +
                            status.slice(1).toLowerCase().replace("_", " ")}
                        </Option>
                      ))}
                    </Select>
                  </Form.Group>
                </div>
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Priority <span className="text-danger">*</span>
                    </Form.Label>
                    <Select
                      style={{ width: "100%" }}
                      value={formData.priority || undefined}
                      onChange={(value) => handleChange("priority", value)}
                      placeholder="Select priority"
                      required
                    >
                      <Option value="high">High</Option>
                      <Option value="medium">Medium</Option>
                      <Option value="low">Low</Option>
                    </Select>
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Assigned To <span className="text-danger">*</span>
                    </Form.Label>
                    <div className="d-flex align-items-center">
                      <Select
                        style={{ width: "100%" }}
                        value={formData.teamId || undefined}
                        onChange={(value) => handleChange("teamId", value)}
                        placeholder="Select team"
                        disabled={isTeamsLoading}
                        required
                      >
                        {teams.length > 0 ? (
                          teams.map((team) => (
                            <Option key={team.id} value={team.id}>
                              {team.teamName}
                            </Option>
                          ))
                        ) : (
                          <Option value="" disabled>
                            No teams available
                          </Option>
                        )}
                      </Select>
                      <Button
                        type="primary"
                        className="ms-2"
                        onClick={() => setShowNewTeamModal(true)}
                        aria-label="Add new team"
                      >
                        <PlusOutlined />
                      </Button>
                    </div>
                  </Form.Group>
                </div>
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Due Date <span className="text-danger">*</span>
                    </Form.Label>
                    <DatePicker
                      style={{ width: "100%" }}
                      value={formData.dueDate ? moment(formData.dueDate) : null}
                      onChange={(date) =>
                        handleChange(
                          "dueDate",
                          date ? date.format("YYYY-MM-DD") : ""
                        )
                      }
                      format="YYYY-MM-DD"
                      required
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-12">
                  <Form.Group className="mb-3">
                    <Form.Label>Follow-up Dates</Form.Label>
                    {formData.followupDates.map((date, index) => (
                      <div
                        key={index}
                        className="d-flex align-items-center mb-2"
                      >
                        <DatePicker
                          style={{ width: "100%" }}
                          value={date ? moment(date) : null}
                          onChange={(date) =>
                            handleFollowupDateChange(index, date)
                          }
                          format="YYYY-MM-DD"
                        />
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeFollowupDate(index)}
                          aria-label="Remove follow-up date"
                          className="ms-2"
                        />
                      </div>
                    ))}
                    <Button
                      type="primary"
                      onClick={addFollowupDate}
                      aria-label="Add follow-up date"
                    >
                      <PlusOutlined /> Add Follow-up Date
                    </Button>
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-12">
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Source <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="source"
                      value={formData.source}
                      onChange={(e) =>
                        handleChange(e.target.name, e.target.value)
                      }
                      required
                      placeholder="Enter source"
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-12">
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Description <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      value={formData.description}
                      onChange={(e) =>
                        handleChange(e.target.name, e.target.value)
                      }
                      maxLength="60"
                      rows="4"
                      required
                      placeholder="Enter description (max 60 characters)"
                    />
                    <Form.Text className="text-muted">
                      Maximum 60 Characters
                    </Form.Text>
                  </Form.Group>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <BootstrapButton
                  variant="secondary"
                  onClick={() => navigate("/orders/list")}
                  disabled={
                    isOrderLoading || isInvoicesLoading || isTeamsLoading
                  }
                >
                  Cancel
                </BootstrapButton>
                <BootstrapButton
                  variant="primary"
                  type="submit"
                  disabled={
                    isOrderLoading || isInvoicesLoading || isTeamsLoading
                  }
                >
                  {isOrderLoading || isInvoicesLoading || isTeamsLoading
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                    ? "Update Order"
                    : "Create Order"}
                </BootstrapButton>
              </div>
            </Form>
            {showNewTeamModal && (
              <AddNewTeam
                adminName={adminName}
                onClose={() => setShowNewTeamModal(false)}
                onTeamAdded={refetchTeams}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewOrder;
