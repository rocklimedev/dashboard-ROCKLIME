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
import PageHeader from "../Common/PageHeader";

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

  const getInvoiceData = useCallback(() => {
    if (!invoices?.data?.length) return { totalAmount: 0, dueDate: null };

    const total = invoices.data.reduce((sum, invoice) => {
      const payableAmount = parseFloat(invoice.amount || 0);
      return sum + (isNaN(payableAmount) ? 0 : payableAmount);
    }, 0);

    const dueDate =
      invoices.data.sort(
        (a, b) => new Date(b.dueDate) - new Date(a.dueDate)
      )?.[0]?.dueDate || null;

    return { totalAmount: total, dueDate };
  }, [invoices]);

  useEffect(() => {
    if (!existingCustomer && allCustomersData?.data?.length > 0) {
      const isDuplicate = allCustomersData.data.some(
        (cust) =>
          cust.email === formData.email.trim() ||
          cust.mobileNumber === formData.mobileNumber.trim()
      );

      if (isDuplicate) {
        toast.error(
          "Customer with same email or mobile number already exists."
        );
      }
    }
  }, [
    existingCustomer,
    allCustomersData,
    formData.email,
    formData.mobileNumber,
  ]);

  useEffect(() => {
    if (existingCustomer && invoices) {
      const { totalAmount, dueDate } = getInvoiceData();
      const paid = parseFloat(existingCustomer.paidAmount || 0);
      const balance = totalAmount - paid;

      const updatedFormData = {
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
        dueDate: dueDate || existingCustomer.dueDate || null,
        invoices: existingCustomer.invoices || [],
        quotations: existingCustomer.quotations || [],
        vendorId: existingCustomer.vendorId || "",
      };

      setFormData(updatedFormData);
      form.setFieldsValue(updatedFormData);
    }
  }, [existingCustomer, invoices, getInvoiceData, form]);

  useEffect(() => {
    if (existingCustomer) {
      const total = parseFloat(formData.totalAmount || 0);
      const paid = parseFloat(formData.paidAmount || 0);
      const balance = total - paid;

      setFormData((prev) => ({
        ...prev,
        balance: balance < 0 ? "0.00" : balance.toFixed(2),
      }));
      form.setFieldsValue({
        balance: balance < 0 ? "0.00" : balance.toFixed(2),
      });
    }
  }, [existingCustomer, formData.totalAmount, formData.paidAmount, form]);

  const handleChange = (changedValues) => {
    if (changedValues.paidAmount && existingCustomer) {
      if (
        changedValues.paidAmount === "" ||
        parseFloat(changedValues.paidAmount) < 0
      )
        return;

      const total = parseFloat(formData.totalAmount || 0);
      const paid = parseFloat(changedValues.paidAmount || 0);
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

  const handleJsonChange = (field, index, key, value) => {
    setFormData((prev) => {
      const updatedArray = [...prev[field]];
      updatedArray[index] = { ...updatedArray[index], [key]: value };
      return { ...prev, [field]: updatedArray };
    });
  };

  const addJsonEntry = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [
        ...prev[field],
        field === "invoices"
          ? { invoiceNo: "", amount: "0.00", dueDate: "" }
          : { quotationNo: "", amount: "0.00", date: "" },
      ],
    }));
  };

  const removeJsonEntry = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (values) => {
    try {
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
          <PageHeader
            title={existingCustomer ? "Edit Customer" : "Add Customer"}
            subtitle={
              existingCustomer
                ? "Update customer details"
                : "Create a new customer"
            }
            exportOptions={{ pdf: false, excel: false }}
            buttonText="Back to Customers"
          />
          <div className="card-body">
            {isInvoicesLoading && existingCustomer && (
              <Spin tip="Loading invoice data..." />
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
              <Spin tip="Loading vendors..." />
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
                          {
                            type: "email",
                            message: "Please enter a valid email",
                          },
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
                          {
                            required: true,
                            message: "Please enter phone number",
                          },
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
