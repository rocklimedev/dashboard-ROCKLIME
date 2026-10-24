import ModalShell from '../Common/ModalShell';
// components/Brand/BrandFormModal.jsx
import React, { useState, useEffect } from 'react';
import { Form, Input } from 'antd';
import { toast } from 'sonner';
import { useCreateBrandMutation, useUpdateBrandMutation } from '../../api/brandsApi';

const BrandFormModal = ({ visible, onCancel, editingBrand = null, onSuccess }) => {
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
        toast.success('Brand updated successfully');
      } else {
        await createBrand(values).unwrap();
        toast.success('Brand created successfully');
      }
      onSuccess?.();
      onCancel();
    } catch (error) {
      toast.error(error?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      title={editingBrand ? 'Edit Brand' : 'Add New Brand'}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={<>{editingBrand ? 'Update Brand' : 'Create Brand'}</>}
      onCancelButton={onCancel}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="brandName"
          label="Brand Name"
          rules={[
            { required: true, message: 'Brand name is required' },
            { max: 100, message: 'Brand name cannot exceed 100 characters' },
          ]}
        >
          <Input placeholder="Enter brand name" />
        </Form.Item>

        <Form.Item
          name="brandSlug"
          label="Brand Slug"
          rules={[
            { required: true, message: 'Slug is required' },
            {
              pattern: /^[a-z0-9-]+$/,
              message: 'Slug can only contain lowercase letters, numbers and hyphens',
            },
          ]}
          help="Example: nike, samsung, cp-fittings"
        >
          <Input placeholder="auto-generated-slug" />
        </Form.Item>
      </Form>
    </ModalShell>
  );
};

export default BrandFormModal;
