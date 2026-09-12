// src/components/modals/CreateProductModal.jsx
import React from "react";
import { Modal, Form, Input, InputNumber, Select, Button, message } from "antd";
import { useCreateProductMutation } from "../../api/productApi";

const { Option } = Select;

const CreateProductModal = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [createProduct, { isLoading }] = useCreateProductMutation();

  const handleSubmit = async (values) => {
    const formData = new FormData();

    formData.append("name", values.name.trim());
    formData.append("product_code", values.product_code.trim());
    formData.append("quantity", Number(values.quantity) || 0);
    formData.append("status", values.status);

    // Required defaults
    formData.append("isMaster", false);
    formData.append("isFeatured", false);

    try {
      const result = await createProduct(formData).unwrap();

      message.success(`Product "${values.name}" created successfully!`);

      form.resetFields();
      onSuccess?.(result?.product || result?.data || result); // Pass created product if needed
      onClose();
    } catch (err) {
      console.error(err);
      message.error(err?.data?.message || "Failed to create product");
    }
  };

  return (
    <Modal
      title="Create Optional Product"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={620}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: "active",
          quantity: 1,
        }}
      >
        <Form.Item
          name="name"
          label="Product Name"
          rules={[{ required: true, message: "Product name is required" }]}
        >
          <Input placeholder="Enter product name" />
        </Form.Item>

        <Form.Item
          name="product_code"
          label="Product Code"
          rules={[
            { required: true, message: "Product code is required" },
            { whitespace: true, message: "Product code cannot be empty" },
          ]}
        >
          <Input placeholder="e.g. OPT-2026-001" />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Quantity"
          rules={[{ required: true, message: "Quantity is required" }]}
        >
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
            <Option value="out_of_stock">Out of Stock</Option>
          </Select>
        </Form.Item>

        <div
          style={{
            display: "flex",
            justifyContent: "end",
            gap: 12,
            marginTop: 24,
          }}
        >
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            Create Product
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateProductModal;
