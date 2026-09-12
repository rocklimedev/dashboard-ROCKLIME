import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Button, message, Row, Col } from "antd";
import {
  useCreateProductMetaMutation,
  useUpdateProductMetaMutation,
} from "../../api/productMetaApi";

const { Option } = Select;

const fieldTypeOptions = [
  { label: "String", value: "string" },
  { label: "Number", value: "number" },
  { label: "Text Area", value: "textarea" },
  { label: "Date", value: "date" },
  { label: "Boolean", value: "boolean" },
  { label: "Select", value: "select" },
  { label: "Measurement", value: "measurement" },
];

const ProductMetaFormModal = ({
  visible,
  onCancel,
  editingMeta,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [createProductMeta, { isLoading: isCreating }] =
    useCreateProductMetaMutation();
  const [updateProductMeta, { isLoading: isUpdating }] =
    useUpdateProductMetaMutation();

  const isEditing = !!editingMeta;
  const isLoading = isCreating || isUpdating;

  // Auto-generate slug from title
  const handleTitleChange = (e) => {
    const title = e.target.value;
    if (!isEditing) {
      const generatedSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      form.setFieldsValue({ slug: generatedSlug });
    }
  };

  useEffect(() => {
    if (visible) {
      if (editingMeta) {
        form.setFieldsValue({
          title: editingMeta.title,
          slug: editingMeta.slug,
          fieldType: editingMeta.fieldType,
          unit: editingMeta.unit || "",
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, editingMeta, form]);

  const handleSubmit = async (values) => {
    try {
      if (isEditing) {
        await updateProductMeta({
          id: editingMeta.id,
          ...values,
        }).unwrap();
        message.success("Meta field updated successfully");
      } else {
        await createProductMeta(values).unwrap();
        message.success("Meta field created successfully");
      }

      form.resetFields();
      onSuccess?.();
      onCancel();
    } catch (error) {
      message.error(
        error?.data?.message || "Failed to save meta field. Please try again.",
      );
    }
  };

  return (
    <Modal
      title={isEditing ? "Edit Meta Field" : "Create New Meta Field"}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Title"
              name="title"
              rules={[
                { required: true, message: "Please enter title" },
                { max: 255, message: "Title is too long" },
              ]}
            >
              <Input
                placeholder="e.g., Selling Price, MRP, Length, Color"
                onChange={handleTitleChange}
                size="large"
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="Slug (Unique Identifier)"
              name="slug"
              rules={[
                { required: true, message: "Slug is required" },
                { max: 255, message: "Slug is too long" },
              ]}
            >
              <Input
                placeholder="selling-price, mrp, length"
                disabled={isEditing}
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Field Type"
              name="fieldType"
              rules={[{ required: true, message: "Please select field type" }]}
            >
              <Select placeholder="Select field type" size="large" allowClear>
                {fieldTypeOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Unit (Optional)"
              name="unit"
              rules={[{ max: 100, message: "Unit is too long" }]}
            >
              <Input placeholder="e.g., inch, mm, pcs, kg, box" size="large" />
            </Form.Item>
          </Col>
        </Row>

        <div className="d-flex justify-content-end gap-3 mt-4">
          <Button onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {isEditing ? "Update Meta Field" : "Create Meta Field"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ProductMetaFormModal;
