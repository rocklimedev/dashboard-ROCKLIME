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
import { useNavigate, useLocation } from "react-router-dom";
import { Form, Input, Select, Button, Tabs, Row, Col, Spin, Alert } from "antd";
import { ReloadOutlined, ClearOutlined, LeftOutlined } from "@ant-design/icons";

const { TabPane } = Tabs;
const { Option } = Select;

const AddCustomer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const existingCustomer = location.state?.customer || null;

  const [form] = Form.useForm();
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
    gstNumber: "",
  });

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

  // === Calculate Total & Due Date from Invoices ===
  const getInvoiceData = useCallback(() => {
    if (!invoices?.data?.length) return { totalAmount: 0, dueDate: null };

    const total = invoices.data.reduce((sum, invoice) => {
      const amount = parseFloat(invoice.amount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const dueDate =
      invoices.data
        .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
        .map((inv) => inv.dueDate)[0] || null;

    return { totalAmount: total, dueDate };
  }, [invoices]);

  // === Load Edit Data ===
  useEffect(() => {
    if (existingCustomer && invoices) {
      const { totalAmount, dueDate } = getInvoiceData();
      const paid = parseFloat(existingCustomer.paidAmount || 0);
      const balance = totalAmount - paid;

      const updated = {
        ...existingCustomer,
        customerType: existingCustomer.customerType || "",
        phone2: existingCustomer.phone2 || "",
        gstNumber: existingCustomer.gstNumber || "",
        address: existingCustomer.address || {
          street: "",
          city: "",
          state: "",
          zip: "",
        },
        totalAmount: totalAmount.toFixed(2),
        paidAmount: paid.toFixed(2),
        balance: balance < 0 ? "0.00" : balance.toFixed(2),
        dueDate: dueDate || existingCustomer.dueDate || "",
        vendorId: existingCustomer.vendorId || "",
      };

      setFormData(updated);
      form.setFieldsValue(updated);
    }
  }, [existingCustomer, invoices, getInvoiceData, form]);

  // === Update Balance when Paid Amount changes ===
  useEffect(() => {
    if (existingCustomer) {
      const total = parseFloat(formData.totalAmount || 0);
      const paid = parseFloat(formData.paidAmount || 0);
      const balance = total - paid;

      const newBalance = balance < 0 ? "0.00" : balance.toFixed(2);
      setFormData((prev) => ({ ...prev, balance: newBalance }));
      form.setFieldsValue({ balance: newBalance });
    }
  }, [existingCustomer, formData.totalAmount, formData.paidAmount, form]);

  // === Form Change Handler ===
  const handleChange = (changedValues) => {
    if (changedValues.paidAmount && existingCustomer) {
      const paid = parseFloat(changedValues.paidAmount || 0);
      if (changedValues.paidAmount === "" || paid < 0) return;

      const total = parseFloat(formData.totalAmount || 0);
      if (paid > total) {
        toast.error("Paid Amount cannot exceed Total Amount");
        return;
      }
    }

    if (changedValues.isVendor === "false") {
      setFormData((prev) => ({ ...prev, isVendor: "false", vendorId: "" }));
      form.setFieldsValue({ vendorId: "" });
    } else {
      setFormData((prev) => ({ ...prev, ...changedValues }));
    }
  };

  // === Reset to Original (Edit) or Clear (Add) ===
  const resetToOriginal = async () => {
    if (existingCustomer) {
      try {
        const res = await refetch();
        const freshInvoices = res.data;
        const { totalAmount, dueDate } = getInvoiceData();
        const paid = parseFloat(existingCustomer.paidAmount || 0);
        const balance = totalAmount - paid;

        const original = {
          ...existingCustomer,
          customerType: existingCustomer.customerType || "",
          phone2: existingCustomer.phone2 || "",
          gstNumber: existingCustomer.gstNumber || "",
          address: existingCustomer.address || {
            street: "",
            city: "",
            state: "",
            zip: "",
          },
          totalAmount: totalAmount.toFixed(2),
          paidAmount: paid.toFixed(2),
          balance: balance < 0 ? "0.00" : balance.toFixed(2),
          dueDate: dueDate || existingCustomer.dueDate || "",
          vendorId: existingCustomer.vendorId || "",
        };

        setFormData(original);
        form.setFieldsValue(original);
      } catch {
        toast.error("Failed to reload customer data");
      }
    } else {
      clearForm();
    }
  };

  // === Clear All Fields ===
  const clearForm = () => {
    const empty = {
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
      gstNumber: "",
    };

    setFormData(empty);
    form.setFieldsValue(empty);
    toast.info("Form cleared");
  };

  const handleRefresh = async () => {
    await resetToOriginal();
  };

  const handleClear = () => {
    clearForm();
  };

  // === Submit Handler ===
  const handleSubmit = async (values) => {
    try {
      // Duplicate check for Add mode
      if (!existingCustomer && allCustomersData?.data?.length > 0) {
        const isDuplicate = allCustomersData.data.some(
          (cust) =>
            cust.email === values.email.trim() ||
            cust.mobileNumber === values.mobileNumber.trim()
        );
        if (isDuplicate) {
          toast.error(
            "Customer with same email or mobile number already exists."
          );
          return;
        }
      }

      const payload = {
        ...values,
        customerType: values.customerType || null,
        phone2: values.phone2 || null,
        gstNumber: values.gstNumber || null,
        isVendor: values.isVendor === "true",
        totalAmount: existingCustomer ? parseFloat(values.totalAmount) || 0 : 0,
        paidAmount: existingCustomer ? parseFloat(values.paidAmount) || 0 : 0,
        balance: existingCustomer ? parseFloat(values.balance) || 0 : 0,
        address:
          values.address.street ||
          values.address.city ||
          values.address.state ||
          values.address.zip
            ? values.address
            : null,
        invoices: null,
        quotations: null,
        dueDate: values.dueDate || null,
        vendorId:
          values.isVendor === "true" && values.vendorId?.trim()
            ? values.vendorId
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
          {/* Custom Header */}
          <div className="page-header">
            <div className="add-item d-flex">
              <div className="page-title">
                <h4>{existingCustomer ? "Edit Customer" : "Add Customer"}</h4>
                <h6>
                  {existingCustomer
                    ? "Update customer details"
                    : "Create a new customer"}
                </h6>
              </div>
            </div>

            {/* Action Buttons: Refresh & Clear */}
            <ul className="table-top-head">
              <li className="me-2">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRefresh();
                  }}
                  title="Reset to Original"
                >
                  <ReloadOutlined />
                </a>
              </li>
              <li className="me-2">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleClear();
                  }}
                  title="Clear Form"
                >
                  <ClearOutlined />
                </a>
              </li>
            </ul>

            <div className="page-btn">
              <Button
                onClick={() => navigate("/customers/list")}
                className="btn btn-secondary"
              >
                <LeftOutlined /> Back to Customers
              </Button>
            </div>
          </div>

          <div className="card-body">
            {/* Loading States */}
            {isInvoicesLoading && existingCustomer && (
              <Spin tip="Loading invoice data..." className="mb-3 d-block" />
            )}
            {invoicesError && existingCustomer && (
              <Alert
                message="Error"
                description={
                  invoicesError?.data?.message || "Failed to load invoices"
                }
                type="error"
                showIcon
                className="mb-3"
              />
            )}
            {isVendorsLoading && formData.isVendor === "true" && (
              <Spin tip="Loading vendors..." className="mb-3 d-block" />
            )}
            {vendorsError && formData.isVendor === "true" && (
              <Alert
                message="Error"
                description={
                  vendorsError?.data?.message || "Failed to load vendors"
                }
                type="error"
                showIcon
                className="mb-3"
              />
            )}

            {/* Form */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              onValuesChange={handleChange}
              initialValues={formData}
            >
              <Tabs defaultActiveKey="general">
                <TabPane tab="General" key="general">
                  <Row gutter={16}>
                    <Col lg={12} xs={24}>
                      <Form.Item
                        label="Name"
                        name="name"
                        rules={[
                          { required: true, message: "Please enter name" },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>

                    <Col lg={12} xs={24}>
                      <Form.Item label="Customer Type" name="customerType">
                        <Select placeholder="Select Type">
                          <Option value="">Select Type</Option>
                          <Option value="Retail">Retail</Option>
                          <Option value="Architect">Architect</Option>
                          <Option value="Interior">Interior</Option>
                          <Option value="Builder">Builder</Option>
                          <Option value="Contractor">Contractor</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col lg={12} xs={24}>
                      <Form.Item label="Company Name" name="companyName">
                        <Input />
                      </Form.Item>
                    </Col>

                    <Col lg={12} xs={24}>
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                          { required: true, message: "Please enter email" },
                          { type: "email", message: "Enter a valid email" },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>

                    <Col lg={12} xs={24}>
                      <Form.Item
                        label="Phone"
                        name="mobileNumber"
                        rules={[
                          { required: true, message: "Please enter phone" },
                        ]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>

                    <Col lg={12} xs={24}>
                      <Form.Item label="Phone 2" name="phone2">
                        <Input />
                      </Form.Item>
                    </Col>

                    <Col lg={12} xs={24}>
                      <Form.Item label="GST Number" name="gstNumber">
                        <Input placeholder="Enter GST Number" />
                      </Form.Item>
                    </Col>

                    <Col lg={24} xs={24}>
                      <Form.Item label="Address">
                        <Row gutter={16}>
                          <Col lg={12} xs={24}>
                            <Form.Item name={["address", "street"]} noStyle>
                              <Input placeholder="Street" />
                            </Form.Item>
                          </Col>
                          <Col lg={12} xs={24}>
                            <Form.Item name={["address", "city"]} noStyle>
                              <Input placeholder="City" />
                            </Form.Item>
                          </Col>
                          <Col lg={12} xs={24}>
                            <Form.Item name={["address", "state"]} noStyle>
                              <Input placeholder="State" />
                            </Form.Item>
                          </Col>
                          <Col lg={12} xs={24}>
                            <Form.Item name={["address", "zip"]} noStyle>
                              <Input placeholder="ZIP Code" />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Form.Item>
                    </Col>
                  </Row>
                </TabPane>
              </Tabs>

              {/* Submit Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 24,
                }}
              >
                <Button
                  onClick={() => navigate("/customers/list")}
                  style={{ marginRight: 8 }}
                  disabled={isCreating || isEditing}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isCreating || isEditing}
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
                </Button>
              </div>

              {/* Error Alert */}
              {(createError || editError) && (
                <Alert
                  message="Error"
                  description={
                    createError?.data?.message ||
                    editError?.data?.message ||
                    "Error processing request"
                  }
                  type="error"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCustomer;
