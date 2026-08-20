import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Upload,
  Button,
  InputNumber,
  Table,
  message,
  Typography,
  Divider,
  Alert,
} from "antd";
import {
  UploadOutlined,
  FileTextOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { useCreateCreditNoteMutation } from "../../api/orderApi";

const { Text } = Typography;

const OrderCreditNoteModal = ({ visible, order, onClose, onSuccess }) => {
  const [createCreditNote, { isLoading }] = useCreateCreditNoteMutation();

  const [file, setFile] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!visible || !order) {
      setFile(null);
      setItems([]);
      return;
    }

    const products = Array.isArray(order.products) ? order.products : [];

    setItems(
      products.map((product) => ({
        productId: product.id || product.productId,
        name: product.name || "Unknown Product",
        price: Number(product.price || 0),
        orderedQuantity: Number(product.quantity || 0),
        returnedQuantity: 0,
        discount: Number(product.discount || 0),
        discountType: product.discountType || "percent",
        total: Number(product.total || 0),
      })),
    );

    setFile(null);
  }, [visible, order]);

  const selectedItems = useMemo(
    () => items.filter((item) => Number(item.returnedQuantity) > 0),
    [items],
  );

  const totalReturnedQuantity = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) => sum + Number(item.returnedQuantity || 0),
        0,
      ),
    [selectedItems],
  );

  const returnedAmount = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const quantity = Number(item.returnedQuantity || 0);

      if (item.discountType === "fixed") {
        return sum + Math.max(0, item.price - item.discount) * quantity;
      }

      return sum + item.price * (1 - item.discount / 100) * quantity;
    }, 0);
  }, [selectedItems]);

  const handleQuantityChange = (value, productId) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        const max = item.orderedQuantity;
        const quantity = Math.max(0, Math.min(Number(value || 0), max));

        return {
          ...item,
          returnedQuantity: quantity,
        };
      }),
    );
  };

  const handleFileChange = ({ fileList }) => {
    const selected = fileList?.[0]?.originFileObj || null;
    setFile(selected);
  };

  const handleSubmit = async () => {
    if (!order?.id) {
      message.error("Order not found");
      return;
    }

    if (!selectedItems.length) {
      message.error("Select at least one item to return");
      return;
    }

    if (!file) {
      message.error("Credit note document is required");
      return;
    }

    const formData = new FormData();

    formData.append(
      "items",
      JSON.stringify(
        selectedItems.map((item) => ({
          productId: item.productId,
          quantity: Number(item.returnedQuantity),
        })),
      ),
    );

    formData.append("file", file);

    try {
      await createCreditNote({
        orderId: order.id,
        formData,
      }).unwrap();

      message.success("Credit note created successfully");

      onSuccess?.();
      onClose?.();
    } catch (err) {
      message.error(err?.data?.message || "Failed to create credit note");
    }
  };

  const columns = [
    {
      title: "Product",
      key: "name",
      render: (_, record) => (
        <div>
          <div className="fw-semibold">{record.name}</div>
        </div>
      ),
    },
    {
      title: "Ordered",
      dataIndex: "orderedQuantity",
      key: "orderedQuantity",
      width: 100,
      align: "center",
    },
    {
      title: "Return Qty",
      key: "returnedQuantity",
      width: 150,
      render: (_, record) => (
        <InputNumber
          min={0}
          max={record.orderedQuantity}
          value={record.returnedQuantity}
          onChange={(value) => handleQuantityChange(value, record.productId)}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Return Amount",
      key: "returnAmount",
      width: 140,
      align: "right",
      render: (_, record) => {
        const quantity = Number(record.returnedQuantity || 0);

        if (!quantity) return "₹0.00";

        const unitPrice =
          record.discountType === "fixed"
            ? Math.max(0, record.price - record.discount)
            : record.price * (1 - record.discount / 100);

        return `₹${(unitPrice * quantity).toFixed(2)}`;
      },
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      title={
        <div className="d-flex align-items-center gap-2">
          <RollbackOutlined />
          <span>Create Credit Note</span>
        </div>
      }
      width={900}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<RollbackOutlined />}
          loading={isLoading}
          onClick={handleSubmit}
        >
          Create Credit Note
        </Button>,
      ]}
    >
      {order && (
        <>
          <div className="mb-3">
            <div className="fw-semibold">Order #{order.orderNo}</div>

            <Text type="secondary">{order.customer?.name || "Customer"}</Text>
          </div>

          <Alert
            type="info"
            showIcon
            className="mb-4"
            message="Partial returns are supported"
            description="Select the quantity being returned for each product. Only the returned quantity will be restored to inventory."
          />

          <Table
            rowKey="productId"
            columns={columns}
            dataSource={items}
            pagination={false}
            size="small"
            locale={{
              emptyText: "No products found in this order",
            }}
          />

          <Divider />

          <div className="d-flex justify-content-end mb-4">
            <div className="text-end">
              <div>
                <Text type="secondary">Returned Quantity</Text>
              </div>

              <div className="fw-semibold">{totalReturnedQuantity}</div>

              <div className="mt-2">
                <Text type="secondary">Credit Amount</Text>
              </div>

              <div className="fw-bold fs-5">₹{returnedAmount.toFixed(2)}</div>
            </div>
          </div>

          <div>
            <div className="fw-semibold mb-2">Credit Note Document</div>

            <Upload
              maxCount={1}
              accept=".pdf,.png,.jpg,.jpeg"
              beforeUpload={() => false}
              onChange={handleFileChange}
              onRemove={() => setFile(null)}
              fileList={
                file
                  ? [
                      {
                        uid: "-1",
                        name: file.name,
                        status: "done",
                        originFileObj: file,
                      },
                    ]
                  : []
              }
            >
              <Button icon={<UploadOutlined />}>Upload Credit Note</Button>
            </Upload>

            <div className="mt-2">
              <Text type="secondary">
                PDF, PNG, JPG or JPEG. Maximum size: 5MB.
              </Text>
            </div>
          </div>

          {file && (
            <div className="mt-3">
              <FileTextOutlined className="me-2" />
              <Text>{file.name}</Text>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default OrderCreditNoteModal;
