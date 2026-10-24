import ModalShell from '../Common/ModalShell';
// components/Brand/BrandParentCategoryFormModal.jsx
import React, { useState, useEffect } from 'react';
import { Form, Input } from 'antd';
import { toast } from 'sonner';
import {
  useCreateBrandParentCategoryMutation,
  useUpdateBrandParentCategoryMutation, // You'll need to add this mutation if not present
} from '../../api/brandParentCategoryApi';

const BrandParentCategoryFormModal = ({ visible, onCancel, editingCategory = null, onSuccess }) => {
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
        toast.success('Brand Parent Category updated successfully');
      } else {
        await createBpc(values).unwrap();
        toast.success('Brand Parent Category created successfully');
      }
      onSuccess?.();
      onCancel();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      title={editingCategory ? 'Edit Brand Category' : 'Add New Brand Category'}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={<>{editingCategory ? 'Update Category' : 'Create Category'}</>}
      onCancelButton={onCancel}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="name"
          label="Category Name"
          rules={[{ required: true, message: 'Name is required' }]}
        >
          <Input placeholder="e.g. CP Fitting, PVC Pipe, etc." />
        </Form.Item>

        <Form.Item
          name="slug"
          label="Slug"
          rules={[
            { required: true, message: 'Slug is required' },
            {
              pattern: /^[a-z0-9-]+$/,
              message: 'Only lowercase, numbers and hyphens allowed',
            },
          ]}
          help="Will be auto-generated from name if left empty"
        >
          <Input placeholder="cp-fitting" />
        </Form.Item>
      </Form>
    </ModalShell>
  );
};

export default BrandParentCategoryFormModal;
