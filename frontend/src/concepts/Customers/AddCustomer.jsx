// src/components/Customers/AddCustomer.jsx   (or wherever your page is)

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useGetCustomersQuery,
} from "../../api/customerApi";
import { useGetVendorsQuery } from "../../api/vendorApi";
import { message } from "antd";
import { Form, Input, Select, Button, Tabs, Row, Col, Spin, Alert } from "antd";
import { LeftOutlined } from "@ant-design/icons";

const { TabPane } = Tabs;
const { Option } = Select;

const sortedStates = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
].sort((a, b) => a.localeCompare(b));

const AddCustomer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const existingCustomer = location.state?.customer || null;

  const [form] = Form.useForm();

  const [createCustomer, { isLoading: isCreating, error: createError }] =
    useCreateCustomerMutation();

  const [updateCustomer, { isLoading: isEditing, error: editError }] =
    useUpdateCustomerMutation();

  const { data: allCustomersData, isLoading: isCustomersLoading } =
    useGetCustomersQuery({ limit: 500 });

  const { data: vendorsData, isLoading: isVendorsLoading } = useGetVendorsQuery(
    undefined,
    { skip: !existingCustomer?.isVendor }, // Only load if needed
  );

  const vendors = vendorsData?.data || [];

  // Populate form when editing
  useEffect(() => {
    if (existingCustomer) {
      const initialValues = {
        name: existingCustomer.name || "",
        companyName: existingCustomer.companyName || "",
        customerType: existingCustomer.customerType || "Retail",
        email: existingCustomer.email || "",
        mobileNumber: existingCustomer.mobileNumber || "",
        phone2: existingCustomer.phone2 || "",
        gstNumber: existingCustomer.gstNumber || "",
        isVendor: existingCustomer.isVendor ? "true" : "false",
        vendorId: existingCustomer.vendorId || "",
        address: existingCustomer.address || {
          street: "",
          city: "",
          state: "",
          zip: "",
        },
      };

      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [existingCustomer, form]);

  const handleValuesChange = (changedValues) => {
    if ("isVendor" in changedValues) {
      if (changedValues.isVendor === "false") {
        form.setFieldsValue({ vendorId: "" });
      }
    }
  };

  const hasAddressContent = (addr) => {
    if (!addr) return false;
    return (
      (addr.street || "").trim() ||
      (addr.city || "").trim() ||
      (addr.state || "").trim() ||
      (addr.zip || "").trim()
    );
  };

  const handleSubmit = async (values) => {
    try {
      // Duplicate check for new customer only
      if (!existingCustomer && allCustomersData?.data?.length > 0) {
        const email = (values.email || "").trim();
        const mobile = (values.mobileNumber || "").trim();

        const isDuplicate = allCustomersData.data.some((cust) => {
          const cEmail = (cust.email || "").trim();
          const cMobile = (cust.mobileNumber || "").trim();
          return (email && email === cEmail) || (mobile && mobile === cMobile);
        });

        if (isDuplicate) {
          message.error(
            "Customer with same email or mobile number already exists.",
          );
          return;
        }
      }

      const payload = {
        name: values.name?.trim(),
        companyName: values.companyName?.trim() || null,
        customerType: values.customerType || null,
        email: values.email?.trim() || null,
        mobileNumber: values.mobileNumber?.trim() || null,
        phone2: values.phone2?.trim() || null,
        gstNumber: values.gstNumber?.trim() || null,
        address: hasAddressContent(values.address) ? values.address : null,
        isVendor: values.isVendor === "true",
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
        message.success("Customer updated successfully");
      } else {
        await createCustomer(payload).unwrap();
        message.success("Customer created successfully");
      }

      navigate("/customers/list");
    } catch (err) {
      message.error(err?.data?.message || "Failed to save customer");
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
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
            {(isCustomersLoading || isVendorsLoading) && (
              <Spin tip="Loading..." className="mb-3 d-block" />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              onValuesChange={handleValuesChange}
              initialValues={{
                customerType: "Retail",
                isVendor: "false",
              }}
            >
              <Tabs defaultActiveKey="general">
                <TabPane tab="General" key="general">
                  <Row gutter={16}>
                    <Col lg={12} xs={24}>
                      <Form.Item
                        label="Name"
                        name="name"
                        rules={[
                          {
                            required: true,
                            message: "Customer name is required",
                          },
                          {
                            max: 100,
                            message: "Name cannot exceed 100 characters",
                          },
                        ]}
                      >
                        <Input
                          placeholder="Full name or business name"
                          allowClear
                        />
                      </Form.Item>
                    </Col>

                    <Col lg={12} xs={24}>
                      <Form.Item label="Customer Type" name="customerType">
                        <Select placeholder="Select customer type">
                          <Option value="Retail">Retail</Option>
                          <Option value="Architect">Architect</Option>
                          <Option value="Interior">Interior</Option>
                          <Option value="Builder">Builder</Option>
                          <Option value="Contractor">Contractor</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col lg={12} xs={24}>
                      <Form.Item
                        label="Company Name"
                        name="companyName"
                        rules={[{ max: 150, message: "Company name too long" }]}
                      >
                        <Input
                          placeholder="Company / Firm name (optional)"
                          allowClear
                        />
                      </Form.Item>
                    </Col>

                    <Col lg={12} xs={24}>
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                          {
                            type: "email",
                            message: "Please enter a valid email",
                          },
                        ]}
                      >
                        <Input
                          placeholder="example@domain.com (optional)"
                          allowClear
                        />
                      </Form.Item>
                    </Col>

                    <Col lg={12} xs={24}>
                      <Form.Item
                        label="Mobile Number"
                        name="mobileNumber"
                        rules={[
                          {
                            pattern: /^\d{10}$/,
                            message: "Mobile number must be exactly 10 digits",
                          },
                        ]}
                      >
                        <Input
                          maxLength={10}
                          placeholder="9876543210 (optional)"
                          allowClear
                          onKeyPress={(e) =>
                            !/[0-9]/.test(e.key) && e.preventDefault()
                          }
                          onBlur={(e) => {
                            const cleaned = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10);
                            form.setFieldsValue({
                              mobileNumber: cleaned || undefined,
                            });
                          }}
                        />
                      </Form.Item>
                    </Col>

                    <Col lg={12} xs={24}>
                      <Form.Item
                        label="Alternate Phone"
                        name="phone2"
                        rules={[
                          {
                            pattern: /^\d{10}$/,
                            message: "Phone 2 must be exactly 10 digits",
                          },
                        ]}
                      >
                        <Input
                          maxLength={10}
                          placeholder="9123456789 (optional)"
                          allowClear
                          onKeyPress={(e) =>
                            !/[0-9]/.test(e.key) && e.preventDefault()
                          }
                          onBlur={(e) => {
                            const cleaned = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10);
                            form.setFieldsValue({
                              phone2: cleaned || undefined,
                            });
                          }}
                        />
                      </Form.Item>
                    </Col>

                    <Col lg={12} xs={24}>
                      <Form.Item label="GST Number" name="gstNumber">
                        <Input
                          placeholder="22AAAAA0000A1Z5 (optional)"
                          allowClear
                        />
                      </Form.Item>
                    </Col>

                    {/* Vendor Section */}
                    <Col lg={12} xs={24}>
                      <Form.Item label="Is Vendor?" name="isVendor">
                        <Select>
                          <Option value="false">No</Option>
                          <Option value="true">Yes</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    {form.getFieldValue("isVendor") === "true" && (
                      <Col lg={12} xs={24}>
                        <Form.Item label="Select Vendor" name="vendorId">
                          <Select
                            placeholder="Select vendor"
                            loading={isVendorsLoading}
                            allowClear
                          >
                            {vendors.map((v) => (
                              <Option key={v.id} value={v.id}>
                                {v.name}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    )}

                    {/* Address */}
                    <Col lg={24} xs={24}>
                      <Form.Item label="Address">
                        <Row gutter={16}>
                          <Col lg={12} xs={24}>
                            <Form.Item name={["address", "street"]} noStyle>
                              <Input placeholder="Street / Area" allowClear />
                            </Form.Item>
                          </Col>
                          <Col lg={12} xs={24}>
                            <Form.Item name={["address", "city"]} noStyle>
                              <Input placeholder="City" allowClear />
                            </Form.Item>
                          </Col>
                          <Col lg={12} xs={24}>
                            <Form.Item name={["address", "state"]} noStyle>
                              <Select
                                showSearch
                                placeholder="State"
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                  option.children
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                                }
                                allowClear
                              >
                                {sortedStates.map((state) => (
                                  <Option key={state} value={state}>
                                    {state}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col lg={12} xs={24}>
                            <Form.Item name={["address", "zip"]} noStyle>
                              <Input placeholder="PIN / ZIP Code" allowClear />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Form.Item>
                    </Col>
                  </Row>
                </TabPane>
              </Tabs>

              <div style={{ textAlign: "right", marginTop: 32 }}>
                <Button
                  onClick={() => navigate("/customers/list")}
                  style={{ marginRight: 12 }}
                  disabled={isCreating || isEditing}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isCreating || isEditing}
                  disabled={isCreating || isEditing || isCustomersLoading}
                >
                  {isCreating || isEditing
                    ? "Saving..."
                    : existingCustomer
                      ? "Update Customer"
                      : "Create Customer"}
                </Button>
              </div>

              {(createError || editError) && (
                <Alert
                  message="Error"
                  description={
                    createError?.data?.message ||
                    editError?.data?.message ||
                    "Something went wrong"
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
