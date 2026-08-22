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
  Tag,
  Spin,
} from "antd";
import {
  UploadOutlined,
  FileTextOutlined,
  RollbackOutlined,
} from "@ant-design/icons";

import {
  useCreateCreditNoteMutation,
  useGetOrderDispatchesQuery,
  useGetOrderCreditNotesQuery,
} from "../../api/orderApi";

const { Text } = Typography;

const OrderCreditNoteModal = ({ visible, order, onClose, onSuccess }) => {
  const [createCreditNote, { isLoading }] = useCreateCreditNoteMutation();

  const [file, setFile] = useState(null);
  const [items, setItems] = useState([]);

  /*
   * ------------------------------------------------------------
   * DISPATCH HISTORY
   * ------------------------------------------------------------
   */

  const {
    data: dispatchesResponse,
    isLoading: dispatchesLoading,
    isFetching: dispatchesFetching,
  } = useGetOrderDispatchesQuery(order?.id, {
    skip: !visible || !order?.id,
  });

  /*
   * ------------------------------------------------------------
   * EXISTING CREDIT NOTES
   * ------------------------------------------------------------
   */

  const {
    data: creditNotesResponse,
    isLoading: creditNotesLoading,
    isFetching: creditNotesFetching,
  } = useGetOrderCreditNotesQuery(order?.id, {
    skip: !visible || !order?.id,
  });

  /*
   * ------------------------------------------------------------
   * NORMALIZE DISPATCH RESPONSE
   * ------------------------------------------------------------
   */

  const dispatches = useMemo(() => {
    if (Array.isArray(dispatchesResponse)) {
      return dispatchesResponse;
    }

    if (Array.isArray(dispatchesResponse?.dispatches)) {
      return dispatchesResponse.dispatches;
    }

    if (Array.isArray(dispatchesResponse?.data)) {
      return dispatchesResponse.data;
    }

    if (Array.isArray(dispatchesResponse?.rows)) {
      return dispatchesResponse.rows;
    }

    return [];
  }, [dispatchesResponse]);

  /*
   * ------------------------------------------------------------
   * NORMALIZE CREDIT NOTE RESPONSE
   * ------------------------------------------------------------
   */

  const creditNotes = useMemo(() => {
    if (Array.isArray(creditNotesResponse)) {
      return creditNotesResponse;
    }

    if (Array.isArray(creditNotesResponse?.creditNotes)) {
      return creditNotesResponse.creditNotes;
    }

    if (Array.isArray(creditNotesResponse?.data)) {
      return creditNotesResponse.data;
    }

    if (Array.isArray(creditNotesResponse?.rows)) {
      return creditNotesResponse.rows;
    }

    return [];
  }, [creditNotesResponse]);

  /*
   * ------------------------------------------------------------
   * LOADING STATE
   * ------------------------------------------------------------
   */

  const dataLoading =
    dispatchesLoading ||
    dispatchesFetching ||
    creditNotesLoading ||
    creditNotesFetching;

  /*
   * ------------------------------------------------------------
   * TOTAL DISPATCHED QUANTITY PER PRODUCT
   *
   * Example:
   *
   * Dispatch #1 -> Product A -> 5
   * Dispatch #2 -> Product A -> 3
   * Dispatch #3 -> Product A -> 2
   *
   * Total dispatched = 10
   * ------------------------------------------------------------
   */

  const dispatchedQuantities = useMemo(() => {
    const quantities = {};

    dispatches.forEach((dispatch) => {
      /*
       * Returned dispatch batches should not contribute to the
       * available quantity.
       */
      if (String(dispatch.status || "").toUpperCase() === "RETURNED") {
        return;
      }

      const dispatchItems = Array.isArray(dispatch.items) ? dispatch.items : [];

      dispatchItems.forEach((item) => {
        const productId = item.productId || item.id;

        if (!productId) return;

        const quantity = Number(item.quantity || 0);

        if (quantity <= 0) return;

        quantities[productId] = (quantities[productId] || 0) + quantity;
      });
    });

    return quantities;
  }, [dispatches]);

  /*
   * ------------------------------------------------------------
   * TOTAL ALREADY CREDITED PER PRODUCT
   *
   * Example:
   *
   * Dispatched = 10
   * Existing Credit Note = 4
   *
   * Available = 6
   * ------------------------------------------------------------
   */

  const creditedQuantities = useMemo(() => {
    const quantities = {};

    creditNotes.forEach((creditNote) => {
      const status = String(creditNote.status || "").toUpperCase();

      /*
       * Cancelled / rejected credit notes should not consume
       * the available quantity.
       */
      if (
        status === "CANCELLED" ||
        status === "CANCELED" ||
        status === "REJECTED" ||
        status === "VOID" ||
        status === "VOIDED"
      ) {
        return;
      }

      const noteItems = Array.isArray(creditNote.items) ? creditNote.items : [];

      noteItems.forEach((item) => {
        const productId = item.productId || item.id;

        if (!productId) return;

        const quantity = Number(item.quantity || 0);

        if (quantity <= 0) return;

        quantities[productId] = (quantities[productId] || 0) + quantity;
      });
    });

    return quantities;
  }, [creditNotes]);

  /*
   * ------------------------------------------------------------
   * BUILD PRODUCT ITEMS
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (!visible || !order) {
      setFile(null);
      setItems([]);
      return;
    }

    const products = Array.isArray(order.products) ? order.products : [];

    setItems(
      products.map((product) => {
        const productId = product.id || product.productId;

        const orderedQuantity = Number(product.quantity || 0);

        const dispatchedQuantity = Number(dispatchedQuantities[productId] || 0);

        const alreadyCreditedQuantity = Number(
          creditedQuantities[productId] || 0,
        );

        /*
         * Never allow the available quantity to become negative.
         *
         * available =
         * dispatched - already credited
         */
        const availableQuantity = Math.max(
          0,
          dispatchedQuantity - alreadyCreditedQuantity,
        );

        return {
          productId,
          name: product.name || "Unknown Product",

          price: Number(product.price || 0),

          orderedQuantity,

          dispatchedQuantity,

          alreadyCreditedQuantity,

          availableQuantity,

          returnedQuantity: 0,

          discount: Number(product.discount || 0),

          discountType: product.discountType || "percent",

          total: Number(product.total || 0),
        };
      }),
    );

    setFile(null);
  }, [visible, order, dispatchedQuantities, creditedQuantities]);

  /*
   * ------------------------------------------------------------
   * SELECTED ITEMS
   * ------------------------------------------------------------
   */

  const selectedItems = useMemo(
    () => items.filter((item) => Number(item.returnedQuantity) > 0),
    [items],
  );

  /*
   * ------------------------------------------------------------
   * TOTAL RETURNED QUANTITY
   * ------------------------------------------------------------
   */

  const totalReturnedQuantity = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) => sum + Number(item.returnedQuantity || 0),
        0,
      ),
    [selectedItems],
  );

  /*
   * ------------------------------------------------------------
   * RETURNED AMOUNT
   * ------------------------------------------------------------
   */

  const returnedAmount = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const quantity = Number(item.returnedQuantity || 0);

      if (!quantity) {
        return sum;
      }

      if (item.discountType === "fixed") {
        return sum + Math.max(0, item.price - item.discount) * quantity;
      }

      return sum + item.price * (1 - item.discount / 100) * quantity;
    }, 0);
  }, [selectedItems]);

  /*
   * ------------------------------------------------------------
   * QUANTITY CHANGE
   *
   * IMPORTANT:
   * Maximum is AVAILABLE CREDIT QUANTITY,
   * NOT ORDERED QUANTITY.
   * ------------------------------------------------------------
   */

  const handleQuantityChange = (value, productId) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) {
          return item;
        }

        const max = Number(item.availableQuantity || 0);

        const quantity = Math.max(0, Math.min(Number(value || 0), max));

        return {
          ...item,
          returnedQuantity: quantity,
        };
      }),
    );
  };

  /*
   * ------------------------------------------------------------
   * FILE
   * ------------------------------------------------------------
   */

  const handleFileChange = ({ fileList }) => {
    const selected = fileList?.[0]?.originFileObj || null;

    if (!selected) {
      setFile(null);
      return;
    }

    /*
     * Frontend size validation.
     *
     * 5 MB maximum.
     */
    const maxSize = 5 * 1024 * 1024;

    if (selected.size > maxSize) {
      message.error("Credit note document must be smaller than 5MB");
      return;
    }

    setFile(selected);
  };

  /*
   * ------------------------------------------------------------
   * SUBMIT
   * ------------------------------------------------------------
   */

  const handleSubmit = async () => {
    if (!order?.id) {
      message.error("Order not found");
      return;
    }

    if (dataLoading) {
      message.warning(
        "Please wait while dispatch and credit note information is loaded",
      );
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

    /*
     * ----------------------------------------------------------
     * FINAL FRONTEND VALIDATION
     *
     * Never rely only on InputNumber max.
     * ----------------------------------------------------------
     */

    const invalidItem = selectedItems.find((item) => {
      const requested = Number(item.returnedQuantity || 0);

      const available = Number(item.availableQuantity || 0);

      return requested > available;
    });

    if (invalidItem) {
      message.error(
        `${invalidItem.name}: credit note quantity cannot exceed the available dispatched quantity`,
      );
      return;
    }

    /*
     * Make sure no item with zero available quantity
     * somehow gets submitted.
     */
    const unavailableItem = selectedItems.find(
      (item) => Number(item.availableQuantity || 0) <= 0,
    );

    if (unavailableItem) {
      message.error(
        `${unavailableItem.name} has no available dispatched quantity for credit note`,
      );
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

  /*
   * ------------------------------------------------------------
   * TABLE
   * ------------------------------------------------------------
   */

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
      width: 90,
      align: "center",
    },

    {
      title: "Dispatched",
      dataIndex: "dispatchedQuantity",
      key: "dispatchedQuantity",
      width: 100,
      align: "center",

      render: (value) => {
        const quantity = Number(value || 0);

        if (!quantity) {
          return <Tag color="default">0</Tag>;
        }

        return <Tag color="blue">{quantity}</Tag>;
      },
    },

    {
      title: "Already Credited",
      dataIndex: "alreadyCreditedQuantity",
      key: "alreadyCreditedQuantity",
      width: 125,
      align: "center",

      render: (value) => {
        const quantity = Number(value || 0);

        if (!quantity) {
          return <Text type="secondary">0</Text>;
        }

        return <Tag color="orange">{quantity}</Tag>;
      },
    },

    {
      title: "Available",
      dataIndex: "availableQuantity",
      key: "availableQuantity",
      width: 100,
      align: "center",

      render: (value) => {
        const quantity = Number(value || 0);

        if (!quantity) {
          return <Tag color="red">0</Tag>;
        }

        return <Tag color="green">{quantity}</Tag>;
      },
    },

    {
      title: "Credit Note Qty",
      key: "returnedQuantity",
      width: 160,

      render: (_, record) => {
        const max = Number(record.availableQuantity || 0);

        /*
         * Product has not been dispatched
         */
        if (max <= 0) {
          return <Text type="secondary">Not available</Text>;
        }

        return (
          <InputNumber
            min={0}
            max={max}
            value={record.returnedQuantity}
            onChange={(value) => handleQuantityChange(value, record.productId)}
            style={{
              width: "100%",
            }}
          />
        );
      },
    },

    {
      title: "Return Amount",
      key: "returnAmount",
      width: 140,
      align: "right",

      render: (_, record) => {
        const quantity = Number(record.returnedQuantity || 0);

        if (!quantity) {
          return "₹0.00";
        }

        const unitPrice =
          record.discountType === "fixed"
            ? Math.max(0, record.price - record.discount)
            : record.price * (1 - record.discount / 100);

        return `₹${(unitPrice * quantity).toFixed(2)}`;
      },
    },
  ];

  /*
   * ------------------------------------------------------------
   * UI
   * ------------------------------------------------------------
   */

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
      width={1100}
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
          disabled={dataLoading || !selectedItems.length}
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
            message="Credit note is limited to dispatched quantities"
            description="You can create a credit note only for products that have already been dispatched. The maximum credit-note quantity is the dispatched quantity minus quantities already credited on previous credit notes."
          />

          {dataLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
              }}
            >
              <Spin size="large" />

              <div className="mt-3">
                <Text type="secondary">
                  Loading dispatch and credit note history...
                </Text>
              </div>
            </div>
          ) : (
            <>
              <Table
                rowKey="productId"
                columns={columns}
                dataSource={items}
                pagination={false}
                size="small"
                scroll={{
                  x: 950,
                }}
                locale={{
                  emptyText: "No products found in this order",
                }}
              />

              <Divider />

              <div className="d-flex justify-content-end mb-4">
                <div className="text-end">
                  <div>
                    <Text type="secondary">Credit Note Quantity</Text>
                  </div>

                  <div className="fw-semibold">{totalReturnedQuantity}</div>

                  <div className="mt-2">
                    <Text type="secondary">Credit Amount</Text>
                  </div>

                  <div className="fw-bold fs-5">
                    ₹{returnedAmount.toFixed(2)}
                  </div>
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
        </>
      )}
    </Modal>
  );
};

export default OrderCreditNoteModal;
