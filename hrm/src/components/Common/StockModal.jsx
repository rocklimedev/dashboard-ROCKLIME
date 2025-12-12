import React, { useState, useEffect } from "react";
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
  const [quantity, setQuantity] = useState(1);

  const [addStock, { isLoading: adding }] = useAddStockMutation();
  const [removeStock, { isLoading: removing }] = useRemoveStockMutation();

  const isAdd = action === "add";
  const isLoading = adding || removing;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setQuantity(1);
      form.setFieldsValue({ quantity: 1 });
    }
  }, [open, form]);

  const handleSubmit = async () => {
    if (!product?.productId) {
      message.error("Product not selected");
      return;
    }

    if (!quantity || quantity < 1) {
      message.error("Please enter a valid quantity");
      return;
    }

    try {
      if (isAdd) {
        await addStock({ productId: product.productId, quantity }).unwrap();
        message.success(`Successfully added ${quantity} unit(s) to stock`);
      } else {
        await removeStock({ productId: product.productId, quantity }).unwrap();
        message.success(`Successfully removed ${quantity} unit(s) from stock`);
      }

      form.resetFields();
      onCancel();
    } catch (err) {
      const errorMsg =
        err?.data?.message ||
        (isAdd ? "Failed to add stock" : "Failed to remove stock");
      message.error(errorMsg);
    }
  };

  if (!product) return null;

  return (
    <Modal
      title={
        <Space>
          {isAdd ? (
            <PlusOutlined style={{ color: "#52c41a" }} />
          ) : (
            <MinusOutlined style={{ color: "#ff4d4f" }} />
          )}
          <strong>
            {isAdd ? "Add" : "Remove"} Stock — {product.name || "Product"}
          </strong>
          {product.sku && <Text type="secondary">#{product.sku}</Text>}
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={480}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label={<strong>Current Stock</strong>}
          style={{ marginBottom: 16 }}
        >
          <Text strong style={{ fontSize: 18 }}>
            {product.quantity || 0} units
          </Text>
        </Form.Item>

        <Form.Item
          name="quantity"
          label={<strong>Quantity to {isAdd ? "Add" : "Remove"}</strong>}
          rules={[
            { required: true, message: "Please enter quantity" },
            { type: "number", min: 1, message: "Quantity must be at least 1" },
            () => ({
              validator(_, value) {
                if (!isAdd && value > product.quantity) {
                  return Promise.reject(
                    new Error(`Only ${product.quantity} units available`)
                  );
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <InputNumber
            min={1}
            max={isAdd ? 999999 : product.quantity}
            style={{ width: "100%" }}
            size="large"
            placeholder="Enter quantity"
            onChange={setQuantity}
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
              icon={isAdd ? <PlusOutlined /> : <MinusOutlined />}
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
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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
