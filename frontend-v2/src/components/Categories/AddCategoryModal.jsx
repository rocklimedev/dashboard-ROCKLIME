import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button } from "antd";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "../../api/categoryApi";
import { useGetAllParentCategoriesQuery } from "../../api/parentCategoryApi";
import { toast } from "sonner";

const AddCategoryModal = ({
  open,
  onClose,
  editMode = false,
  categoryData = {},
}) => {
  const [form] = Form.useForm();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const { data: parentCategoryData } = useGetAllParentCategoriesQuery();

  const parentCategories = parentCategoryData?.data || [];

  useEffect(() => {
    if (editMode && categoryData) {
      form.setFieldsValue({
        name: categoryData.name || "",
        parentCategoryId: categoryData.parentCategoryId || "",
        parentCategory: categoryData.parentCategory || "0",
      });
    } else {
      form.resetFields();
    }
  }, [editMode, categoryData, form]);

  const onFinish = async (values) => {
    try {
      if (editMode) {
        await updateCategory({
          id: categoryData.categoryId,
          ...values,
        }).unwrap();
      } else {
        await createCategory(values).unwrap();
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save category");
    }
  };

  return (
    <Modal
      title={editMode ? "Edit Category" : "Add Category"}
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          parentCategory: "0",
        }}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Please enter category name" }]}
        >
          <Input placeholder="Enter category name" />
        </Form.Item>

        <Form.Item name="parentCategoryId" label="Parent Category">
          <Select placeholder="Select parent category" allowClear>
            {parentCategories.map((cat) => (
              <Select.Option key={cat.id} value={cat.id}>
                {cat.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="parentCategory" label="Parent Category (Legacy)">
          <Select>
            <Select.Option value="1">1</Select.Option>
            <Select.Option value="0">0</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {editMode ? "Update" : "Add"} Category
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddCategoryModal;
