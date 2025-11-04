import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import {
  Form,
  Alert,
  Button as BootstrapButton,
  Collapse,
  Card,
  Table,
} from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import { PlusOutlined, UserAddOutlined } from "@ant-design/icons";
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
  InputNumber,
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
const { Text, Title } = Typography;

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
  "CLOSED",
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

const SummaryCard = styled(Card)`
  margin-top: 16px;
  .ant-card-head {
    background: #f9f9f9;
    font-weight: 600;
  }
  .ant-card-body {
    padding: 12px;
  }
`;

const TotalsTable = styled(Table)`
  margin-top: 8px;
  .ant-table-thead > tr > th {
    background: #f0f2f5;
    font-weight: 600;
    font-size: 13px;
  }
  td {
    font-size: 13px;
  }
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
    invoiceLink: "",
    orderNo: "",
    quotationId: quotationData.quotationId || "",
    masterPipelineNo: null,
    previousOrderNo: null,
    shipTo: null,
    shipping: quotationData.shipping || 0,
    gst: quotationData.gst || 18,
    extraDiscount: quotationData.extraDiscount || 0,
    extraDiscountType: quotationData.extraDiscountType || "fixed",
    amountPaid: 0,
    products: quotationData.products || [],
  });

  // Queries
  const {
    data: orderData,
    isLoading: isOrderLoading,
    error: orderError,
  } = useOrderByIdQuery(id, { skip: !isEditMode });
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

  // Data
  const order = orderData?.order;
  const teams = useMemo(() => teamsData?.teams || [], [teamsData]);
  const customers = useMemo(() => customersData?.data || [], [customersData]);
  const users = useMemo(() => usersData?.users || [], [usersData]);
  const user = profileData?.user || {};
  const orders = useMemo(() => allOrdersData?.orders || [], [allOrdersData]);
  const addresses = useMemo(() => addressesData || [], [addressesData]);

  // State
  const [assignmentType, setAssignmentType] = useState("team");
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState(customers);
  const [descriptionLength, setDescriptionLength] = useState(0);
  const [useBillingAddress, setUseBillingAddress] = useState(false);
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // === FINANCIAL COMPUTATIONS (mirrors backend computeTotals) ===
  const {
    subTotal,
    totalWithShipping,
    gstValue,
    extraDiscountValue,
    finalAmount,
  } = useMemo(() => {
    const subTotal = formData.products.reduce(
      (sum, p) => sum + (p.total ?? 0),
      0
    );
    const totalWithShipping = subTotal + Number(formData.shipping || 0);
    const gstValue = (totalWithShipping * Number(formData.gst || 0)) / 100;

    let extraDiscountValue = 0;
    if (formData.extraDiscount > 0) {
      extraDiscountValue =
        formData.extraDiscountType === "percent"
          ? (totalWithShipping * Number(formData.extraDiscount)) / 100
          : Number(formData.extraDiscount);
    }

    const finalAmount = totalWithShipping + gstValue - extraDiscountValue;

    return {
      subTotal: parseFloat(subTotal.toFixed(2)),
      totalWithShipping: parseFloat(totalWithShipping.toFixed(2)),
      gstValue: parseFloat(gstValue.toFixed(2)),
      extraDiscountValue: parseFloat(extraDiscountValue.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2)),
    };
  }, [
    formData.products,
    formData.shipping,
    formData.gst,
    formData.extraDiscount,
    formData.extraDiscountType,
  ]);

  // Generate Order No
  useEffect(() => {
    if (!isEditMode && !isAllOrdersLoading && allOrdersData) {
      const today = moment().format("DDMMYY");
      const todayOrders = orders.filter((o) =>
        moment(o.createdAt).isSame(moment(), "day")
      );
      const serial = String(todayOrders.length + 101).padStart(3, "0");
      setFormData((prev) => ({ ...prev, orderNo: `${today}${serial}` }));
    }
  }, [isEditMode, isAllOrdersLoading, allOrdersData, orders]);

  // Edit Mode: Load Order
  useEffect(() => {
    if (isEditMode && order) {
      setFormData((prev) => ({
        ...prev,
        ...order,
        products: order.products || [],
        amountPaid: order.amountPaid || 0,
        shipping: order.shipping ?? 0,
        gst: order.gst ?? 18,
        extraDiscount: order.extraDiscount ?? 0,
        extraDiscountType: order.extraDiscountType || "fixed",
      }));
      setDescriptionLength(order.description?.length || 0);
      if (order.assignedTeamId) setAssignmentType("team");
      else if (order.assignedUserId || order.secondaryUserId)
        setAssignmentType("users");
    }
  }, [isEditMode, order]);

  // Set createdBy
  useEffect(() => {
    if (user.userId && !formData.createdBy) {
      setFormData((prev) => ({ ...prev, createdBy: user.userId }));
    }
  }, [user.userId, formData.createdBy]);

  // Sync Billing Address
  useEffect(() => {
    if (
      useBillingAddress &&
      formData.createdFor &&
      !formData.shipTo &&
      !isCreatingAddress
    ) {
      const customer = customers.find(
        (c) => c.customerId === formData.createdFor
      );
      if (customer?.address) {
        const billing = customer.address;
        const match = addresses.find(
          (a) =>
            a.street === billing.street &&
            a.city === billing.city &&
            a.state === billing.state &&
            (a.postalCode || a.zip) === (billing.postalCode || billing.zip) &&
            (a.country || "India") === (billing.country || "India")
        );

        if (match) {
          setFormData((prev) => ({ ...prev, shipTo: match.addressId }));
        } else {
          setIsCreatingAddress(true);
          createAddress({
            customerId: formData.createdFor,
            street: billing.street || "",
            city: billing.city || "",
            state: billing.state || "",
            postalCode: billing.postalCode || billing.zip || "",
            country: billing.country || "India",
            status: "BILLING",
          })
            .unwrap()
            .then((res) => {
              setFormData((prev) => ({ ...prev, shipTo: res.data.addressId }));
            })
            .catch(() => toast.error("Failed to create billing address"))
            .finally(() => setIsCreatingAddress(false));
        }
      }
    }
  }, [
    useBillingAddress,
    formData.createdFor,
    addresses,
    customers,
    createAddress,
    isCreatingAddress,
  ]);

  // Debounced Customer Search
  const debouncedCustomerSearch = useCallback(
    debounce((value) => {
      const filtered = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(value.toLowerCase()) ||
          c.email?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }, 300),
    [customers]
  );

  useEffect(() => {
    setFilteredCustomers(customers);
  }, [customers]);

  // Handlers
  const handleChange = (name, value) => {
    if (name === "description") {
      setDescriptionLength(value.length);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumericChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (value) => {
    if (value === "sameAsBilling") {
      setUseBillingAddress(true);
    } else {
      setUseBillingAddress(false);
      handleChange("shipTo", value);
    }
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.createdFor) return toast.error("Customer is required");
    if (!formData.shipTo && !useBillingAddress)
      return toast.error("Shipping address is required");
    if (formData.amountPaid > finalAmount + 0.01) {
      return toast.error(
        `Amount paid cannot exceed final amount: ₹${finalAmount.toFixed(2)}`
      );
    }

    const payload = {
      ...formData,
      gstValue,
      extraDiscountValue,
      finalAmount,
      amountPaid: Number(formData.amountPaid),
      shipping: Number(formData.shipping),
      gst: Number(formData.gst),
      extraDiscount: Number(formData.extraDiscount),
    };

    try {
      if (isEditMode) {
        await updateOrder({ id, ...payload }).unwrap();
        toast.success("Order updated successfully!");
      } else {
        await createOrder(payload).unwrap();
        toast.success("Order created successfully!");
      }
      navigate("/orders/list");
    } catch (err) {
      const msg = err?.data?.message || "Operation failed";
      toast.error(msg);
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
        <Spin tip="Loading..." />
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
        <Alert variant="danger">Failed to load data. Please try again.</Alert>
      </FormContainer>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <FormContainer>
          <HeaderContainer>
            <div>
              <Title level={4}>
                {isEditMode ? "Edit Order" : "Create Order from Quotation"}
              </Title>
              <Text type="secondary">Convert quotation to order</Text>
            </div>
            <Space>
              <Avatar name={user.name || "You"} size="32" round />
              <Link to="/orders/list" className="btn btn-secondary">
                Back
              </Link>
            </Space>
          </HeaderContainer>

          <Form onSubmit={handleSubmit}>
            <Row gutter={[16, 16]}>
              {/* Customer */}
              <Col xs={24} md={12}>
                <FormSection>
                  <Text strong>
                    Customer <span style={{ color: "red" }}>*</span>
                  </Text>
                  <Select
                    showSearch
                    value={formData.createdFor}
                    onChange={(v) => {
                      handleChange("createdFor", v);
                      handleChange("shipTo", null);
                      setUseBillingAddress(false);
                    }}
                    onSearch={debouncedCustomerSearch}
                    placeholder="Select customer"
                    loading={isCustomersLoading}
                  >
                    {filteredCustomers.map((c) => (
                      <Option key={c.customerId} value={c.customerId}>
                        {c.name} ({c.email})
                      </Option>
                    ))}
                  </Select>
                  <ActionButton
                    type="link"
                    icon={<UserAddOutlined />}
                    onClick={() => setShowAddCustomerModal(true)}
                  >
                    Add Customer
                  </ActionButton>
                </FormSection>
              </Col>

              {/* Shipping Address */}
              <Col xs={24} md={12}>
                <FormSection>
                  <Text strong>
                    Shipping Address <span style={{ color: "red" }}>*</span>
                  </Text>
                  <Select
                    value={
                      useBillingAddress ? "sameAsBilling" : formData.shipTo
                    }
                    onChange={handleAddressChange}
                    placeholder="Select address"
                    loading={addressesLoading || isCreatingAddress}
                    disabled={!formData.createdFor}
                  >
                    {formData.createdFor && (
                      <Option value="sameAsBilling">
                        Same as Billing Address
                      </Option>
                    )}
                    {addresses.map((a) => (
                      <Option key={a.addressId} value={a.addressId}>
                        {a.street}, {a.city}, {a.postalCode || a.zip}
                      </Option>
                    ))}
                  </Select>
                  <ActionButton
                    type="link"
                    icon={<UserAddOutlined />}
                    onClick={() => setShowAddAddressModal(true)}
                    disabled={!formData.createdFor}
                  >
                    Add Address
                  </ActionButton>
                </FormSection>
              </Col>

              {/* Order Info */}
              <Col xs={24} md={8}>
                <FormSection>
                  <Text strong>Order No</Text>
                  <CompactInput value={formData.orderNo} disabled />
                </FormSection>
              </Col>
              <Col xs={24} md={8}>
                <FormSection>
                  <Text strong>
                    Due Date <span style={{ color: "red" }}>*</span>
                  </Text>
                  <CompactDatePicker
                    value={moment(formData.dueDate)}
                    onChange={(d) =>
                      handleChange("dueDate", d?.format("YYYY-MM-DD"))
                    }
                    disabledDate={(c) => c && c < moment().startOf("day")}
                  />
                </FormSection>
              </Col>
              <Col xs={24} md={8}>
                <FormSection>
                  <Text strong>Status</Text>
                  <CompactSelect
                    value={formData.status}
                    onChange={(v) => handleChange("status", v)}
                  >
                    {STATUS_VALUES.map((s) => (
                      <Option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </Option>
                    ))}
                  </CompactSelect>
                </FormSection>
              </Col>

              {/* Products Summary (Read-only) */}
              <Col xs={24}>
                <SummaryCard title="Products (from Quotation)">
                  <Table bordered size="small">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Discount</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.products.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            style={{ textAlign: "center", color: "#999" }}
                          >
                            No products
                          </td>
                        </tr>
                      ) : (
                        formData.products.map((p, i) => (
                          <tr key={i}>
                            <td>{p.name || p.id}</td>
                            <td>₹{Number(p.price).toFixed(2)}</td>
                            <td>{p.quantity}</td>
                            <td>
                              {p.discount}
                              {p.discountType === "percent" ? "%" : ""}
                            </td>
                            <td>₹{Number(p.total).toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </SummaryCard>
              </Col>

              {/* Financial Summary */}
              <Col xs={24}>
                <SummaryCard title="Financial Summary">
                  <TotalsTable bordered size="small">
                    <tbody>
                      <tr>
                        <td>Subtotal</td>
                        <td>₹{subTotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td>Shipping</td>
                        <td>
                          <InputNumber
                            min={0}
                            precision={2}
                            value={formData.shipping}
                            onChange={(v) => handleNumericChange("shipping", v)}
                            style={{ width: 100 }}
                            addonBefore="₹"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td>GST ({formData.gst}%)</td>
                        <td>
                          <InputNumber
                            min={0}
                            max={100}
                            precision={2}
                            value={formData.gst}
                            onChange={(v) => handleNumericChange("gst", v)}
                            style={{ width: 100 }}
                            addonAfter="%"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td>Extra Discount</td>
                        <td>
                          <Space>
                            <InputNumber
                              min={0}
                              precision={2}
                              value={formData.extraDiscount}
                              onChange={(v) =>
                                handleNumericChange("extraDiscount", v)
                              }
                              style={{ width: 100 }}
                              addonBefore="₹"
                            />
                            <Radio.Group
                              value={formData.extraDiscountType}
                              onChange={(e) =>
                                handleChange(
                                  "extraDiscountType",
                                  e.target.value
                                )
                              }
                            >
                              <Radio value="fixed">Fixed</Radio>
                              <Radio value="percent">%</Radio>
                            </Radio.Group>
                          </Space>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Final Amount</strong>
                        </td>
                        <td>
                          <strong>₹{finalAmount.toFixed(2)}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td>Amount Paid</td>
                        <td>
                          <InputNumber
                            min={0}
                            max={finalAmount}
                            precision={2}
                            value={formData.amountPaid}
                            onChange={(v) =>
                              handleNumericChange("amountPaid", v)
                            }
                            style={{ width: 120 }}
                            addonBefore="₹"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </TotalsTable>
                </SummaryCard>
              </Col>

              {/* Advanced Options */}
              <Col xs={24}>
                <Divider orientation="left">
                  <Button
                    type="link"
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                  >
                    Advanced Options {advancedOpen ? "Hide" : "Show"}
                  </Button>
                </Divider>
                <Collapse in={advancedOpen}>
                  <div>
                    <Row gutter={[16, 12]}>
                      {/* Add source, master, timeline, etc. here if needed */}
                    </Row>
                  </div>
                </Collapse>
              </Col>

              {/* Submit */}
              <Col xs={24}>
                <Space style={{ float: "right" }}>
                  <BootstrapButton
                    variant="secondary"
                    onClick={() => navigate("/orders/list")}
                  >
                    Cancel
                  </BootstrapButton>
                  <BootstrapButton variant="primary" type="submit">
                    {isEditMode ? "Update Order" : "Create Order"}
                  </BootstrapButton>
                </Space>
              </Col>
            </Row>
          </Form>

          {/* Modals */}
          {showAddCustomerModal && (
            <AddCustomerModal
              visible
              onClose={() => setShowAddCustomerModal(false)}
              onSave={(c) => {
                setFormData((prev) => ({
                  ...prev,
                  createdFor: c.data.customerId,
                }));
                setShowAddCustomerModal(false);
              }}
            />
          )}
          {showAddAddressModal && (
            <AddAddress
              onClose={() => setShowAddAddressModal(false)}
              onSave={(id) => {
                handleChange("shipTo", id);
                setShowAddAddressModal(false);
                refetchAddresses();
              }}
              selectedCustomer={formData.createdFor}
            />
          )}
          {showNewTeamModal && (
            <AddNewTeam
              onClose={() => setShowNewTeamModal(false)}
              onTeamAdded={(id) => {
                handleChange("assignedTeamId", id);
                refetchTeams();
              }}
              visible
            />
          )}
        </FormContainer>
      </div>
    </div>
  );
};

export default AddNewOrder;
