import Loader from '../Common/Loader';
import ModalShell from '../Common/ModalShell';
import './StockModal.styles.css';
// src/components/Common/StockModal.jsx
import React, { useEffect } from 'react';
import { Form, InputNumber, Space, Typography } from 'antd';
import { toast } from 'sonner';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { useAddStockMutation, useRemoveStockMutation } from '../../api/productApi';

const { Text } = Typography;

const StockModal = ({ open, onCancel, product, action = 'add' }) => {
  const [form] = Form.useForm();
  const [addStock, { isLoading: adding }] = useAddStockMutation();
  const [removeStock, { isLoading: removing }] = useRemoveStockMutation();

  const isAdd = action === 'add';
  const isLoading = adding || removing;

  // Reset form when modal opens or product/action changes
  useEffect(() => {
    if (open) {
      form.setFieldsValue({ quantity: 1 });
    }
  }, [open, product, action, form]);

  const handleSubmit = async (values) => {
    if (!product?.productId) {
      toast.error('Invalid product');
      return;
    }

    try {
      if (isAdd) {
        await addStock({
          productId: product.productId,
          quantity: values.quantity,
        }).unwrap();
        toast.success(`Successfully added ${values.quantity} unit(s)`);
      } else {
        await removeStock({
          productId: product.productId,
          quantity: values.quantity,
        }).unwrap();
        toast.success(`Successfully removed ${values.quantity} unit(s)`);
      }
      onCancel(); // Close modal on success
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update stock');
    }
  };

  if (!product) return null;

  return (
    <ModalShell
      title={
        <Space>
          <span>
            <strong>
              {isAdd ? 'Add' : 'Remove'} Stock — {product.name || 'Product'}
            </strong>
            {product.product_code && (
              <Text className="fv2-stockmodal-c31289fe96" type="secondary">
                #{product.product_code}
              </Text>
            )}
          </span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={<>{isLoading ? 'Processing...' : isAdd ? 'Add to Stock' : 'Remove from Stock'}</>}
      onCancelButton={onCancel}
      confirmLoading={isLoading}
      okButtonProps={{ danger: !isAdd }}
      cancelButtonProps={{ disabled: isLoading }}
      width={500}
      destroyOnClose
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item label={<strong>Current Stock</strong>}>
          <Text className="fv2-stockmodal-247bb8f398" strong>
            {product.quantity || 0} units
          </Text>
        </Form.Item>

        <Form.Item
          name="quantity"
          label={<strong>Quantity to {isAdd ? 'Add' : 'Remove'}</strong>}
          rules={[
            { required: true, message: 'Please enter a quantity' },
            { type: 'number', min: 1, message: 'Must be at least 1' },
            () => ({
              validator(_, value) {
                if (!isAdd && value > (product.quantity || 0)) {
                  return Promise.reject(
                    new Error(`Only ${product.quantity} unit(s) available to remove`),
                  );
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <InputNumber
            className="fv2-stockmodal-9fb64db8e5"
            min={1}
            max={isAdd ? undefined : product.quantity || 0}

            size="large"
            placeholder="Enter quantity"
            disabled={isLoading}
          />
        </Form.Item>
      </Form>

      {isLoading && (
        <div className="fv2-stockmodal-67381c3139">
          <Loader size="large" tip={isAdd ? 'Adding stock...' : 'Removing stock...'} />
        </div>
      )}
    </ModalShell>
  );
};

export default StockModal;
