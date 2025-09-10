import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Form,
  Spinner,
  Alert,
  Button as BootstrapButton,
} from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Select, DatePicker, Button, Input } from "antd";
import { toast } from "sonner";
import { debounce } from "lodash";
import PageHeader from "../Common/PageHeader";
import {
  useCreateOrderMutation,
  useUpdateOrderByIdMutation,
  useOrderByIdQuery,
  useGetAllOrdersQuery,
} from "../../api/orderApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetProfileQuery } from "../../api/userApi";
import AddNewTeam from "./AddNewTeam";
import moment from "moment";

const { Option } = Select;

// Define status values from the database schema
const STATUS_VALUES = [
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
];

// Statuses where invoiceLink should be enabled
const INVOICE_EDITABLE_STATUSES = [
  "INVOICE",
  "DISPATCHED",
  "DELIVERED",
  "PARTIALLY_DELIVERED",
];

const AddNewOrder = ({ adminName }) => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [createOrder] = useCreateOrderMutation();
  const [updateOrder] = useUpdateOrderByIdMutation();

  // Queries
  const {
    data: orderData,
    isLoading: isOrderLoading,
    error: orderError,
  } = useOrderByIdQuery(id, { skip: !isEditMode || !id });
  const {
    data: teamsData,
    isLoading: isTeamsLoading,
    refetch: refetchTeams,
  } = useGetAllTeamsQuery();
  const {
    data: customersData,
    isLoading: isCustomersLoading,
    error: customersError,
  } = useGetCustomersQuery();
  const {
    data: profileData,
    isLoading: isProfileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const {
    data: allOrdersData,
    isLoading: isAllOrdersLoading,
    error: allOrdersError,
  } = useGetAllOrdersQuery({ skip: isEditMode });

  // Data assignments
  const order = orderData?.order;
  const teams = Array.isArray(teamsData?.teams) ? teamsData.teams : [];
  const customers = Array.isArray(customersData?.data)
    ? customersData.data
    : [];
  const user = profileData?.user || {};
  const orders = Array.isArray(allOrdersData?.orders)
    ? allOrdersData.orders
    : [];

  // State
  const [formData, setFormData] = useState({
    title: "",
    createdFor: "",
    createdBy: user.userId || "",
    assignedTo: "",
    pipeline: "",
    status: "CREATED",
    dueDate: "",
    followupDates: [],
    source: "",
    teamId: "",
    priority: "medium",
    description: "",
    invoiceLink: isEditMode ? "" : null,
    orderNo: "",
  });

  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [descriptionLength, setDescriptionLength] = useState(0);

  // Generate orderNo in create mode
  useEffect(() => {
    if (!isEditMode && !isAllOrdersLoading && allOrdersData !== undefined) {
      const today = moment().format("DDMMYYYY");
      const todayOrders = orders.filter((order) =>
        moment(order.createdAt).isSame(moment(), "day")
      );
      const serialNumber = String(todayOrders.length + 1).padStart(5, "0");
      const generatedOrderNo = `${today}${serialNumber}`;
      setFormData((prev) => ({
        ...prev,
        orderNo: generatedOrderNo,
      }));
    } else if (!isEditMode && isAllOrdersLoading) {
      setFormData((prev) => ({
        ...prev,
        orderNo: moment().format("DDMMYYYY") + "00001",
      }));
    }
  }, [isEditMode, allOrdersData, isAllOrdersLoading, orders]);

  useEffect(() => {
    if (isEditMode && order && formData.orderNo !== order.orderNo) {
      setFormData({
        title: order.title || "",
        createdFor: order.createdFor || "",
        createdBy: order.createdBy || user.userId || "",
        assignedTo: order.assignedTo || "",
        pipeline: order.pipeline || "",
        status: order.status || "CREATED",
        dueDate: order.dueDate || "",
        followupDates: order.followupDates || [],
        source: order.source || "",
        teamId: order.assignedTo || "",
        priority: order.priority || "medium",
        description: order.description || "",
        invoiceLink: order.invoiceLink || "",
        orderNo: order.orderNo || "", // Load existing order number
      });
      setDescriptionLength((order.description || "").length);
    }
  }, [isEditMode, order, user.userId, formData.orderNo]);

  useEffect(() => {
    if (!isEditMode && user.userId && formData.createdBy !== user.userId) {
      setFormData((prev) => ({ ...prev, createdBy: user.userId }));
    }
  }, [user.userId, isEditMode, formData.createdBy]);

  // Debounced customer search
  const debouncedCustomerSearch = useCallback(
    debounce((value) => {
      setCustomerSearch(value);
      if (value) {
        const filtered = customers.filter((customer) =>
          customer.name?.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCustomers(filtered);
      } else {
        setFilteredCustomers(customers);
      }
    }, 300),
    [customers]
  );

  useEffect(() => {
    setFilteredCustomers(customers);
  }, [customers]);

  // Handlers
  const handleChange = (name, value) => {
    if (name === "teamId") {
      setFormData((prev) => ({
        ...prev,
        teamId: value,
        assignedTo: value,
      }));
    } else if (name === "description") {
      setDescriptionLength(value.length);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (name === "orderNo" && !isEditMode) {
      // Only allow orderNo changes in create mode
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const clearForm = () => {
    setFormData({
      title: "",
      createdFor: "",
      createdBy: user.userId || "",
      assignedTo: "",
      pipeline: "",
      status: "CREATED",
      dueDate: "",
      followupDates: [],
      source: "",
      teamId: "",
      priority: "medium",
      description: "",
      invoiceLink: isEditMode ? "" : null,
      orderNo: isEditMode ? formData.orderNo : "",
    });
    setCustomerSearch("");
    setFilteredCustomers(customers);
    setDescriptionLength(0);
  };

  const validateFollowupDates = () => {
    if (!formData.dueDate || formData.followupDates.length === 0) return true;

    const dueDate = moment(formData.dueDate);
    return formData.followupDates.every((followupDate) => {
      if (!followupDate || new Date(followupDate).toString() === "Invalid Date")
        return true;
      return moment(followupDate).isSameOrBefore(dueDate, "day");
    });
  };

  const handleFollowupDateChange = (index, date) => {
    const updatedDates = [...formData.followupDates];
    updatedDates[index] = date ? date.format("YYYY-MM-DD") : "";

    if (
      formData.dueDate &&
      date &&
      moment(date).isAfter(moment(formData.dueDate), "day")
    ) {
      toast.warning(
        `Follow-up date ${index + 1} cannot be after the due date.`
      );
    }
    if (date && moment(date).isBefore(moment().startOf("day"))) {
      toast.warning(`Follow-up date ${index + 1} cannot be before today.`);
    }

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

  const checkOrderNoUniqueness = useCallback(
    (orderNo) => {
      if (!orderNo || isEditMode) return true;
      const isUnique = !orders.some((order) => order.orderNo === orderNo);
      if (!isUnique) {
        const today = moment().format("DDMMYYYY");
        const todayOrders = orders.filter((order) =>
          moment(order.createdAt).isSame(moment(), "day")
        );
        const newSerial = String(todayOrders.length + 2).padStart(5, "0");
        setFormData((prev) => ({
          ...prev,
          orderNo: `${today}${newSerial}`,
        }));
        toast.warning(
          `Order number ${orderNo} already exists. Generated new number: ${today}${newSerial}`
        );
      }
      return isUnique;
    },
    [orders, isEditMode]
  );

  useEffect(() => {
    if (!isEditMode && formData.orderNo) {
      checkOrderNoUniqueness(formData.orderNo);
    }
  }, [formData.orderNo, isEditMode, checkOrderNoUniqueness]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.createdFor) {
      toast.error("Please fill all required fields (Title, Customer).");
      return;
    }

    const orderNoRegex = /^\d{8}\d{5}$/;
    if (!formData.orderNo || !orderNoRegex.test(formData.orderNo)) {
      toast.error(
        "Order Number must be in the format DDMMYYYYXXXXX (e.g., 2708202500001)."
      );
      return;
    }

    if (isEditMode && formData.orderNo !== order?.orderNo) {
      toast.error("Order Number cannot be changed in update mode.");
      return;
    }

    if (!isEditMode && !checkOrderNoUniqueness(formData.orderNo)) {
      return;
    }

    if (!validateFollowupDates()) {
      toast.error("Follow-up dates cannot be after the due date.");
      return;
    }

    try {
      const payload = {
        ...formData,
        assignedTo: formData.assignedTo || null,
        priority: formData.priority || null,
        followupDates: formData.followupDates.filter(
          (date) => date && moment(date).isValid()
        ),
        invoiceLink: isEditMode ? formData.invoiceLink || null : null,
      };

      if (isEditMode) {
        if (!id) {
          toast.error("Cannot update order: Invalid order ID.");
          return;
        }
        await updateOrder({ id, ...payload }).unwrap();
        toast.success("Order updated successfully!");
      } else {
        await createOrder(payload).unwrap();
        toast.success("Order created successfully!");
      }
      navigate("/orders/list");
    } catch (err) {
      const errorMessage =
        err?.status === 400
          ? `Bad Request: ${err.data?.message || "Invalid data provided."}`
          : err?.status === 404
          ? `Not Found: ${err.data?.message || "Resource not found."}`
          : err?.status === 500
          ? "Server error. Please try again later."
          : "Something went wrong. Please try again.";
      toast.error(errorMessage);
    }
  };
  // Loading state
  if (
    isOrderLoading ||
    isTeamsLoading ||
    isCustomersLoading ||
    isProfileLoading ||
    (!isEditMode && isAllOrdersLoading)
  ) {
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
  if (orderError || customersError || profileError || allOrdersError) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <Alert variant="danger" role="alert">
              Error loading data:{" "}
              {orderError?.data?.message ||
                customersError?.data?.message ||
                profileError?.data?.message ||
                allOrdersError?.data?.message ||
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
                      Customer <span className="text-danger">*</span>
                    </Form.Label>
                    <Select
                      showSearch
                      style={{ width: "100%" }}
                      placeholder="Search customers"
                      value={formData.createdFor || undefined}
                      onChange={(value) => handleChange("createdFor", value)}
                      onSearch={debouncedCustomerSearch}
                      filterOption={false}
                      disabled={isCustomersLoading}
                    >
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <Option
                            key={customer.customerId}
                            value={customer.customerId}
                          >
                            {customer.name}
                          </Option>
                        ))
                      ) : (
                        <Option value="" disabled>
                          No customers available
                        </Option>
                      )}
                    </Select>
                  </Form.Group>
                </div>
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Created By</Form.Label>
                    <Form.Control
                      type="text"
                      name="createdBy"
                      value={user.name || "N/A"}
                      readOnly
                      placeholder="Auto-filled from profile"
                    />
                  </Form.Group>
                </div>
              </div>

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
                      maxLength={255}
                      required
                      placeholder="Enter order title"
                    />
                  </Form.Group>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Order Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="orderNo"
                    value={formData.orderNo || "Generating..."}
                    onChange={(e) =>
                      handleChange(e.target.name, e.target.value)
                    }
                    placeholder="Enter order number (e.g., 2708202500001)"
                    disabled={true}
                  />
                </Form.Group>
              </div>

              <div className="row">
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Pipeline</Form.Label>
                    <Form.Control
                      type="text"
                      name="pipeline"
                      value={formData.pipeline}
                      onChange={(e) =>
                        handleChange(e.target.name, e.target.value)
                      }
                      placeholder="Enter pipeline"
                    />
                  </Form.Group>
                </div>
                {isEditMode && (
                  <div className="col-lg-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Invoice Link</Form.Label>
                      <Form.Control
                        type="text"
                        name="invoiceLink"
                        value={formData.invoiceLink || ""}
                        onChange={(e) =>
                          handleChange(e.target.name, e.target.value)
                        }
                        maxLength={500}
                        placeholder="Enter invoice link"
                        disabled={
                          !INVOICE_EDITABLE_STATUSES.includes(formData.status)
                        }
                      />
                    </Form.Group>
                  </div>
                )}
              </div>

              <div className="row">
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Select
                      style={{ width: "100%" }}
                      value={formData.status}
                      onChange={(value) => handleChange("status", value)}
                    >
                      {STATUS_VALUES.map((status) => (
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
                    <Form.Label>Priority</Form.Label>
                    <Select
                      style={{ width: "100%" }}
                      value={formData.priority || undefined}
                      onChange={(value) => handleChange("priority", value)}
                      placeholder="Select priority"
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
                    <Form.Label>Assigned To</Form.Label>
                    <div className="d-flex align-items-center">
                      <Select
                        style={{ width: "100%" }}
                        value={formData.teamId || undefined}
                        onChange={(value) => handleChange("teamId", value)}
                        placeholder="Select team"
                        disabled={isTeamsLoading}
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
                    <Form.Label>Due Date</Form.Label>
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
                      disabledDate={(current) =>
                        current && current < moment().startOf("day")
                      }
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
                          disabledDate={(current) =>
                            current &&
                            (current < moment().startOf("day") ||
                              (formData.dueDate &&
                                current >
                                  moment(formData.dueDate).endOf("day")))
                          }
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
                    <Form.Label>Source</Form.Label>
                    <Form.Control
                      type="text"
                      name="source"
                      value={formData.source}
                      onChange={(e) =>
                        handleChange(e.target.name, e.target.value)
                      }
                      maxLength={255}
                      placeholder="Enter source"
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-12">
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      value={formData.description}
                      onChange={(e) =>
                        handleChange(e.target.name, e.target.value)
                      }
                      rows={4}
                      placeholder="Enter description"
                    />
                    <Form.Text
                      className={
                        descriptionLength > 60 ? "text-danger" : "text-muted"
                      }
                    >
                      {descriptionLength}/60 Characters (Recommended)
                    </Form.Text>
                  </Form.Group>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <BootstrapButton
                  variant="secondary"
                  onClick={() => navigate("/orders/list")}
                  disabled={
                    isOrderLoading ||
                    isTeamsLoading ||
                    isCustomersLoading ||
                    isAllOrdersLoading
                  }
                >
                  Cancel
                </BootstrapButton>
                <BootstrapButton
                  variant="primary"
                  type="submit"
                  disabled={
                    isOrderLoading ||
                    isTeamsLoading ||
                    isCustomersLoading ||
                    isAllOrdersLoading
                  }
                >
                  {isOrderLoading ||
                  isTeamsLoading ||
                  isCustomersLoading ||
                  isAllOrdersLoading
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
