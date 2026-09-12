// components/Brand/BrandFormModal.jsx
import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import {
  useCreateBrandMutation,
  useUpdateBrandMutation,
} from "../../api/brandsApi";

const BrandFormModal = ({
  visible,
  onCancel,
  editingBrand = null,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [createBrand] = useCreateBrandMutation();
  const [updateBrand] = useUpdateBrandMutation();
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens/closes or editing changes
  useEffect(() => {
    if (visible) {
      if (editingBrand) {
        form.setFieldsValue({
          brandName: editingBrand.brandName,
          brandSlug: editingBrand.brandSlug,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, editingBrand, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingBrand) {
        await updateBrand({ id: editingBrand.id, ...values }).unwrap();
        message.success("Brand updated successfully");
      } else {
        await createBrand(values).unwrap();
        message.success("Brand created successfully");
      }
      onSuccess?.();
      onCancel();
    } catch (error) {
      message.error(error?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editingBrand ? "Edit Brand" : "Add New Brand"}
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="brandName"
          label="Brand Name"
          rules={[
            { required: true, message: "Brand name is required" },
            { max: 100, message: "Brand name cannot exceed 100 characters" },
          ]}
        >
          <Input placeholder="Enter brand name" />
        </Form.Item>

        <Form.Item
          name="brandSlug"
          label="Brand Slug"
          rules={[
            { required: true, message: "Slug is required" },
            {
              pattern: /^[a-z0-9-]+$/,
              message:
                "Slug can only contain lowercase letters, numbers and hyphens",
            },
          ]}
          help="Example: nike, samsung, cp-fittings"
        >
          <Input placeholder="auto-generated-slug" />
        </Form.Item>

        <div className="d-flex justify-content-end gap-2 mt-4">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {editingBrand ? "Update Brand" : "Create Brand"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default BrandFormModal;
