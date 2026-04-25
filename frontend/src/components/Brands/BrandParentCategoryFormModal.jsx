// components/Brand/BrandParentCategoryFormModal.jsx
import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import {
  useCreateBrandParentCategoryMutation,
  useUpdateBrandParentCategoryMutation, // You'll need to add this mutation if not present
} from "../../api/brandParentCategoryApi";

const BrandParentCategoryFormModal = ({
  visible,
  onCancel,
  editingCategory = null,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [createBpc] = useCreateBrandParentCategoryMutation();
  const [updateBpc] = useUpdateBrandParentCategoryMutation(); // Add this mutation in your API slice
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingCategory) {
        form.setFieldsValue({
          name: editingCategory.name,
          slug: editingCategory.slug,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, editingCategory, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingCategory) {
        await updateBpc({ id: editingCategory.id, ...values }).unwrap();
        message.success("Brand Parent Category updated successfully");
      } else {
        await createBpc(values).unwrap();
        message.success("Brand Parent Category created successfully");
      }
      onSuccess?.();
      onCancel();
    } catch (error) {
      message.error(error?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editingCategory ? "Edit Brand Category" : "Add New Brand Category"}
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="name"
          label="Category Name"
          rules={[{ required: true, message: "Name is required" }]}
        >
          <Input placeholder="e.g. CP Fitting, PVC Pipe, etc." />
        </Form.Item>

        <Form.Item
          name="slug"
          label="Slug"
          rules={[
            { required: true, message: "Slug is required" },
            {
              pattern: /^[a-z0-9-]+$/,
              message: "Only lowercase, numbers and hyphens allowed",
            },
          ]}
          help="Will be auto-generated from name if left empty"
        >
          <Input placeholder="cp-fitting" />
        </Form.Item>

        <div className="d-flex justify-content-end gap-2 mt-4">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {editingCategory ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default BrandParentCategoryFormModal;
