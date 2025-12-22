// src/components/Common/StockModal.jsx
import React, { useEffect } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Button,
  Space,
  Typography,
  message,
  Spin,
} from "antd";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";
import {
  useAddStockMutation,
  useRemoveStockMutation,
} from "../../api/productApi";

const { Text } = Typography;

const StockModal = ({ open, onCancel, product, action = "add" }) => {
  const [form] = Form.useForm();
  const [addStock, { isLoading: adding }] = useAddStockMutation();
  const [removeStock, { isLoading: removing }] = useRemoveStockMutation();

  const isAdd = action === "add";
  const isLoading = adding || removing;

  // Reset form when modal opens or product/action changes
  useEffect(() => {
    if (open) {
      form.setFieldsValue({ quantity: 1 });
    }
  }, [open, product, action, form]);

  const handleSubmit = async (values) => {
    if (!product?.productId) {
      message.error("Invalid product");
      return;
    }

    try {
      if (isAdd) {
        await addStock({
          productId: product.productId,
          quantity: values.quantity,
        }).unwrap();
        message.success(`Successfully added ${values.quantity} unit(s)`);
      } else {
        await removeStock({
          productId: product.productId,
          quantity: values.quantity,
        }).unwrap();
        message.success(`Successfully removed ${values.quantity} unit(s)`);
      }
      onCancel(); // Close modal on success
    } catch (err) {
      message.error(err?.data?.message || "Failed to update stock");
    }
  };

  if (!product) return null;

  return (
    <Modal
      title={
        <Space>
          <span>
            <strong>
              {isAdd ? "Add" : "Remove"} Stock — {product.name || "Product"}
            </strong>
            {product.product_code && (
              <Text type="secondary" style={{ marginLeft: 8 }}>
                #{product.product_code}
              </Text>
            )}
          </span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={500}
      destroyOnClose
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item label={<strong>Current Stock</strong>}>
          <Text strong style={{ fontSize: 18 }}>
            {product.quantity || 0} units
          </Text>
        </Form.Item>

        <Form.Item
          name="quantity"
          label={<strong>Quantity to {isAdd ? "Add" : "Remove"}</strong>}
          rules={[
            { required: true, message: "Please enter a quantity" },
            { type: "number", min: 1, message: "Must be at least 1" },
            () => ({
              validator(_, value) {
                if (!isAdd && value > (product.quantity || 0)) {
                  return Promise.reject(
                    new Error(
                      `Only ${product.quantity} unit(s) available to remove`
                    )
                  );
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <InputNumber
            min={1}
            max={isAdd ? undefined : product.quantity || 0}
            style={{ width: "100%" }}
            size="large"
            placeholder="Enter quantity"
            disabled={isLoading}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
          <Space>
            <Button onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              danger={!isAdd}
            >
              {isLoading
                ? "Processing..."
                : isAdd
                ? "Add to Stock"
                : "Remove from Stock"}
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            zIndex: 10,
          }}
        >
          <Spin
            size="large"
            tip={isAdd ? "Adding stock..." : "Removing stock..."}
          />
        </div>
      )}
    </Modal>
  );
};

export default StockModal;
