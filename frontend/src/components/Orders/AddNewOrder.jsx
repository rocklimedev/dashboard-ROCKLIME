import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import {
  Form,
  Spinner,
  Alert,
  Button as BootstrapButton,
} from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Select, DatePicker, Button, Input, Radio } from "antd";
import { toast } from "sonner";
import { debounce } from "lodash";
import Avatar from "react-avatar"; // Import react-avatar
import PageHeader from "../Common/PageHeader";
import {
  useCreateOrderMutation,
  useUpdateOrderByIdMutation,
  useOrderByIdQuery,
  useGetAllOrdersQuery,
} from "../../api/orderApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetProfileQuery } from "../../api/userApi";
import AddNewTeam from "./AddNewTeam";
import moment from "moment";

const { Option } = Select;

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
  const location = useLocation();
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
    data: usersData,
    isLoading: isUsersLoading,
    error: usersError,
  } = useGetAllUsersQuery();
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
  const users = Array.isArray(usersData?.users) ? usersData.users : [];
  const user = profileData?.user || {};
  const orders = useMemo(
    () => (Array.isArray(allOrdersData?.orders) ? allOrdersData.orders : []),
    [allOrdersData]
  );

  // Get quotation data from navigation state
  const quotationData = location.state?.quotationData || {};

  // State
  const [formData, setFormData] = useState({
    createdFor: quotationData.createdFor || "",
    createdBy: user.userId || "",
    assignedTeamId: "",
    assignedUserId: "",
    secondaryUserId: "",
    pipeline: "",
    status: "CREATED",
    dueDate: quotationData.dueDate || "",
    followupDates: [],
    source: quotationData.source || "",
    priority: "medium",
    description: quotationData.description || "",
    invoiceLink: isEditMode ? "" : null,
    orderNo: "",
    quotationId: quotationData.quotationId || "",
    masterPipelineNo: null,
    previousOrderNo: null,
  });
  const [assignmentType, setAssignmentType] = useState("team");
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [descriptionLength, setDescriptionLength] = useState(
    quotationData.description?.length || 0
  );

  // Handle team addition
  const handleTeamAdded = (newTeamId) => {
    refetchTeams();
    if (newTeamId) {
      setFormData((prev) => ({
        ...prev,
        assignedTeamId: newTeamId,
      }));
      setAssignmentType("team");
    }
  };

  // Generate orderNo in create mode
  useEffect(() => {
    if (!isEditMode && !isAllOrdersLoading && allOrdersData !== undefined) {
      const today = moment().format("DDMMYY"); // Changed from DDMMYYYY to DDMMYY
      const todayOrders = orders.filter((order) =>
        moment(order.createdAt).isSame(moment(), "day")
      );
      const serialNumber = todayOrders.length + 101; // Start from 101 instead of 1
      const generatedOrderNo = `${today}${serialNumber}`; // No padding with zeros
      setFormData((prev) => ({
        ...prev,
        orderNo: generatedOrderNo,
      }));
    }
  }, [isEditMode, isAllOrdersLoading, allOrdersData, orders]);
  // Populate form in edit mode
  useEffect(() => {
    if (isEditMode && order && formData.orderNo !== order.orderNo) {
      setFormData({
        createdFor: order.createdFor || "",
        createdBy: order.createdBy || user.userId || "",
        assignedTeamId: order.assignedTeamId || "",
        assignedUserId: order.assignedUserId || "",
        secondaryUserId: order.secondaryUserId || "",
        pipeline: order.pipeline || "",
        status: order.status || "CREATED",
        dueDate: order.dueDate || "",
        followupDates: order.followupDates || [],
        source: order.source || "",
        priority: order.priority || "medium",
        description: order.description || "",
        invoiceLink: order.invoiceLink || "",
        orderNo: order.orderNo || "",
        quotationId: order.quotationId || "",
        masterPipelineNo: order.masterPipelineNo || null,
        previousOrderNo: order.previousOrderNo || null,
      });
      setDescriptionLength((order.description || "").length);
      if (order.assignedTeamId) {
        setAssignmentType("team");
      } else if (order.assignedUserId || order.secondaryUserId) {
        setAssignmentType("users");
      }
    }
  }, [isEditMode, order, user.userId]);

  // Ensure createdBy is set to the logged-in user's ID and not editable
  useEffect(() => {
    if (user.userId && formData.createdBy !== user.userId) {
      setFormData((prev) => ({ ...prev, createdBy: user.userId }));
    }
  }, [user.userId, formData.createdBy]);

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
    // Prevent changes to createdBy
    if (name === "createdBy") return;
    if (name === "description") {
      setDescriptionLength(value.length);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearForm = () => {
    setFormData({
      createdFor: "",
      createdBy: user.userId || "",
      assignedTeamId: "",
      assignedUserId: "",
      secondaryUserId: "",
      pipeline: "",
      status: "CREATED",
      dueDate: "",
      followupDates: [],
      source: "",
      priority: "medium",
      description: "",
      invoiceLink: isEditMode ? "" : null,
      orderNo: isEditMode ? formData.orderNo : "",
      quotationId: "",
      masterPipelineNo: null,
      previousOrderNo: null,
    });
    setAssignmentType("team");
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
      toast.warning(`Timeline date ${index + 1} cannot be after the due date.`);
    }
    if (date && moment(date).isBefore(moment().startOf("day"))) {
      toast.warning(`Timeline date ${index + 1} cannot be before today.`);
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
    (orderNo, setNewOrderNo = true) => {
      if (!orderNo || isEditMode) return true;
      const isUnique = !orders.some((order) => order.orderNo === orderNo);
      if (!isUnique && setNewOrderNo) {
        const today = moment().format("DDMMYY"); // Changed from DDMMYYYY to DDMMYY
        const todayOrders = orders.filter((order) =>
          moment(order.createdAt).isSame(moment(), "day")
        );
        const newSerial = todayOrders.length + 102; // Increment to next available number
        const newOrderNo = `${today}${newSerial}`;
        setFormData((prev) => ({
          ...prev,
          orderNo: newOrderNo,
        }));
        toast.warning(
          `Order number ${orderNo} already exists. Generated new number: ${newOrderNo}`
        );
        return false;
      }
      return isUnique;
    },
    [orders, isEditMode]
  );

  const validateOrderNo = (orderNo) => {
    if (!orderNo) return false;
    const orderNoRegex = /^\d{6}\d{3,}$/; // DDMMYY followed by 3 or more digits
    const isValidFormat = orderNoRegex.test(orderNo);
    if (!isValidFormat) return false;
    const serialPart = parseInt(orderNo.slice(6), 10);
    return serialPart >= 101; // Ensure serial number is at least 101
  };
  // Check orderNo uniqueness only after initial generation
  useEffect(() => {
    if (!isEditMode && formData.orderNo && !isAllOrdersLoading) {
      checkOrderNoUniqueness(formData.orderNo);
    }
  }, [
    formData.orderNo,
    isEditMode,
    isAllOrdersLoading,
    checkOrderNoUniqueness,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.createdFor) {
      toast.error("Please select a Customer.");
      return;
    }

    if (assignmentType === "team" && !formData.assignedTeamId) {
      toast.error("Please select a Team for assignment.");
      return;
    }

    if (assignmentType === "users" && !formData.assignedUserId) {
      toast.error("Please select at least a Primary User for assignment.");
      return;
    }

    if (
      assignmentType === "users" &&
      formData.assignedUserId &&
      formData.secondaryUserId &&
      formData.assignedUserId === formData.secondaryUserId
    ) {
      toast.error("Primary and Secondary Users cannot be the same.");
      return;
    }

    if (!validateOrderNo(formData.orderNo)) {
      toast.error(
        "Order Number must be in the format DDMMYYYYXXXXX (e.g., 2708202500001)."
      );
      return;
    }

    if (isEditMode && formData.orderNo !== order?.orderNo) {
      toast.error("Order Number cannot be changed in update mode.");
      return;
    }

    if (!isEditMode && !checkOrderNoUniqueness(formData.orderNo, false)) {
      toast.error("Order Number already exists.");
      return;
    }

    if (!validateFollowupDates()) {
      toast.error("Timeline dates cannot be after the due date.");
      return;
    }

    if (
      formData.masterPipelineNo &&
      !validateOrderNo(formData.masterPipelineNo)
    ) {
      toast.error(
        "Master Pipeline Number must be in the format DDMMYYYYXXXXX (e.g., 2708202500001)."
      );
      return;
    }

    if (
      formData.previousOrderNo &&
      !validateOrderNo(formData.previousOrderNo)
    ) {
      toast.error(
        "Previous Order Number must be in the format DDMMYYYYXXXXX (e.g., 2708202500001)."
      );
      return;
    }

    if (
      formData.masterPipelineNo &&
      orders.every((order) => order.orderNo !== formData.masterPipelineNo)
    ) {
      toast.error("Master Pipeline Number does not match any existing order.");
      return;
    }

    if (
      formData.previousOrderNo &&
      orders.every((order) => order.orderNo !== formData.previousOrderNo)
    ) {
      toast.error("Previous Order Number does not match any existing order.");
      return;
    }

    try {
      const payload = {
        createdFor: formData.createdFor,
        createdBy: formData.createdBy,
        assignedTeamId:
          assignmentType === "team" ? formData.assignedTeamId : null,
        assignedUserId:
          assignmentType === "users" ? formData.assignedUserId : null,
        secondaryUserId:
          assignmentType === "users" ? formData.secondaryUserId : null,
        pipeline: formData.pipeline || null,
        status: formData.status,
        dueDate: formData.dueDate || null,
        followupDates: formData.followupDates.filter(
          (date) => date && moment(date).isValid()
        ),
        source: formData.source || null,
        priority: formData.priority || null,
        description: formData.description || null,
        invoiceLink: isEditMode ? formData.invoiceLink || null : null,
        orderNo: formData.orderNo,
        quotationId: formData.quotationId || null,
        masterPipelineNo: formData.masterPipelineNo || null,
        previousOrderNo: formData.previousOrderNo || null,
      };

      if (isEditMode) {
        if (!id) {
          toast.error("Cannot update order: Invalid order ID.");
          return;
        }
        await updateOrder({ id, ...payload }).unwrap();
      } else {
        await createOrder(payload).unwrap();
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

  if (
    isOrderLoading ||
    isTeamsLoading ||
    isCustomersLoading ||
    isUsersLoading ||
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

  if (
    orderError ||
    customersError ||
    usersError ||
    profileError ||
    allOrdersError
  ) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <Alert variant="danger" role="alert">
              Error loading data:{" "}
              {orderError?.data?.message ||
                customersError?.data?.message ||
                usersError?.data?.message ||
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
          {/* Add Avatar at the top of the card */}
          <div className="card-header d-flex align-items-center">
            <PageHeader
              title={isEditMode ? "Edit Order" : "Add New Order"}
              subtitle="Fill out the order details"
              exportOptions={{ pdf: false, excel: false }}
            />
            <Avatar
              name={user.name || "Unknown User"}
              size="40"
              round={true}
              className="me-2"
              title={`Created by ${user.name || "Unknown User"}`}
            />
          </div>
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
                    <div className="d-flex align-items-center">
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
                      <Button
                        type="primary"
                        className="ms-2"
                        onClick={() => navigate("/customers/add")}
                        aria-label="Add new customer"
                      >
                        <PlusOutlined />
                      </Button>
                    </div>
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Order Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="orderNo"
                      value={formData.orderNo || "Generating..."}
                      onChange={(e) =>
                        handleChange(e.target.name, e.target.value)
                      }
                      placeholder="Enter order number (e.g., 151025101)"
                      disabled={true}
                    />
                  </Form.Group>
                </div>
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Quotation Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="quotationId"
                      value={formData.source || "N/A"}
                      readOnly
                      placeholder="Quotation number (auto-filled if converted)"
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Master Pipeline Number</Form.Label>
                    <Select
                      style={{ width: "100%" }}
                      value={formData.masterPipelineNo || undefined}
                      onChange={(value) =>
                        handleChange("masterPipelineNo", value)
                      }
                      placeholder="Select master pipeline order"
                      allowClear
                    >
                      {orders
                        .filter(
                          (order) =>
                            order.orderNo && order.orderNo !== formData.orderNo
                        )
                        .map((order) => (
                          <Option key={order.orderNo} value={order.orderNo}>
                            {order.orderNo}
                          </Option>
                        ))}
                    </Select>
                  </Form.Group>
                </div>
                <div className="col-lg-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Previous Order Number</Form.Label>
                    <Select
                      style={{ width: "100%" }}
                      value={formData.previousOrderNo || undefined}
                      onChange={(value) =>
                        handleChange("previousOrderNo", value)
                      }
                      placeholder="Select previous order"
                      allowClear
                    >
                      {orders
                        .filter(
                          (order) =>
                            order.orderNo && order.orderNo !== formData.orderNo
                        )
                        .map((order) => (
                          <Option key={order.orderNo} value={order.orderNo}>
                            {order.orderNo}
                          </Option>
                        ))}
                    </Select>
                  </Form.Group>
                </div>
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
                <div className="col-lg-12">
                  <Form.Group className="mb-3">
                    <Form.Label>Assigned To</Form.Label>
                    <Radio.Group
                      value={assignmentType}
                      onChange={(e) => {
                        setAssignmentType(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          assignedTeamId:
                            e.target.value === "team"
                              ? prev.assignedTeamId
                              : "",
                          assignedUserId:
                            e.target.value === "users"
                              ? prev.assignedUserId
                              : "",
                          secondaryUserId:
                            e.target.value === "users"
                              ? prev.secondaryUserId
                              : "",
                        }));
                      }}
                    >
                      <Radio value="team">Team</Radio>
                      <Radio value="users">Users</Radio>
                    </Radio.Group>
                  </Form.Group>
                </div>
              </div>

              {assignmentType === "team" && (
                <div className="row">
                  <div className="col-lg-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Team</Form.Label>
                      <div className="d-flex align-items-center">
                        <Select
                          style={{ width: "100%" }}
                          value={formData.assignedTeamId || undefined}
                          onChange={(value) =>
                            handleChange("assignedTeamId", value)
                          }
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
                </div>
              )}

              {assignmentType === "users" && (
                <div className="row">
                  <div className="col-lg-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Primary User</Form.Label>
                      <Select
                        style={{ width: "100%" }}
                        value={formData.assignedUserId || undefined}
                        onChange={(value) =>
                          handleChange("assignedUserId", value)
                        }
                        placeholder="Select primary user"
                        disabled={isUsersLoading}
                      >
                        {users.length > 0 ? (
                          users.map((user) => (
                            <Option key={user.userId} value={user.userId}>
                              {user.username || user.name || "—"}
                            </Option>
                          ))
                        ) : (
                          <Option value="" disabled>
                            No users available
                          </Option>
                        )}
                      </Select>
                    </Form.Group>
                  </div>
                  <div className="col-lg-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Secondary User (Optional)</Form.Label>
                      <Select
                        style={{ width: "100%" }}
                        value={formData.secondaryUserId || undefined}
                        onChange={(value) =>
                          handleChange("secondaryUserId", value)
                        }
                        placeholder="Select secondary user"
                        disabled={isUsersLoading}
                        allowClear
                      >
                        {users.length > 0 ? (
                          users.map((user) => (
                            <Option key={user.userId} value={user.userId}>
                              {user.username || user.name || "—"}
                            </Option>
                          ))
                        ) : (
                          <Option value="" disabled>
                            No users available
                          </Option>
                        )}
                      </Select>
                    </Form.Group>
                  </div>
                </div>
              )}

              <div className="row">
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
                    <Form.Label>Timeline Dates</Form.Label>
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
                          aria-label="Remove Timeline date"
                          className="ms-2"
                        />
                      </div>
                    ))}
                    <Button
                      type="primary"
                      onClick={addFollowupDate}
                      aria-label="Add Timeline date"
                    >
                      <PlusOutlined /> Add Timeline Date
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
                    isUsersLoading ||
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
                    isUsersLoading ||
                    isAllOrdersLoading
                  }
                >
                  {isOrderLoading ||
                  isTeamsLoading ||
                  isCustomersLoading ||
                  isUsersLoading ||
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
                onTeamAdded={handleTeamAdded}
                visible={showNewTeamModal}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewOrder;
