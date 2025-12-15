import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import {
  PlusOutlined,
  DeleteOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import {
  Select,
  Button,
  Input,
  Radio,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  InputNumber,
  Collapse,
  Alert,
} from "antd";
import { message } from "antd";
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
import DatePicker from "react-datepicker";

const { Option } = Select;
const { Text } = Typography;
const { Panel } = Collapse;

// ────────────────────── QUOTATION → ORDER TRANSFORMER ──────────────────────

/* ────────────────────── Constants ────────────────────── */
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
  "CLOSED",
];
const INVOICE_EDITABLE_STATUSES = [
  "INVOICE",
  "DISPATCHED",
  "DELIVERED",
  "PARTIALLY_DELIVERED",
];

/* ────────────────────── Styled ────────────────────── */
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
  const [createCustomer] = useCreateCustomerMutation();

  const quotationData = location.state?.quotationData || {};
  const [products, setProducts] = useState(
    quotationData.products || [] // ← Pre-fill if from quotation
  );
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
    extraDiscountType: "fixed",
    gst: quotationData.gst ? parseFloat(quotationData.gst) : null,
    extraDiscount: quotationData.extraDiscount
      ? parseFloat(quotationData.extraDiscount)
      : null,
    extraDiscountType: quotationData.extraDiscountType || "fixed",
    shipping: quotationData.shipping ? parseFloat(quotationData.shipping) : 0.0,
  });

  /* ────────────────────── Queries (no loading) ────────────────────── */
  const { data: orderData } = useOrderByIdQuery(id, {
    skip: !isEditMode || !id,
  });
  const { data: teamsData, refetch: refetchTeams } = useGetAllTeamsQuery();
  const { data: customersData } = useGetCustomersQuery();
  const { data: usersData } = useGetAllUsersQuery();
  const { data: profileData } = useGetProfileQuery();
  const { data: allOrdersData } = useGetAllOrdersQuery({ skip: isEditMode });
  const { data: addressesData, refetch: refetchAddresses } =
    useGetAllAddressesQuery(
      { customerId: formData.createdFor },
      { skip: !formData.createdFor }
    );

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

  /* ────────────────────── Local State ────────────────────── */
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

  /* ────────────────────── Memoised Helpers ────────────────────── */
  const filteredAddresses = useMemo(() => {
    if (!formData.createdFor) return [];
    return addresses.filter((a) => a.customerId === formData.createdFor);
  }, [addresses, formData.createdFor]);

  const defaultAddress = useMemo(() => {
    const cust = customers.find((c) => c.customerId === formData.createdFor);
    return cust?.address || null;
  }, [customers, formData.createdFor]);

  const sourceCustomers = useMemo(() => {
    if (!formData.sourceType) return [];
    const type = formData.sourceType.toLowerCase();
    return customers.filter((c) => c.customerType?.toLowerCase() === type);
  }, [customers, formData.sourceType]);

  const { gstValue, extraDiscountValue } = useMemo(() => {
    const subtotal = 0; // placeholder – add product total when needed
    const gst = parseFloat(formData.gst) || 0;
    const gstVal = (subtotal * gst) / 100;

    const disc = parseFloat(formData.extraDiscount) || 0;
    const discVal =
      formData.extraDiscountType === "percent" ? (subtotal * disc) / 100 : disc;

    return {
      gstValue: parseFloat(gstVal.toFixed(2)),
      extraDiscountValue: parseFloat(discVal.toFixed(2)),
    };
  }, [formData.gst, formData.extraDiscount, formData.extraDiscountType]);

  /* ────────────────────── Effects ────────────────────── */
  // generate orderNo
  useEffect(() => {
    if (!isEditMode && allOrdersData !== undefined) {
      const today = moment().format("DDMM25");
      const todayOrders = orders.filter((o) =>
        moment(o.createdAt).isSame(moment(), "day")
      );
      const serial = todayOrders.length + 101;
      setFormData((p) => ({ ...p, orderNo: `${today}${serial}` }));
    }
  }, [isEditMode, allOrdersData, orders]);

  // populate edit mode
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
        shipping: order.shipping ?? 0.0,
        gst: order.gst ?? null,
        extraDiscount: order.extraDiscount ?? null,
        extraDiscountType: order.extraDiscountType || "fixed",
      });
      setDescriptionLength((order.description || "").length);
      setAssignmentType(order.assignedTeamId ? "team" : "users");
    }
  }, [isEditMode, order, user.userId]);

  // set createdBy
  useEffect(() => {
    if (user.userId && formData.createdBy !== user.userId) {
      setFormData((p) => ({ ...p, createdBy: user.userId }));
    }
  }, [user.userId, formData.createdBy]);

  // sync shipTo with billing address
  useEffect(() => {
    if (
      !formData.createdFor ||
      !defaultAddress ||
      isCreatingAddress ||
      !useBillingAddress ||
      formData.shipTo
    )
      return;

    const norm = (s) => (s ? s.trim().toLowerCase() : "");
    const match = filteredAddresses.find((a) => {
      return (
        norm(a.street) === norm(defaultAddress.street) &&
        norm(a.city) === norm(defaultAddress.city) &&
        norm(a.state) === norm(defaultAddress.state) &&
        (norm(a.postalCode || a.zip) ===
          norm(defaultAddress.postalCode || defaultAddress.zip) ||
          norm(a.postalCode || a.zip) ===
            norm(defaultAddress.zip || defaultAddress.postalCode)) &&
        norm(a.country || "India") === norm(defaultAddress.country || "India")
      );
    });

    if (match) {
      handleChange("shipTo", match.addressId);
      return;
    }

    const createBilling = async () => {
      setIsCreatingAddress(true);
      try {
        const newAddr = {
          customerId: formData.createdFor,
          street: defaultAddress.street || "",
          city: defaultAddress.city || "",
          state: defaultAddress.state || "",
          postalCode: defaultAddress.postalCode || defaultAddress.zip || "",
          country: defaultAddress.country || "India",
          status: "BILLING",
        };
        const res = await createAddress(newAddr).unwrap();
        handleChange("shipTo", res.data.addressId);
      } catch (e) {
        message.error(
          `Failed to create billing address: ${
            e.data?.message || "Unknown error"
          }`
        );
        handleChange("shipTo", null);
      } finally {
        setIsCreatingAddress(false);
      }
    };
    createBilling();
  }, [
    useBillingAddress,
    defaultAddress,
    filteredAddresses,
    formData.createdFor,
    formData.shipTo,
    isCreatingAddress,
  ]);

  // debounced customer search
  const debouncedCustomerSearch = useCallback(
    debounce((value) => {
      setCustomerSearch(value);
      if (value) {
        const filtered = customers.filter(
          (c) =>
            c.name.toLowerCase().includes(value.toLowerCase()) ||
            c.email?.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCustomers(filtered);
      } else {
        setFilteredCustomers(customers);
      }
    }, 300),
    [customers]
  );

  useEffect(() => setFilteredCustomers(customers), [customers]);

  /* ────────────────────── Handlers ────────────────────── */
  const handleChange = (name, value) => {
    if (name === "createdBy") return;
    if (name === "description") setDescriptionLength(value.length);
    setFormData((p) => ({ ...p, [name]: value }));
  };
  const handleNumericChange = (name, value) => {
    setFormData((p) => ({ ...p, [name]: value == null ? null : value }));
  };
  const handleTeamAdded = (newTeamId) => {
    setShowNewTeamModal(false);
    setFormData((p) => ({ ...p, assignedTeamId: newTeamId }));
    refetchTeams();
  };
  const handleAddressChange = (value) => {
    if (value === "sameAsBilling") setUseBillingAddress(true);
    else {
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
      shipping: 0.0,
      gst: null,
      extraDiscount: null,
      extraDiscountType: "fixed",
    });
    setAssignmentType("team");
    setCustomerSearch("");
    setFilteredCustomers(customers);
    setDescriptionLength(0);
    setUseBillingAddress(false);
    setAdvancedOpen(false);
  };

  const validateFollowupDates = () => {
    if (!formData.dueDate || !formData.followupDates.length) return true;
    const due = moment(formData.dueDate);
    return formData.followupDates.every(
      (d) => !d || moment(d).isSameOrBefore(due, "day")
    );
  };
  const handleFollowupDateChange = (idx, m) => {
    const dates = [...formData.followupDates];
    dates[idx] = m ? m.format("YYYY-MM-DD") : "";
    if (m && formData.dueDate && m.isAfter(moment(formData.dueDate), "day"))
      message.warning(`Timeline date ${idx + 1} cannot be after due date.`);
    if (m && m.isBefore(moment().startOf("day")))
      message.warning(`Timeline date ${idx + 1} cannot be before today.`);
    setFormData((p) => ({ ...p, followupDates: dates }));
  };
  const addFollowupDate = () =>
    setFormData((p) => ({ ...p, followupDates: [...p.followupDates, null] }));
  const removeFollowupDate = (idx) =>
    setFormData((p) => ({
      ...p,
      followupDates: p.followupDates.filter((_, i) => i !== idx),
    }));

  const momentToDate = (m) => (m && m.isValid() ? m.toDate() : null);
  const dateToMomentStr = (d) => (d ? moment(d).format("YYYY-MM-DD") : "");

  const validateOrderNo = (no) => /^\d{1,2}\d{1,2}25\d{3,}$/.test(no);
  const checkOrderNoUniqueness = useCallback(
    (no, setNew = true) => {
      if (!no || isEditMode) return true;
      const exists = orders.some((o) => o.orderNo === no);
      if (exists && setNew) {
        const today = moment().format("DDMM25");
        const todayOrders = orders.filter((o) =>
          moment(o.createdAt).isSame(moment(), "day")
        );
        const newSerial = todayOrders.length + 102;
        const newNo = `${today}${newSerial}`;
        setFormData((p) => ({ ...p, orderNo: newNo }));
        message.warning(
          `Order number ${no} already exists. Generated ${newNo}`
        );
        return false;
      }
      return !exists;
    },
    [orders, isEditMode]
  );

  useEffect(() => {
    if (!isEditMode && formData.orderNo)
      checkOrderNoUniqueness(formData.orderNo);
  }, [formData.orderNo, isEditMode, checkOrderNoUniqueness]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ---------- validation ----------
    if (!formData.createdFor) return message.error("Please select a Customer.");
    if (
      formData.secondaryUserId &&
      !users.some((u) => u.userId === formData.secondaryUserId)
    )
      return message.error("Selected Secondary User does not exist.");
    if (formData.sourceType && !formData.source)
      return message.error(
        "Please select a Source Customer for the selected Source Type."
      );

    if (assignmentType === "team" && !formData.assignedTeamId)
      return message.error("Please select a Team for assignment.");
    if (assignmentType === "users" && !formData.assignedUserId)
      return message.error(
        "Please select at least a Primary User for assignment."
      );
    if (
      assignmentType === "users" &&
      formData.assignedUserId &&
      formData.secondaryUserId &&
      formData.assignedUserId === formData.secondaryUserId
    )
      return message.error("Primary and Secondary Users cannot be the same.");

    if (!validateOrderNo(formData.orderNo))
      return message.error("Order Number must be DDMM25XXX (e.g., 151025101).");
    if (isEditMode && formData.orderNo !== order?.orderNo)
      return message.error("Order Number cannot be changed in update mode.");
    if (!isEditMode && !checkOrderNoUniqueness(formData.orderNo, false))
      return message.error("Order Number already exists.");

    if (!formData.dueDate) return message.error("Please select a due date.");
    if (!validateFollowupDates())
      return message.error("Timeline dates cannot be after the due date.");

    if (
      formData.masterPipelineNo &&
      !validateOrderNo(formData.masterPipelineNo)
    )
      return message.error("Master Pipeline Number must be DDMM25XXX.");
    if (formData.previousOrderNo && !validateOrderNo(formData.previousOrderNo))
      return message.error("Previous Order Number must be DDMM25XXX.");

    if (
      formData.masterPipelineNo &&
      orders.every((o) => o.orderNo !== formData.masterPipelineNo)
    )
      return message.error(
        "Master Pipeline Number does not match any existing order."
      );
    if (
      formData.previousOrderNo &&
      orders.every((o) => o.orderNo !== formData.previousOrderNo)
    )
      return message.error(
        "Previous Order Number does not match any existing order."
      );

    if (!formData.shipTo && !useBillingAddress)
      return message.error("Please select a shipping address.");

    // ---------- payload ----------
    const sanitize = (v) => (v === "" || v == null ? null : v);
    const payload = {
      createdFor: formData.createdFor,
      createdBy: formData.createdBy,
      products:
        quotationData.products && quotationData.products.length > 0
          ? quotationData.products // ← Already correctly transformed in QuotationList
          : products.length > 0
          ? products
          : [],
      assignedTeamId:
        assignmentType === "team" && formData.assignedTeamId
          ? formData.assignedTeamId
          : null,
      assignedUserId:
        assignmentType === "users" && formData.assignedUserId
          ? formData.assignedUserId
          : null,
      secondaryUserId:
        assignmentType === "users" && formData.secondaryUserId
          ? formData.secondaryUserId
          : null,
      status: formData.status,
      dueDate: formData.dueDate || null,
      followupDates: formData.followupDates.filter(
        (d) => d && moment(d).isValid()
      ),
      source: sanitize(formData.source),
      sourceType: sanitize(formData.sourceType),
      priority: formData.priority || null,
      description: formData.description || null,
      invoiceLink: isEditMode ? formData.invoiceLink || null : null,
      orderNo: formData.orderNo,
      quotationId: sanitize(formData.quotationId),
      masterPipelineNo: sanitize(formData.masterPipelineNo),
      previousOrderNo: sanitize(formData.previousOrderNo),
      shipTo: sanitize(formData.shipTo),
      shipping: parseFloat(formData.shipping) || 0.0,
      gst: (() => {
        if (
          formData.gst === null ||
          formData.gst === undefined ||
          formData.gst === ""
        ) {
          return null;
        }
        const parsed = parseFloat(formData.gst);
        return isNaN(parsed) || parsed < 0 || parsed > 100 ? null : parsed;
      })(),
      // Only include discount fields if a valid discount exists
      ...(formData.extraDiscount != null &&
      formData.extraDiscount !== "" &&
      parseFloat(formData.extraDiscount) > 0
        ? {
            extraDiscount: parseFloat(formData.extraDiscount),
            extraDiscountType: formData.extraDiscountType || "fixed",
          }
        : {
            extraDiscount: null,
            extraDiscountType: null,
          }),
    };
    console.log(formData.gst);
    try {
      if (isEditMode) {
        if (!id) return message.error("Invalid order ID.");
        await updateOrder({ id, ...payload }).unwrap();
      } else {
        await createOrder(payload).unwrap();
      }
      navigate("/orders/list");
    } catch (err) {
      const msg =
        err?.status === 400
          ? `Bad Request: ${err.data?.message || "Invalid data."}`
          : err?.status === 404
          ? `Not Found: ${err.data?.message || "Resource not found."}`
          : err?.status === 500
          ? "Server error."
          : "Something went wrong.";
      console.error(err);
      message.error(msg);
    }
  };

  const handleAddCustomer = () => setShowAddCustomerModal(true);
  const handleCustomerSave = async (newCust) => {
    try {
      const res = await createCustomer(newCust).unwrap();
      setFormData((p) => ({ ...p, createdFor: res.data.customerId }));
      setShowAddCustomerModal(false);
    } catch (e) {
      message.error(e?.data?.message || "Failed to create customer.");
    }
  };
  const handleAddressSave = async (newId) => {
    setFormData((p) => ({ ...p, shipTo: newId }));
    setShowAddAddressModal(false);
    await refetchAddresses();
    if (useBillingAddress) setUseBillingAddress(true);
  };

  /* ────────────────────── JSX (no loading UI) ────────────────────── */
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
              <Link to="/orders/list">
                <Button type="default">Back</Button>
              </Link>
              <Button type="default" onClick={clearForm}>
                Clear
              </Button>
            </Space>
          </HeaderContainer>

          <form onSubmit={handleSubmit}>
            <Row gutter={[16, 12]}>
              {/* ---------- Customer ---------- */}
              <Col xs={24} md={12}>
                <FormSection>
                  <Text strong>
                    Customer <span style={{ color: "red" }}>*</span>
                  </Text>
                  <Space direction="horizontal" style={{ width: "100%" }}>
                    <CompactSelect
                      showSearch
                      value={formData.createdFor || undefined}
                      onChange={(v) => {
                        handleChange("createdFor", v);
                        handleChange("shipTo", null);
                        setUseBillingAddress(false);
                      }}
                      onSearch={debouncedCustomerSearch}
                      placeholder="Select a customer"
                      filterOption={false}
                      style={{ flex: 1 }}
                    >
                      {filteredCustomers.length ? (
                        filteredCustomers.map((c) => (
                          <Option key={c.customerId} value={c.customerId}>
                            {c.name} ({c.email})
                          </Option>
                        ))
                      ) : (
                        <Option disabled>No customers available</Option>
                      )}
                    </CompactSelect>

                    <Button type="primary" onClick={handleAddCustomer}>
                      +
                    </Button>
                  </Space>
                </FormSection>
              </Col>

              {/* ---------- Shipping Address ---------- */}
              <Col xs={24} md={12}>
                <FormSection>
                  <Text strong>
                    Shipping Address <span style={{ color: "red" }}>*</span>
                  </Text>
                  <Space direction="horizontal" style={{ width: "100%" }}>
                    <CompactSelect
                      value={
                        useBillingAddress
                          ? "sameAsBilling"
                          : formData.shipTo || undefined
                      }
                      onChange={handleAddressChange}
                      placeholder="Select shipping address"
                      disabled={!formData.createdFor}
                      style={{ flex: 1 }}
                    >
                      {formData.createdFor && defaultAddress && (
                        <Option value="sameAsBilling">
                          Same as Billing Address
                        </Option>
                      )}
                      {!formData.createdFor ? (
                        <Option disabled>Please select a customer first</Option>
                      ) : filteredAddresses.length === 0 ? (
                        <Option disabled>No addresses available</Option>
                      ) : (
                        filteredAddresses.map((a) => (
                          <Option key={a.addressId} value={a.addressId}>
                            {`${a.street}, ${a.city}, ${a.state || ""}, ${
                              a.postalCode
                            }, ${a.country || "India"}`}
                          </Option>
                        ))
                      )}
                    </CompactSelect>

                    <Button
                      type="primary"
                      onClick={() => setShowAddAddressModal(true)}
                      disabled={!formData.createdFor}
                    >
                      +
                    </Button>
                  </Space>
                </FormSection>
              </Col>

              {/* ---------- Order Number ---------- */}
              <Col xs={24} md={12}>
                <FormSection>
                  <Text strong>Order Number</Text>
                  <CompactInput
                    value={formData.orderNo || "Generating..."}
                    disabled
                  />
                </FormSection>
              </Col>

              {/* ---------- Due Date ---------- */}
              <Col xs={24} md={12}>
                <FormSection>
                  <Text strong>
                    Due Date <span style={{ color: "red" }}>*</span>
                  </Text>
                  <DatePicker
                    selected={momentToDate(moment(formData.dueDate))}
                    onChange={(d) =>
                      handleChange("dueDate", dateToMomentStr(d))
                    }
                    dateFormat="yyyy-MM-dd"
                    minDate={new Date()}
                    placeholderText="yyyy-mm-dd"
                    className="ant-input"
                    wrapperClassName="w-100"
                    customInput={<CompactInput />}
                  />
                </FormSection>
              </Col>

              {/* ---------- Status ---------- */}
              <Col xs={24} md={12}>
                <FormSection>
                  <Text strong>Status</Text>
                  <CompactSelect
                    value={formData.status}
                    onChange={(v) => handleChange("status", v)}
                    placeholder="Select status"
                  >
                    {STATUS_VALUES.map((s) => (
                      <Option key={s} value={s}>
                        {s.charAt(0) +
                          s.slice(1).toLowerCase().replace("_", " ")}
                      </Option>
                    ))}
                  </CompactSelect>
                </FormSection>
              </Col>

              {/* ---------- Priority ---------- */}
              <Col xs={24} md={12}>
                <FormSection>
                  <Text strong>Priority</Text>
                  <CompactSelect
                    value={formData.priority || undefined}
                    onChange={(v) => handleChange("priority", v)}
                    placeholder="Select priority"
                  >
                    <Option value="high">High</Option>
                    <Option value="medium">Medium</Option>
                    <Option value="low">Low</Option>
                  </CompactSelect>
                </FormSection>
              </Col>

              {/* ---------- Assignment Type ---------- */}
              <Col xs={24}>
                <FormSection>
                  <Text strong>Assigned To</Text>
                  <Radio.Group
                    value={assignmentType}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAssignmentType(value);

                      setFormData((p) => ({
                        ...p,
                        ...(value === "team"
                          ? { assignedUserId: "", secondaryUserId: "" }
                          : { assignedTeamId: "" }),
                      }));
                    }}
                  >
                    <Radio value="team">Team</Radio>
                    <Radio value="users">Users</Radio>
                  </Radio.Group>
                </FormSection>
              </Col>

              {/* ---------- Team / Users ---------- */}
              {assignmentType === "team" ? (
                <Col xs={24}>
                  <FormSection>
                    <Text strong>Team</Text>
                    <Space size={4} style={{ width: "100%" }}>
                      <CompactSelect
                        value={formData.assignedTeamId || undefined}
                        onChange={(v) => handleChange("assignedTeamId", v)}
                        placeholder="Select team"
                        style={{ flex: 1 }}
                      >
                        {teams.length ? (
                          teams.map((t) => (
                            <Option key={t.id} value={t.id}>
                              {t.teamName} (
                              {t.teammembers?.length
                                ? t.teammembers
                                    .map((m) => m.userName)
                                    .join(", ")
                                : "No members"}
                              )
                            </Option>
                          ))
                        ) : (
                          <Option disabled>No teams available</Option>
                        )}
                      </CompactSelect>
                      <Button
                        type="primary"
                        onClick={() => setShowNewTeamModal(true)}
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
                      <Text strong>
                        Primary User <span style={{ color: "red" }}>*</span>
                      </Text>
                      <CompactSelect
                        value={formData.assignedUserId || undefined}
                        onChange={(v) => handleChange("assignedUserId", v)}
                        placeholder="Select primary user"
                      >
                        {users
                          .filter((u) => u.userId !== formData.secondaryUserId)
                          .map((u) => (
                            <Option key={u.userId} value={u.userId}>
                              {u.name || "—"}
                            </Option>
                          ))}
                        {users.length === 0 && (
                          <Option disabled>No users available</Option>
                        )}
                      </CompactSelect>
                    </FormSection>
                  </Col>
                  <Col xs={24} md={12}>
                    <FormSection>
                      <Text strong>Secondary User (Optional)</Text>
                      <CompactSelect
                        value={formData.secondaryUserId || undefined}
                        onChange={(v) => handleChange("secondaryUserId", v)}
                        placeholder="Select secondary user"
                        allowClear
                        disabled={!formData.assignedUserId}
                      >
                        {users
                          .filter((u) => u.userId !== formData.assignedUserId)
                          .map((u) => (
                            <Option key={u.userId} value={u.userId}>
                              {u.name || "—"}
                            </Option>
                          ))}
                        {users.length === 0 && (
                          <Option disabled>No users available</Option>
                        )}
                      </CompactSelect>
                    </FormSection>
                  </Col>
                </>
              )}

              {/* ---------- Description ---------- */}
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

              {/* ---------- Advanced Options ---------- */}
              <Col xs={24}>
                <Divider orientation="left">
                  <Button
                    type="link"
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                  >
                    Advanced Options {advancedOpen ? "Hide" : "Show"}
                  </Button>
                </Divider>
                <Collapse activeKey={advancedOpen ? ["1"] : []}>
                  <Panel header="" key="1">
                    <Row gutter={[16, 12]}>
                      {/* Source Type & Customer */}
                      <Col xs={24} md={12}>
                        <FormSection>
                          <Text strong>Source Type</Text>
                          <CompactSelect
                            value={formData.sourceType || undefined}
                            onChange={(v) => {
                              handleChange("sourceType", v);
                              handleChange("source", "");
                            }}
                            placeholder="Select source type"
                            allowClear
                          >
                            {SOURCE_TYPES.map((t) => (
                              <Option key={t} value={t}>
                                {t}
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
                            onChange={(v) => handleChange("source", v)}
                            placeholder="Select source customer"
                            disabled={!formData.sourceType}
                            allowClear
                          >
                            {sourceCustomers.map((c) => (
                              <Option key={c.customerId} value={c.customerId}>
                                {c.name} ({c.email})
                              </Option>
                            ))}
                          </CompactSelect>
                        </FormSection>
                      </Col>

                      {/* Master & Previous */}
                      <Col xs={24} md={12}>
                        <FormSection>
                          <Text strong>Master Pipeline Number</Text>
                          <CompactSelect
                            value={formData.masterPipelineNo || undefined}
                            onChange={(v) =>
                              handleChange("masterPipelineNo", v)
                            }
                            placeholder="Select master order"
                            allowClear
                          >
                            {orders
                              .filter(
                                (o) =>
                                  o.orderNo && o.orderNo !== formData.orderNo
                              )
                              .map((o) => (
                                <Option key={o.orderNo} value={o.orderNo}>
                                  {o.orderNo}
                                </Option>
                              ))}
                          </CompactSelect>
                        </FormSection>
                      </Col>
                      <Col xs={24} md={12}>
                        <FormSection>
                          <Text strong>Previous Order Number</Text>
                          <CompactSelect
                            value={formData.previousOrderNo || undefined}
                            onChange={(v) => handleChange("previousOrderNo", v)}
                            placeholder="Select previous order"
                            allowClear
                          >
                            {orders
                              .filter(
                                (o) =>
                                  o.orderNo && o.orderNo !== formData.orderNo
                              )
                              .map((o) => (
                                <Option key={o.orderNo} value={o.orderNo}>
                                  {o.orderNo}
                                </Option>
                              ))}
                          </CompactSelect>
                        </FormSection>
                      </Col>

                      {/* Shipping, GST, Discount */}
                      <Col xs={24} md={12}>
                        <FormSection>
                          <Text strong>Shipping Cost</Text>
                          <InputNumber
                            min={0}
                            step={0.01}
                            precision={2}
                            style={{ width: "100%" }}
                            value={formData.shipping}
                            onChange={(v) => handleNumericChange("shipping", v)}
                            placeholder="0.00"
                            addonBefore="₹"
                          />
                        </FormSection>
                      </Col>
                      <Col xs={24} md={12}>
                        <FormSection>
                          <Text strong>GST (%)</Text>
                          <InputNumber
                            min={0}
                            max={100}
                            step={0.01}
                            precision={2}
                            style={{ width: "100%" }}
                            value={formData.gst}
                            onChange={(v) => handleNumericChange("gst", v)}
                            placeholder="18.00"
                            addonAfter="%"
                          />
                        </FormSection>
                      </Col>
                      <Col xs={24} md={12}>
                        <FormSection>
                          <Text strong>Extra Discount</Text>
                          <InputNumber
                            value={formData.extraDiscount}
                            onChange={(v) => {
                              handleNumericChange("extraDiscount", v);
                            }}
                            min={0}
                            precision={2}
                            stringMode={false}
                          />
                        </FormSection>
                      </Col>
                      <Col xs={24} md={12}>
                        <FormSection>
                          <Text strong>Discount Type</Text>
                          <Radio.Group
                            value={formData.extraDiscountType}
                            onChange={(e) =>
                              handleChange("extraDiscountType", e.target.value)
                            }
                          >
                            <Radio value="fixed">Fixed (₹)</Radio>
                            <Radio value="percent">Percent (%)</Radio>
                          </Radio.Group>
                        </FormSection>
                      </Col>

                      {/* Invoice Link (edit only) */}
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
                            />
                          </FormSection>
                        </Col>
                      )}

                      {/* Timeline Dates */}
                      <Col xs={24}>
                        <FormSection>
                          <Text strong>Timeline Dates</Text>
                          {formData.followupDates.map((d, i) => (
                            <Space
                              key={i}
                              align="center"
                              size={4}
                              style={{ marginBottom: 8, width: "100%" }}
                            >
                              <DatePicker
                                selected={momentToDate(moment(d))}
                                onChange={(date) =>
                                  handleFollowupDateChange(i, moment(date))
                                }
                                dateFormat="yyyy-MM-dd"
                                minDate={new Date()}
                                maxDate={
                                  formData.dueDate
                                    ? moment(formData.dueDate).toDate()
                                    : null
                                }
                                placeholderText="yyyy-mm-dd"
                                className="ant-input"
                                wrapperClassName="w-100"
                                customInput={<CompactInput />}
                              />
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => removeFollowupDate(i)}
                              />
                            </Space>
                          ))}
                          <Button
                            type="primary"
                            onClick={addFollowupDate}
                            icon={<PlusOutlined />}
                          >
                            Add Timeline Date
                          </Button>
                        </FormSection>
                      </Col>
                    </Row>
                  </Panel>
                </Collapse>
              </Col>

              {/* ---------- Submit ---------- */}
              <Col xs={24}>
                <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                  <Button
                    type="default"
                    onClick={() => navigate("/orders/list")}
                  >
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit">
                    {isEditMode ? "Update Order" : "Create Order"}
                  </Button>
                </Space>
              </Col>
            </Row>
          </form>

          {/* ---------- Modals ---------- */}
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
