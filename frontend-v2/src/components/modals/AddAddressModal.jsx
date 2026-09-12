// src/components/AddressModal.jsx  (or wherever you prefer to put modals/forms)
import React from "react";
import { Modal, Form, Input, Button, Row, Col, message } from "antd";

const AddressModal = ({
  open,
  onCancel,
  onFinish,
  initialValues = {},
  title = "Add New Address",
}) => {
  const [form] = Form.useForm();

  // If initialValues change (edit mode), set them in form
  React.useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues, form]);

  const handleSubmit = async (values) => {
    try {
      await onFinish(values);
      form.resetFields();
    } catch (err) {
      message.error(err?.data?.message || "Failed to save address");
    }
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={640}
      destroyOnClose
      afterClose={() => form.resetFields()}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
      >
        <Form.Item
          name="street"
          label="Street Address"
          rules={[{ required: true, message: "Please enter street address" }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="House no, street, landmark..."
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="city"
              label="City"
              rules={[{ required: true, message: "Please enter city" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="state"
              label="State"
              rules={[{ required: true, message: "Please enter state" }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="postalCode" label="PIN Code">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="country" label="Country" initialValue="India">
              <Input disabled />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
          <Button
            onClick={onCancel}
            style={{ marginRight: 12 }}
          >
            Cancel
          </Button>
          <Button type="primary" htmlType="submit">
            {initialValues.addressId ? "Update Address" : "Add Address"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddressModal;