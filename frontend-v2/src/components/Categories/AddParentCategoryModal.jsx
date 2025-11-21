import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button } from "antd";
import {
  useCreateParentCategoryMutation,
  useUpdateParentCategoryMutation,
} from "../../api/parentCategoryApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { message } from "antd";
const AddParentCategoryModal = ({
  open,
  onClose,
  editMode = false,
  parentCategoryData = {},
}) => {
  const [form] = Form.useForm();

  const [createParent] = useCreateParentCategoryMutation();
  const [updateParent] = useUpdateParentCategoryMutation();
  const { data: brands } = useGetAllBrandsQuery(); // Removed isLoading

  useEffect(() => {
    if (editMode && parentCategoryData) {
      form.setFieldsValue({
        name: parentCategoryData.name || "",
        slug: parentCategoryData.slug || "",
        brandId: parentCategoryData.brandId || "",
      });
    } else {
      form.resetFields();
    }
  }, [editMode, parentCategoryData, form]);

  const onFinish = async (values) => {
    if (!values.brandId) {
      message.error("Please select a brand");
      return;
    }

    try {
      if (editMode) {
        await updateParent({
          id: parentCategoryData.id,
          ...values,
        }).unwrap();
      } else {
        await createParent(values).unwrap();
      }
      onClose();
    } catch (err) {
      message.error(err?.data?.message || "Operation failed");
    }
  };

  return (
    <Modal
      title={editMode ? "Edit Parent Category" : "Add Parent Category"}
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: "Please enter name" }]}
        >
          <Input placeholder="Enter parent category name" />
        </Form.Item>

        <Form.Item
          name="slug"
          label="Slug"
          rules={[{ required: true, message: "Please enter slug" }]}
        >
          <Input placeholder="e.g., electronics" />
        </Form.Item>

        <Form.Item
          name="brandId"
          label="Brand"
          rules={[{ required: true, message: "Please select a brand" }]}
        >
          <Select
            placeholder="Select brand"
            showSearch
            optionFilterProp="children"
          >
            {brands?.map((brand) => (
              <Select.Option key={brand.id} value={brand.id}>
                {brand.brandName}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {editMode ? "Update" : "Add"}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddParentCategoryModal;
