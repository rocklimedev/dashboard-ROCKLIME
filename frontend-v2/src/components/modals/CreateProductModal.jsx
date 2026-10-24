import ModalShell from '../Common/ModalShell';
import './CreateProductModal.styles.css';
// src/components/modals/CreateProductModal.jsx
import React from 'react';
import { Form, Input, InputNumber, Select } from 'antd';
import { toast } from 'sonner';
import { useCreateProductMutation } from '../../api/productApi';

const { Option } = Select;

const CreateProductModal = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [createProduct, { isLoading }] = useCreateProductMutation();

  const handleSubmit = async (values) => {
    const formData = new FormData();

    formData.append('name', values.name.trim());
    formData.append('product_code', values.product_code.trim());
    formData.append('quantity', Number(values.quantity) || 0);
    formData.append('status', values.status);

    // Required defaults
    formData.append('isMaster', false);
    formData.append('isFeatured', false);

    try {
      const result = await createProduct(formData).unwrap();

      toast.success(`Product "${values.name}" created successfully!`);

      form.resetFields();
      onSuccess?.(result?.product || result?.data || result); // Pass created product if needed
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || 'Failed to create product');
    }
  };

  return (
    <ModalShell
      title="Create Optional Product"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={<>Create Product</>}
      onCancelButton={onClose}
      confirmLoading={isLoading}
      destroyOnClose
      width={620}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'active',
          quantity: 1,
        }}
      >
        <Form.Item
          name="name"
          label="Product Name"
          rules={[{ required: true, message: 'Product name is required' }]}
        >
          <Input placeholder="Enter product name" />
        </Form.Item>

        <Form.Item
          name="product_code"
          label="Product Code"
          rules={[
            { required: true, message: 'Product code is required' },
            { whitespace: true, message: 'Product code cannot be empty' },
          ]}
        >
          <Input placeholder="e.g. OPT-2026-001" />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Quantity"
          rules={[{ required: true, message: 'Quantity is required' }]}
        >
          <InputNumber className="fv2-createproductmodal-d5a309e9eb" min={0} />
        </Form.Item>

        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
            <Option value="out_of_stock">Out of Stock</Option>
          </Select>
        </Form.Item>
      </Form>
    </ModalShell>
  );
};

export default CreateProductModal;
