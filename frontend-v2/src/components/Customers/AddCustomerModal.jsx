// src/components/AddCustomerModal.jsx
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useGetCustomersQuery,
} from "../../api/customerApi";
import { useGetVendorsQuery } from "../../api/vendorApi";
import { message } from "antd";
import {
  Form,
  Input,
  Select,
  Button,
  Tabs,
  Row,
  Col,
  Spin,
  Alert,
  Modal,
} from "antd";

const { TabPane } = Tabs;
const { Option } = Select;

// List of Indian states
const indiaStates = [
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
];

const AddCustomerModal = ({ visible, onClose, customer }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const existingCustomer = customer || null;

  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    customerType: "Retail",
    email: "",
    mobileNumber: "",
    phone2: "",
    gstNumber: "",
    address: { street: "", city: "", state: "", zip: "" },
    isVendor: "false",
    vendorId: "",
  });

  const [createCustomer, { isLoading: isCreating, error: createError }] =
    useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isEditing, error: editError }] =
    useUpdateCustomerMutation();

  const { data: allCustomersData, isLoading: isCustomersLoading } =
    useGetCustomersQuery(undefined, { skip: !visible });

  const { data: vendorsData, isLoading: isVendorsLoading } = useGetVendorsQuery(
    undefined,
    { skip: formData.isVendor !== "true" },
  );

  const vendors = vendorsData?.data || [];

  // Duplicate check only when email or mobile is filled
  useEffect(() => {
    if (!existingCustomer && allCustomersData?.data?.length > 0) {
      const email = (form.getFieldValue("email") || "").trim();
      const mobile = (form.getFieldValue("mobileNumber") || "").trim();

      if (!email && !mobile) return;

      const isDuplicate = allCustomersData.data.some((cust) => {
        const cEmail = (cust.email || "").trim();
        const cMobile = (cust.mobileNumber || "").trim();

        return (email && email === cEmail) || (mobile && mobile === cMobile);
      });

      if (isDuplicate) {
        message.error(
          "Another customer already exists with this email or mobile number.",
        );
      }
    }
  }, [form, existingCustomer, allCustomersData]);

  // Populate form when editing
  useEffect(() => {
    if (existingCustomer) {
      const initial = {
        name: existingCustomer.name || "",
        companyName: existingCustomer.companyName || "",
        customerType: existingCustomer.customerType || "Retail",
        email: existingCustomer.email || "",
        mobileNumber: existingCustomer.mobileNumber || "",
        phone2: existingCustomer.phone2 || "",
        gstNumber: existingCustomer.gstNumber || "",
        address: existingCustomer.address || {
          street: "",
          city: "",
          state: "",
          zip: "",
        },
        isVendor: existingCustomer.isVendor ? "true" : "false",
        vendorId: existingCustomer.vendorId || "",
      };

      setFormData(initial);
      form.setFieldsValue(initial);
    } else {
      form.resetFields();
      setFormData({
        name: "",
        companyName: "",
        customerType: "Retail",
        email: "",
        mobileNumber: "",
        phone2: "",
        gstNumber: "",
        address: { street: "", city: "", state: "", zip: "" },
        isVendor: "false",
        vendorId: "",
      });
    }
  }, [existingCustomer, form]);

  const handleValuesChange = (changedValues) => {
    if ("isVendor" in changedValues) {
      if (changedValues.isVendor === "false") {
        form.setFieldsValue({ vendorId: "" });
      }
    }
    setFormData((prev) => ({ ...prev, ...changedValues }));
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
      // Final duplicate check before submit (in case useEffect didn't catch it)
      if (!existingCustomer && allCustomersData?.data?.length > 0) {
        const email = (values.email || "").trim();
        const mobile = (values.mobileNumber || "").trim();

        if (email || mobile) {
          const isDuplicate = allCustomersData.data.some((cust) => {
            const cEmail = (cust.email || "").trim();
            const cMobile = (cust.mobileNumber || "").trim();
            return (
              (email && email === cEmail) || (mobile && mobile === cMobile)
            );
          });

          if (isDuplicate) {
            message.error(
              "Customer with same email or mobile number already exists.",
            );
            return;
          }
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

      onClose();
    } catch (err) {
      message.error(err?.data?.message || "Failed to save customer");
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={existingCustomer ? "Edit Customer" : "Add New Customer"}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={820}
      destroyOnClose
    >
      <div style={{ padding: "0 8px" }}>
        {(isCustomersLoading || isVendorsLoading) && <Spin tip="Loading..." />}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleValuesChange}
          preserve={false}
        >
          <Tabs defaultActiveKey="general">
            <TabPane tab="General" key="general">
              <Row gutter={[16, 8]}>
                <Col lg={12} xs={24}>
                  <Form.Item
                    label="Name"
                    name="name"
                    rules={[
                      { required: true, message: "Customer name is required" },
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
                    <Select allowClear placeholder="Select customer type">
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
                      { type: "email", message: "Please enter a valid email" },
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
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          if (!/^\d{10}$/.test(value)) {
                            return Promise.reject("Must be exactly 10 digits");
                          }
                          return Promise.resolve();
                        },
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
                    label="Alternate Mobile"
                    name="phone2"
                    rules={[
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          if (!/^\d{10}$/.test(value)) {
                            return Promise.reject("Must be exactly 10 digits");
                          }
                          return Promise.resolve();
                        },
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
                        form.setFieldsValue({ phone2: cleaned || undefined });
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

                <Col span={24}>
                  <Form.Item label="Address">
                    <Row gutter={12}>
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
                            {indiaStates.map((state) => (
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
            <Button onClick={handleCancel} style={{ marginRight: 12 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isCreating || isEditing}
              disabled={
                isCreating ||
                isEditing ||
                isCustomersLoading ||
                isVendorsLoading
              }
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
                "Something went wrong. Please try again."
              }
              type="error"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Form>
      </div>
    </Modal>
  );
};

export default AddCustomerModal;
