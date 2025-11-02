import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import {
  Form,
  Alert,
  Button as BootstrapButton,
  Collapse,
} from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import {
  PlusOutlined,
  DeleteOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import {
  Select,
  DatePicker,
  Button,
  Input,
  Spin,
  Radio,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  Tooltip,
} from "antd";
import { toast } from "sonner";
import { debounce } from "lodash";
import Avatar from "react-avatar";
import styled from "styled-components";
import moment from "moment";
import {
  useCreateOrderMutation,
  useUpdateOrderByIdMutation,
  useOrderByIdQuery,
  useGetAllOrdersQuery,
} from "../../api/orderApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
} from "../../api/customerApi";
import { useGetAllUsersQuery, useGetProfileQuery } from "../../api/userApi";
import {
  useGetAllAddressesQuery,
  useCreateAddressMutation,
} from "../../api/addressApi";
import AddNewTeam from "./AddNewTeam";
import AddCustomerModal from "../Customers/AddCustomerModal";
import AddAddress from "../Address/AddAddressModal";

const { Option } = Select;
const { Text } = Typography;

// Constants
const SOURCE_TYPES = [
  "Retail",
  "Architect",
  "Interior",
  "Builder",
  "Contractor",
];
const STATUS_VALUES = [
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

// Styled Components
const FormContainer = styled.div`
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const FormSection = styled.div`
  margin-bottom: 12px;
`;

const CompactSelect = styled(Select)`
  width: 100%;
  .ant-select-selector {
    height: 32px !important;
    padding: 0 8px !important;
  }
`;

const CompactInput = styled(Input)`
  height: 32px;
`;

const CompactTextArea = styled(Input.TextArea)`
  resize: vertical;
`;

const CompactDatePicker = styled(DatePicker)`
  width: 100%;
  height: 32px;
`;

const ActionButton = styled(Button)`
  padding: 0;
  font-size: 12px;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const AddNewOrder = ({ adminName }) => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const [createOrder] = useCreateOrderMutation();
  const [updateOrder] = useUpdateOrderByIdMutation();
  const [createAddress] = useCreateAddressMutation();
  const [createCustomer, { isLoading: isCreatingCustomer }] =
    useCreateCustomerMutation();

  const quotationData = location.state?.quotationData || {};

  const [formData, setFormData] = useState({
    createdFor: quotationData.createdFor || "",
    createdBy: "",
    assignedTeamId: "",
    assignedUserId: "",
    secondaryUserId: "",
    status: "PREPARING",
    dueDate:
      quotationData.dueDate || moment().add(1, "days").format("YYYY-MM-DD"),
    followupDates: [],
    source: quotationData.source || "",
    sourceType: "",
    priority: "medium",
    description: quotationData.description || "",
    invoiceLink: isEditMode ? "" : null,
    orderNo: "",
    quotationId: quotationData.quotationId || "",
    masterPipelineNo: null,
    previousOrderNo: null,
    shipTo: null,
  });

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
  const {
    data: addressesData,
    isLoading: addressesLoading,
    isError: addressesError,
    refetch: refetchAddresses,
  } = useGetAllAddressesQuery(
    { customerId: formData.createdFor },
    { skip: !formData.createdFor }
  );

  // Data assignments
  const order = orderData?.order;
  const teams = useMemo(
    () => (Array.isArray(teamsData?.teams) ? teamsData.teams : []),
    [teamsData]
  );
  const customers = useMemo(
    () => (Array.isArray(customersData?.data) ? customersData.data : []),
    [customersData]
  );
  const users = useMemo(
    () => (Array.isArray(usersData?.users) ? usersData.users : []),
    [usersData]
  );
  const user = profileData?.user || {};
  const orders = useMemo(
    () => (Array.isArray(allOrdersData?.orders) ? allOrdersData.orders : []),
    [allOrdersData]
  );
  const addresses = useMemo(
    () => (Array.isArray(addressesData) ? addressesData : []),
    [addressesData]
  );

  // State
  const [assignmentType, setAssignmentType] = useState("team");
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState(customers);
  const [descriptionLength, setDescriptionLength] = useState(
    quotationData.description?.length || 0
  );
  const [useBillingAddress, setUseBillingAddress] = useState(false);
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Memoized filtered addresses
  const filteredAddresses = useMemo(() => {
    if (!formData.createdFor) return [];
    return addresses.filter((addr) => addr.customerId === formData.createdFor);
  }, [addresses, formData.createdFor]);

  // Memoized default address
  const defaultAddress = useMemo(() => {
    const customer = customers.find(
      (c) => c.customerId === formData.createdFor
    );
    return customer?.address || null;
  }, [customers, formData.createdFor]);

  // Memoized source customers
  const sourceCustomers = useMemo(() => {
    if (!formData.sourceType) return [];
    const normalizedSourceType = formData.sourceType.toLowerCase();
    return customers.filter((customer) => {
      const customerType = customer.customerType
        ? customer.customerType.toLowerCase()
        : "";
      return customerType === normalizedSourceType;
    });
  }, [customers, formData.sourceType]);

  // Generate orderNo in create mode
  useEffect(() => {
    if (!isEditMode && !isAllOrdersLoading && allOrdersData !== undefined) {
      const today = moment().format("DDMM25");
      const todayOrders = orders.filter((order) =>
        moment(order.createdAt).isSame(moment(), "day")
      );
      const serialNumber = todayOrders.length + 101;
      const generatedOrderNo = `${today}${serialNumber}`;
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
        status: order.status || "PREPARING",
        dueDate: order.dueDate || moment().add(1, "days").format("YYYY-MM-DD"),
        followupDates: order.followupDates || [],
        source: order.source || "",
        sourceType: order.sourceType || "",
        priority: order.priority || "medium",
        description: order.description || "",
        invoiceLink: order.invoiceLink || "",
        orderNo: order.orderNo || "",
        quotationId: order.quotationId || "",
        masterPipelineNo: order.masterPipelineNo || null,
        previousOrderNo: order.previousOrderNo || null,
        shipTo: order.shipTo || null,
      });
      setDescriptionLength((order.description || "").length);
      if (order.assignedTeamId) {
        setAssignmentType("team");
      } else if (order.assignedUserId || order.secondaryUserId) {
        setAssignmentType("users");
      }
    }
  }, [isEditMode, order, user.userId]);

  // Ensure createdBy is set
  useEffect(() => {
    if (user.userId && formData.createdBy !== user.userId) {
      setFormData((prev) => ({ ...prev, createdBy: user.userId }));
    }
  }, [user.userId, formData.createdBy]);

  // Sync shipTo with default address
  useEffect(() => {
    if (
      !formData.createdFor ||
      !defaultAddress ||
      isCreatingAddress ||
      !useBillingAddress ||
      formData.shipTo
    ) {
      return;
    }

    const normalizeString = (str) => (str ? str.trim().toLowerCase() : "");
    const matchingAddress = filteredAddresses.find((addr) => {
      const match = {
        streetMatch:
          normalizeString(addr.street) ===
          normalizeString(defaultAddress.street),
        cityMatch:
          normalizeString(addr.city) === normalizeString(defaultAddress.city),
        stateMatch:
          normalizeString(addr.state) === normalizeString(defaultAddress.state),
        postalMatch:
          normalizeString(addr.postalCode || addr.zip) ===
            normalizeString(defaultAddress.postalCode || defaultAddress.zip) ||
          normalizeString(addr.postalCode || addr.zip) ===
            normalizeString(defaultAddress.zip || defaultAddress.postalCode),
        countryMatch:
          normalizeString(addr.country || "India") ===
          normalizeString(defaultAddress.country || "India"),
      };
      return (
        match.streetMatch &&
        match.cityMatch &&
        match.stateMatch &&
        match.postalMatch &&
        match.countryMatch
      );
    });

    if (matchingAddress) {
      handleChange("shipTo", matchingAddress.addressId);
      return;
    }

    const createBillingAddress = async () => {
      setIsCreatingAddress(true);
      try {
        const newAddress = {
          customerId: formData.createdFor,
          street: defaultAddress.street || "",
          city: defaultAddress.city || "",
          state: defaultAddress.state || "",
          postalCode: defaultAddress.postalCode || defaultAddress.zip || "",
          country: defaultAddress.country || "India",
          status: "BILLING",
        };
        const result = await createAddress(newAddress).unwrap();
        handleChange("shipTo", result.data.addressId);
      } catch (err) {
        toast.error(
          `Failed to create billing address: ${
            err.data?.message || "Unknown error"
          }`
        );
        handleChange("shipTo", null);
      } finally {
        setIsCreatingAddress(false);
      }
    };

    createBillingAddress();
  }, [
    useBillingAddress,
    defaultAddress,
    filteredAddresses,
    formData.createdFor,
    formData.shipTo,
    isCreatingAddress,
  ]);

  // Debounced customer search
  const debouncedCustomerSearch = useCallback(
    debounce((value) => {
      setCustomerSearch(value);
      if (value) {
        const filtered = customers.filter(
          (customer) =>
            customer.name.toLowerCase().includes(value.toLowerCase()) ||
            customer.email?.toLowerCase().includes(value.toLowerCase())
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
    if (name === "createdBy") return;
    if (name === "description") {
      setDescriptionLength(value.length);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTeamAdded = (newTeamId) => {
    setShowNewTeamModal(false);
    setFormData((prev) => ({ ...prev, assignedTeamId: newTeamId }));
    refetchTeams();
  };

  const handleAddressChange = (value) => {
    if (value === "sameAsBilling") {
      setUseBillingAddress(true);
    } else {
      setUseBillingAddress(false);
      handleChange("shipTo", value);
    }
  };

  const clearForm = () => {
    setFormData({
      createdFor: "",
      createdBy: user.userId || "",
      assignedTeamId: "",
      assignedUserId: "",
      secondaryUserId: "",
      status: "PREPARING",
      dueDate: moment().add(1, "days").format("YYYY-MM-DD"),
      followupDates: [],
      source: "",
      sourceType: "",
      priority: "medium",
      description: "",
      invoiceLink: isEditMode ? "" : null,
      orderNo: isEditMode ? formData.orderNo : "",
      quotationId: "",
      masterPipelineNo: null,
      previousOrderNo: null,
      shipTo: null,
    });
    setAssignmentType("team");
    setCustomerSearch("");
    setFilteredCustomers(customers);
    setDescriptionLength(0);
    setUseBillingAddress(false);
    setAdvancedOpen(false);
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
      followupDates: [...formData.followupDates, null],
    });
  };

  const removeFollowupDate = (index) => {
    setFormData({
      ...formData,
      followupDates: formData.followupDates.filter((_, i) => i !== index),
    });
  };

  const validateOrderNo = (orderNo) => {
    if (!orderNo) return false;
    const orderNoRegex = /^\d{1,2}\d{1,2}25\d{3,}$/;
    return orderNoRegex.test(orderNo);
  };

  const checkOrderNoUniqueness = useCallback(
    (orderNo, setNewOrderNo = true) => {
      if (!orderNo || isEditMode) return true;
      const isUnique = !orders.some((order) => order.orderNo === orderNo);
      if (!isUnique && setNewOrderNo) {
        const today = moment().format("DDMM25");
        const todayOrders = orders.filter((order) =>
          moment(order.createdAt).isSame(moment(), "day")
        );
        const newSerial = todayOrders.length + 102;
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
    if (formData.secondaryUserId) {
      const secondaryUserExists = users.some(
        (user) => user.userId === formData.secondaryUserId
      );
      if (!secondaryUserExists) {
        toast.error(
          "Selected Secondary User does not exist. Please refresh and try again."
        );
        return;
      }
    }
    if (formData.sourceType && !formData.source) {
      toast.error(
        "Please select a Source Customer for the selected Source Type."
      );
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
        "Order Number must be in the format DDMM25XXX (e.g., 151025101)."
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

    if (!formData.dueDate) {
      toast.error("Please select a due date.");
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
        "Master Pipeline Number must be in the format DDMM25XXX (e.g., 151025101)."
      );
      return;
    }

    if (
      formData.previousOrderNo &&
      !validateOrderNo(formData.previousOrderNo)
    ) {
      toast.error(
        "Previous Order Number must be in the format DDMM25XXX (e.g., 151025101)."
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

    if (!formData.shipTo && !useBillingAddress) {
      toast.error("Please select a shipping address.");
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
        status: formData.status,
        dueDate: formData.dueDate || null,
        followupDates: formData.followupDates.filter(
          (date) => date && moment(date).isValid()
        ),
        source: formData.source || null,
        sourceType: formData.sourceType || null,
        priority: formData.priority || null,
        description: formData.description || null,
        invoiceLink: isEditMode ? formData.invoiceLink || null : null,
        orderNo: formData.orderNo,
        quotationId: formData.quotationId || null,
        masterPipelineNo: formData.masterPipelineNo || null,
        previousOrderNo: formData.previousOrderNo || null,
        shipTo: formData.shipTo || null,
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

  const handleAddCustomer = () => {
    setShowAddCustomerModal(true);
  };

  const handleCustomerSave = async (newCustomer) => {
    try {
      const result = await createCustomer(newCustomer).unwrap();
      setFormData((prev) => ({ ...prev, createdFor: result.data.customerId }));
      setShowAddCustomerModal(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create customer.");
    }
  };

  const handleAddressSave = async (newAddressId) => {
    setFormData((prev) => ({ ...prev, shipTo: newAddressId }));
    setShowAddAddressModal(false);
    await refetchAddresses();
    if (useBillingAddress) {
      setUseBillingAddress(true);
    }
  };

  // Loading State
  if (
    isOrderLoading ||
    isTeamsLoading ||
    isCustomersLoading ||
    isUsersLoading ||
    isProfileLoading ||
    (!isEditMode && isAllOrdersLoading)
  ) {
    return (
      <FormContainer>
        <Spin tip="Loading data..." />
      </FormContainer>
    );
  }

  // Error State
  if (
    orderError ||
    customersError ||
    usersError ||
    profileError ||
    allOrdersError ||
    addressesError
  ) {
    return (
      <FormContainer>
        <Alert variant="danger">
          Error loading data:{" "}
          {orderError?.data?.message ||
            customersError?.data?.message ||
            usersError?.data?.message ||
            profileError?.data?.message ||
            allOrdersError?.data?.message ||
            addressesError?.data?.message ||
            "Unknown error"}
          . Please try again.
        </Alert>
      </FormContainer>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <FormContainer>
          <HeaderContainer>
            <div>
              <Typography.Title level={4}>
                {isEditMode ? "Edit Order" : "Add New Order"}
              </Typography.Title>
              <Typography.Text type="secondary">
                Fill out the order details
              </Typography.Text>
            </div>
            <Space>
              <Avatar
                name={user.name || "Unknown User"}
                size="32"
                round={true}
                title={`Created by ${user.name || "Unknown User"}`}
              />
              <Link to="/orders/list" className="btn btn-secondary">
                <FaArrowLeft /> Back
              </Link>
              <BootstrapButton variant="outline-secondary" onClick={clearForm}>
                Clear
              </BootstrapButton>
            </Space>
          </HeaderContainer>

          <Form onSubmit={handleSubmit}>
            <Row gutter={[16, 12]}>
              {/* Customer Section */}
              <Col xs={24} md={12}>
                <FormSection>
                  <Text strong>
                    Customer <span style={{ color: "red" }}>*</span>
                  </Text>
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: "100%" }}
                  >
                    <CompactSelect
                      showSearch
                      value={formData.createdFor || undefined}
                      onChange={(value) => {
                        handleChange("createdFor", value);
                        handleChange("shipTo", null);
                        setUseBillingAddress(false);
                      }}
                      onSearch={debouncedCustomerSearch}
                      placeholder="Select a customer"
                      loading={isCustomersLoading}
                      disabled={isCustomersLoading || customersError}
                      filterOption={false}
                      aria-label="Select customer"
                    >
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <Option
                            key={customer.customerId}
                            value={customer.customerId}
                          >
                            {customer.name} ({customer.email})
                          </Option>
                        ))
                      ) : (
                        <Option value="" disabled>
                          No customers available
                        </Option>
                      )}
                    </CompactSelect>
                    <ActionButton
                      type="link"
                      icon={<UserAddOutlined />}
                      onClick={handleAddCustomer}
                      aria-label="Add new customer"
                    >
                      Add Customer
                    </ActionButton>
                  </Space>
                </FormSection>
              </Col>

              {/* Shipping Address */}
              <Col xs={24} md={12}>
                <FormSection>
                  <Text strong>
                    Shipping Address <span style={{ color: "red" }}>*</span>
                  </Text>
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: "100%" }}
                  >
                    <CompactSelect
                      value={
                        useBillingAddress
                          ? "sameAsBilling"
                          : formData.shipTo || undefined
                      }
                      onChange={handleAddressChange}
                      placeholder="Select shipping address"
                      loading={addressesLoading || isCreatingAddress}
                      disabled={
                        !formData.createdFor ||
                        addressesLoading ||
                        addressesError ||
                        isCreatingAddress
                      }
                      aria-label="Select shipping address"
                    >
                      {formData.createdFor && defaultAddress && (
                        <Option value="sameAsBilling">
                          Same as Billing Address
                        </Option>
                      )}
                      {!formData.createdFor ? (
                        <Option disabled>Please select a customer first</Option>
                      ) : addressesLoading || isCreatingAddress ? (
                        <Option disabled>Loading addresses...</Option>
                      ) : addressesError ? (
                        <Option disabled>
                          Error:{" "}
                          {addressesError?.data?.message || "Unknown error"}
                        </Option>
                      ) : filteredAddresses.length === 0 ? (
                        <Option disabled>No addresses available</Option>
                      ) : (
                        filteredAddresses.map((address) => (
                          <Option
                            key={address.addressId}
                            value={address.addressId}
                          >
                            {`${address.street}, ${address.city}, ${
                              address.state || ""
                            }, ${address.postalCode}, ${
                              address.country || "India"
                            }`}
                          </Option>
                        ))
                      )}
                    </CompactSelect>
                    {useBillingAddress && defaultAddress && (
                      <Text type="secondary">
                        {`${defaultAddress.street}, ${defaultAddress.city}, ${
                          defaultAddress.state || ""
                        }, ${
                          defaultAddress.postalCode || defaultAddress.zip || ""
                        }, ${defaultAddress.country || "India"}`}
                      </Text>
                    )}
                    <ActionButton
                      type="link"
                      icon={<UserAddOutlined />}
                      onClick={() => setShowAddAddressModal(true)}
                      disabled={!formData.createdFor || isCreatingAddress}
                      aria-label="Add new address"
                    >
                      Add Address
                    </ActionButton>
                  </Space>
                </FormSection>
              </Col>

              {/* Order Number */}
              <Col xs={24} md={12}>
                <FormSection>
                  <Text strong>Order Number</Text>
                  <CompactInput
                    value={formData.orderNo || "Generating..."}
                    onChange={(e) => handleChange("orderNo", e.target.value)}
                    placeholder="e.g., 151025101"
                    disabled
                    aria-label="Order number"
                  />
                </FormSection>
              </Col>

              {/* Due Date */}
              <Col xs={24} md={12}>
                <FormSection>
                  <Text strong>
                    Due Date <span style={{ color: "red" }}>*</span>
                  </Text>
                  <CompactDatePicker
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
                    aria-label="Select due date"
                  />
                </FormSection>
              </Col>

              {/* Status */}
              <Col xs={24} md={12}>
                <FormSection>
                  <Text strong>Status</Text>
                  <CompactSelect
                    value={formData.status}
                    onChange={(value) => handleChange("status", value)}
                    placeholder="Select status"
                    aria-label="Select status"
                  >
                    {STATUS_VALUES.map((status) => (
                      <Option key={status} value={status}>
                        {status.charAt(0).toUpperCase() +
                          status.slice(1).toLowerCase().replace("_", " ")}
                      </Option>
                    ))}
                  </CompactSelect>
                </FormSection>
              </Col>

              {/* Priority */}
              <Col xs={24} md={12}>
                <FormSection>
                  <Text strong>Priority</Text>
                  <CompactSelect
                    value={formData.priority || undefined}
                    onChange={(value) => handleChange("priority", value)}
                    placeholder="Select priority"
                    aria-label="Select priority"
                  >
                    <Option value="high">High</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="low">Low</Option>
                  </CompactSelect>
                </FormSection>
              </Col>

              {/* Assignment Type */}
              <Col xs={24}>
                <FormSection>
                  <Text strong>Assigned To</Text>
                  <Radio.Group
                    value={assignmentType}
                    onChange={(e) => {
                      setAssignmentType(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        assignedTeamId:
                          e.target.value === "team" ? prev.assignedTeamId : "",
                        assignedUserId:
                          e.target.value === "users" ? prev.assignedUserId : "",
                        secondaryUserId:
                          e.target.value === "users"
                            ? prev.secondaryUserId
                            : "",
                      }));
                    }}
                    aria-label="Select assignment type"
                  >
                    <Radio value="team">Team</Radio>
                    <Radio value="users">Users</Radio>
                  </Radio.Group>
                </FormSection>
              </Col>

              {/* Team or Users */}
              {assignmentType === "team" ? (
                <Col xs={24}>
                  <FormSection>
                    <Text strong>Team</Text>
                    <Space size={4} style={{ width: "100%" }}>
                      <CompactSelect
                        value={formData.assignedTeamId || undefined}
                        onChange={(value) =>
                          handleChange("assignedTeamId", value)
                        }
                        placeholder="Select team"
                        disabled={isTeamsLoading}
                        aria-label="Select team"
                        style={{ flex: 1 }}
                      >
                        {teams.length > 0 ? (
                          teams.map((team) => (
                            <Option key={team.id} value={team.id}>
                              {team.teamName} (
                              {team.teammembers?.length > 0
                                ? team.teammembers
                                    .map((m) => m.userName)
                                    .join(", ")
                                : "No members"}
                              )
                            </Option>
                          ))
                        ) : (
                          <Option value="" disabled>
                            No teams available
                          </Option>
                        )}
                      </CompactSelect>
                      <Button
                        type="primary"
                        onClick={() => setShowNewTeamModal(true)}
                        aria-label="Add new team"
                      >
                        <PlusOutlined />
                      </Button>
                    </Space>
                  </FormSection>
                </Col>
              ) : (
                <>
                  <Col xs={24} md={12}>
                    <FormSection>
                      <Text strong>Primary User</Text>
                      <CompactSelect
                        value={formData.assignedUserId || undefined}
                        onChange={(value) =>
                          handleChange("assignedUserId", value)
                        }
                        placeholder="Select primary user"
                        disabled={isUsersLoading}
                        aria-label="Select primary user"
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
                      </CompactSelect>
                    </FormSection>
                  </Col>
                  <Col xs={24} md={12}>
                    <FormSection>
                      <Text strong>Secondary User (Optional)</Text>
                      <CompactSelect
                        value={formData.secondaryUserId || undefined}
                        onChange={(value) =>
                          handleChange("secondaryUserId", value)
                        }
                        placeholder="Select secondary user"
                        disabled={isUsersLoading}
                        allowClear
                        aria-label="Select secondary user"
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
                      </CompactSelect>
                    </FormSection>
                  </Col>
                </>
              )}

              {/* Description */}
              <Col xs={24}>
                <FormSection>
                  <Text strong>Description</Text>
                  <CompactTextArea
                    value={formData.description}
                    onChange={(e) => {
                      handleChange("description", e.target.value);
                      setDescriptionLength(e.target.value?.length || 0);
                    }}
                    rows={3}
                    placeholder="Enter description"
                    maxLength={60}
                    aria-label="Enter description"
                  />
                  <Text
                    style={{
                      color: descriptionLength > 60 ? "red" : "inherit",
                    }}
                  >
                    {descriptionLength}/60 Characters
                  </Text>
                </FormSection>
              </Col>

              {/* Advanced Options (Collapsible) */}
              <Col xs={24}>
                <Divider orientation="left">
                  <Button
                    type="link"
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                    aria-controls="advanced-options"
                    aria-expanded={advancedOpen}
                  >
                    Advanced Options {advancedOpen ? "▲" : "▼"}
                  </Button>
                </Divider>
                <Collapse in={advancedOpen}>
                  <div id="advanced-options">
                    <Row gutter={[16, 12]}>
                      <Col xs={24} md={12}>
                        <FormSection>
                          <Text strong>Source Type</Text>
                          <CompactSelect
                            value={formData.sourceType || undefined}
                            onChange={(value) => {
                              handleChange("sourceType", value);
                              if (value) {
                                handleChange("source", "");
                              }
                            }}
                            placeholder="Select source type"
                            allowClear
                            aria-label="Select source type"
                          >
                            {SOURCE_TYPES.map((type) => (
                              <Option key={type} value={type}>
                                {type}
                              </Option>
                            ))}
                          </CompactSelect>
                        </FormSection>
                      </Col>
                      <Col xs={24} md={12}>
                        <FormSection>
                          <Text strong>Source Customer</Text>
                          <CompactSelect
                            value={formData.source || undefined}
                            onChange={(value) => handleChange("source", value)}
                            placeholder="Select source customer"
                            disabled={
                              !formData.sourceType ||
                              isCustomersLoading ||
                              customersError
                            }
                            allowClear
                            aria-label="Select source customer"
                          >
                            {sourceCustomers.length > 0 ? (
                              sourceCustomers.map((customer) => (
                                <Option
                                  key={customer.customerId}
                                  value={customer.customerId}
                                >
                                  {customer.name} ({customer.email})
                                </Option>
                              ))
                            ) : (
                              <Option value="" disabled>
                                {formData.sourceType
                                  ? `No customers for ${formData.sourceType}`
                                  : "Select source type first"}
                              </Option>
                            )}
                          </CompactSelect>
                        </FormSection>
                      </Col>
                      <Col xs={24} md={12}>
                        <FormSection>
                          <Text strong>Quotation Number</Text>
                          <CompactInput
                            value={formData.source || "N/A"}
                            readOnly
                            placeholder="Auto-filled if converted"
                            aria-label="Quotation number"
                          />
                        </FormSection>
                      </Col>
                      <Col xs={24} md={12}>
                        <FormSection>
                          <Text strong>Master Pipeline Number</Text>
                          <CompactSelect
                            value={formData.masterPipelineNo || undefined}
                            onChange={(value) =>
                              handleChange("masterPipelineNo", value)
                            }
                            placeholder="Select master pipeline order"
                            allowClear
                            aria-label="Select master pipeline order"
                          >
                            {orders.length > 0 ? (
                              orders
                                .filter(
                                  (order) =>
                                    order.orderNo &&
                                    order.orderNo !== formData.orderNo
                                )
                                .map((order) => (
                                  <Option
                                    key={order.orderNo}
                                    value={order.orderNo}
                                  >
                                    {order.orderNo}
                                  </Option>
                                ))
                            ) : (
                              <Option disabled>No orders available</Option>
                            )}
                          </CompactSelect>
                        </FormSection>
                      </Col>
                      <Col xs={24} md={12}>
                        <FormSection>
                          <Text strong>Previous Order Number</Text>
                          <CompactSelect
                            value={formData.previousOrderNo || undefined}
                            onChange={(value) =>
                              handleChange("previousOrderNo", value)
                            }
                            placeholder="Select previous order"
                            allowClear
                            aria-label="Select previous order"
                          >
                            {orders.length > 0 ? (
                              orders
                                .filter(
                                  (order) =>
                                    order.orderNo &&
                                    order.orderNo !== formData.orderNo
                                )
                                .map((order) => (
                                  <Option
                                    key={order.orderNo}
                                    value={order.orderNo}
                                  >
                                    {order.orderNo}
                                  </Option>
                                ))
                            ) : (
                              <Option disabled>No orders available</Option>
                            )}
                          </CompactSelect>
                        </FormSection>
                      </Col>
                      {isEditMode && (
                        <Col xs={24} md={12}>
                          <FormSection>
                            <Text strong>Invoice Link</Text>
                            <CompactInput
                              value={formData.invoiceLink || ""}
                              onChange={(e) =>
                                handleChange("invoiceLink", e.target.value)
                              }
                              placeholder="Enter invoice link"
                              disabled={
                                !INVOICE_EDITABLE_STATUSES.includes(
                                  formData.status
                                )
                              }
                              aria-label="Invoice link"
                            />
                          </FormSection>
                        </Col>
                      )}
                      <Col xs={24}>
                        <FormSection>
                          <Text strong>Timeline Dates</Text>
                          {formData.followupDates.map((date, index) => (
                            <Space
                              key={index}
                              align="center"
                              size={4}
                              style={{ marginBottom: 8 }}
                            >
                              <CompactDatePicker
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
                                aria-label={`Select follow-up date ${
                                  index + 1
                                }`}
                              />
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => removeFollowupDate(index)}
                                aria-label="Remove follow-up date"
                              />
                            </Space>
                          ))}
                          <Button
                            type="primary"
                            onClick={addFollowupDate}
                            icon={<PlusOutlined />}
                            aria-label="Add follow-up date"
                          >
                            Add Timeline Date
                          </Button>
                        </FormSection>
                      </Col>
                    </Row>
                  </div>
                </Collapse>
              </Col>

              {/* Submit Buttons */}
              <Col xs={24}>
                <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                  <BootstrapButton
                    variant="secondary"
                    onClick={() => navigate("/orders/list")}
                    disabled={
                      isOrderLoading ||
                      isTeamsLoading ||
                      isCustomersLoading ||
                      isUsersLoading ||
                      isAllOrdersLoading ||
                      addressesLoading
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
                      isAllOrdersLoading ||
                      addressesLoading
                    }
                  >
                    {isEditMode ? "Update Order" : "Create Order"}
                  </BootstrapButton>
                </Space>
              </Col>
            </Row>
          </Form>

          {/* Modals */}
          {showNewTeamModal && (
            <AddNewTeam
              adminName={adminName}
              onClose={() => setShowNewTeamModal(false)}
              onTeamAdded={handleTeamAdded}
              visible={showNewTeamModal}
            />
          )}
          {showAddAddressModal && (
            <AddAddress
              onClose={() => setShowAddAddressModal(false)}
              onSave={handleAddressSave}
              selectedCustomer={formData.createdFor}
            />
          )}
          {showAddCustomerModal && (
            <AddCustomerModal
              visible={showAddCustomerModal}
              onClose={() => setShowAddCustomerModal(false)}
              onSave={handleCustomerSave}
              customer={null}
            />
          )}
        </FormContainer>
      </div>
    </div>
  );
};

export default AddNewOrder;
