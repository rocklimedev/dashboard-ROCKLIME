import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Radio,
  Table,
  InputNumber,
  Input,
  Upload,
  Button,
  message,
  Alert,
} from "antd";
import {
  UploadOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  useCreateDispatchMutation,
  useGetOrderDispatchesQuery,
} from "../../api/orderApi";

const { TextArea } = Input;

/**
 * DispatchModal
 *
 * Supports:
 * - Full dispatch
 * - Partial dispatch
 * - Existing invoice on order
 * - Upload invoice + gate pass during dispatch
 * - Optional carrier / tracking / remarks
 *
 * Invoice rules:
 * - If order.invoiceLink exists, no invoice upload is required.
 * - If order.invoiceLink does not exist, an invoice file MUST be selected.
 * - Invoice is submitted as multipart field: "invoice"
 * - Gate pass is submitted as multipart field: "gatePass"
 */
const DispatchModal = ({ visible, order, onClose, onSuccess }) => {
  const [dispatchType, setDispatchType] = useState("full");
  const [quantities, setQuantities] = useState({});

  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [remarks, setRemarks] = useState("");

  const [invoiceFile, setInvoiceFile] = useState(null);
  const [gatePassFile, setGatePassFile] = useState(null);

  const { data: dispatchesData, isFetching: loadingDispatches } =
    useGetOrderDispatchesQuery(order?.id, {
      skip: !visible || !order?.id,
    });

  const [createDispatch, { isLoading: isSubmitting }] =
    useCreateDispatchMutation();

  // ------------------------------------------------------------
  // Invoice availability
  // ------------------------------------------------------------

  const hasExistingInvoice = Boolean(order?.invoiceLink);
  const hasNewInvoice = Boolean(invoiceFile);

  const invoiceAvailable = hasExistingInvoice || hasNewInvoice;

  // ------------------------------------------------------------
  // Already dispatched quantities
  // ------------------------------------------------------------

  const alreadyDispatchedMap = useMemo(() => {
    const map = {};

    for (const d of dispatchesData?.dispatches || []) {
      for (const it of d.items || []) {
        map[it.productId] = (map[it.productId] || 0) + Number(it.quantity || 0);
      }
    }

    return map;
  }, [dispatchesData]);

  // ------------------------------------------------------------
  // Order lines
  // ------------------------------------------------------------

  const lines = useMemo(() => {
    const products = order?.products || [];

    return products.map((p) => {
      const productId = p.productId || p.id;

      const orderedQty = Number(p.quantity) || 0;

      const dispatchedSoFar = alreadyDispatchedMap[productId] || 0;

      const remaining = Math.max(orderedQty - dispatchedSoFar, 0);

      return {
        productId,
        name: p.name || "Unknown Product",
        productCode: p.productCode || "",
        price: Number(p.price) || 0,
        orderedQty,
        dispatchedSoFar,
        remaining,
      };
    });
  }, [order, alreadyDispatchedMap]);

  const hasAnythingRemaining = lines.some((line) => line.remaining > 0);

  // ------------------------------------------------------------
  // Reset when modal/order changes
  // ------------------------------------------------------------

  useEffect(() => {
    if (!visible) return;

    setDispatchType("full");
    setCarrier("");
    setTrackingNumber("");
    setRemarks("");

    setInvoiceFile(null);
    setGatePassFile(null);
  }, [visible, order?.id]);

  // ------------------------------------------------------------
  // Default quantities
  // ------------------------------------------------------------

  useEffect(() => {
    if (!visible) return;

    if (dispatchType === "full") {
      const full = {};

      lines.forEach((line) => {
        full[line.productId] = line.remaining;
      });

      setQuantities(full);
    } else {
      const zeroed = {};

      lines.forEach((line) => {
        zeroed[line.productId] = 0;
      });

      setQuantities(zeroed);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatchType, visible, dispatchesData]);

  // ------------------------------------------------------------
  // Quantity change
  // ------------------------------------------------------------

  const handleQuantityChange = (productId, value, maxRemaining) => {
    const clamped = Math.max(0, Math.min(Number(value) || 0, maxRemaining));

    setQuantities((prev) => ({
      ...prev,
      [productId]: clamped,
    }));
  };

  // ------------------------------------------------------------
  // Total selected quantity
  // ------------------------------------------------------------

  const totalSelectedQty = Object.values(quantities).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  );

  // ------------------------------------------------------------
  // Invoice upload
  // ------------------------------------------------------------

  const handleInvoiceBeforeUpload = (file) => {
    setInvoiceFile(file);

    return false;
  };

  const handleInvoiceRemove = () => {
    setInvoiceFile(null);
  };

  // ------------------------------------------------------------
  // Gate pass upload
  // ------------------------------------------------------------

  const handleGatePassBeforeUpload = (file) => {
    setGatePassFile(file);

    return false;
  };

  const handleGatePassRemove = () => {
    setGatePassFile(null);
  };

  // ------------------------------------------------------------
  // Submit
  // ------------------------------------------------------------

  const handleSubmit = async () => {
    // Invoice validation
    if (!invoiceAvailable) {
      message.error(
        "Invoice is required before dispatch. Please upload the invoice.",
      );
      return;
    }

    // Quantity validation
    const items = lines
      .map((line) => ({
        productId: line.productId,
        quantity: Number(quantities[line.productId]) || 0,
      }))
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      message.error("Select at least one product/quantity to dispatch");
      return;
    }

    const formData = new FormData();

    // Required dispatch items
    formData.append("items", JSON.stringify(items));

    // Optional fields
    if (carrier.trim()) {
      formData.append("carrier", carrier.trim());
    }

    if (trackingNumber.trim()) {
      formData.append("trackingNumber", trackingNumber.trim());
    }

    if (remarks.trim()) {
      formData.append("remarks", remarks.trim());
    }

    // ----------------------------------------------------------
    // Invoice
    //
    // Only send invoice file when the order does not already
    // have an invoice.
    // ----------------------------------------------------------

    if (!hasExistingInvoice && invoiceFile) {
      formData.append("invoice", invoiceFile);
    }

    // ----------------------------------------------------------
    // Gate pass
    // ----------------------------------------------------------

    if (gatePassFile) {
      formData.append("gatePass", gatePassFile);
    }

    try {
      const result = await createDispatch({
        orderId: order.id,
        formData,
      }).unwrap();

      message.success(
        result?.orderStatus === "DISPATCHED"
          ? "Order fully dispatched"
          : "Partial dispatch recorded",
      );

      onSuccess?.(result);
      onClose();
    } catch (err) {
      console.error("Create Dispatch Error:", err);

      message.error(err?.data?.message || "Failed to create dispatch");
    }
  };

  // ------------------------------------------------------------
  // Table columns
  // ------------------------------------------------------------

  const columns = [
    {
      title: "Product",
      dataIndex: "name",
    },

    {
      title: "Ordered",
      dataIndex: "orderedQty",
      width: 90,
    },

    {
      title: "Already Dispatched",
      dataIndex: "dispatchedSoFar",
      width: 150,
    },

    {
      title: "Remaining",
      dataIndex: "remaining",
      width: 100,
    },

    {
      title: "Dispatch Qty",
      key: "dispatchQty",
      width: 140,

      render: (_, record) => (
        <InputNumber
          min={0}
          max={record.remaining}
          value={quantities[record.productId] ?? 0}
          disabled={dispatchType === "full" || record.remaining === 0}
          onChange={(value) =>
            handleQuantityChange(record.productId, value, record.remaining)
          }
          style={{ width: "100%" }}
        />
      ),
    },
  ];

  // ------------------------------------------------------------
  // Modal
  // ------------------------------------------------------------

  return (
    <Modal
      title={`Dispatch Order #${order?.orderNo || ""}`}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={dispatchType === "full" ? "Dispatch All" : "Dispatch Selected"}
      okButtonProps={{
        loading: isSubmitting,
        disabled:
          !hasAnythingRemaining || totalSelectedQty === 0 || !invoiceAvailable,
      }}
      width={720}
      destroyOnClose
    >
      {!hasAnythingRemaining && !loadingDispatches ? (
        <div className="text-muted py-3">
          Everything on this order has already been dispatched.
        </div>
      ) : (
        <>
          {/* -------------------------------------------------- */}
          {/* Dispatch Type */}
          {/* -------------------------------------------------- */}

          <Radio.Group
            value={dispatchType}
            onChange={(e) => setDispatchType(e.target.value)}
            style={{ marginBottom: 16 }}
          >
            <Radio.Button value="full">Full Dispatch</Radio.Button>

            <Radio.Button value="partial">Partial Dispatch</Radio.Button>
          </Radio.Group>

          {/* -------------------------------------------------- */}
          {/* Product Table */}
          {/* -------------------------------------------------- */}

          <Table
            rowKey="productId"
            columns={columns}
            dataSource={lines}
            pagination={false}
            loading={loadingDispatches}
            size="small"
            style={{ marginBottom: 16 }}
          />

          {/* -------------------------------------------------- */}
          {/* Invoice */}
          {/* -------------------------------------------------- */}

          {hasExistingInvoice ? (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message="Invoice already uploaded"
              description="This order already has an invoice. You can proceed with dispatch."
              style={{ marginBottom: 16 }}
            />
          ) : (
            <div style={{ marginBottom: 16 }}>
              <Alert
                type="warning"
                showIcon
                message="Invoice required"
                description="This order cannot be dispatched without an invoice. You can upload the invoice now and dispatch in the same operation."
                style={{ marginBottom: 12 }}
              />

              <Upload
                beforeUpload={handleInvoiceBeforeUpload}
                onRemove={handleInvoiceRemove}
                maxCount={1}
                accept=".pdf,.png,.jpg,.jpeg"
              >
                <Button icon={<FilePdfOutlined />}>Upload Invoice</Button>
              </Upload>

              {invoiceFile && (
                <div className="text-muted small mt-2">
                  Selected invoice: <strong>{invoiceFile.name}</strong>
                </div>
              )}
            </div>
          )}

          {/* -------------------------------------------------- */}
          {/* Carrier / Tracking */}
          {/* -------------------------------------------------- */}

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <Input
                placeholder="Carrier (optional)"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              />
            </div>

            <div className="col-md-6">
              <Input
                placeholder="Tracking Number (optional)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
          </div>

          {/* -------------------------------------------------- */}
          {/* Remarks */}
          {/* -------------------------------------------------- */}

          <TextArea
            placeholder="Remarks (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            style={{ marginBottom: 16 }}
          />

          {/* -------------------------------------------------- */}
          {/* Gate Pass */}
          {/* -------------------------------------------------- */}

          <div style={{ marginBottom: 16 }}>
            <Upload
              beforeUpload={handleGatePassBeforeUpload}
              onRemove={handleGatePassRemove}
              maxCount={1}
              accept=".pdf,.png,.jpg,.jpeg"
            >
              <Button icon={<UploadOutlined />}>
                Attach Gate-Pass (optional, for this batch)
              </Button>
            </Upload>

            {gatePassFile && (
              <div className="text-muted small mt-2">
                Selected gate pass: <strong>{gatePassFile.name}</strong>
              </div>
            )}
          </div>

          {/* -------------------------------------------------- */}
          {/* Summary */}
          {/* -------------------------------------------------- */}

          <div className="text-muted small mt-3">
            Selected: {totalSelectedQty} unit(s) —{" "}
            {dispatchType === "full"
              ? "order will be marked DISPATCHED"
              : "order will be marked PARTIALLY_DISPATCHED unless this covers everything remaining"}
            .
          </div>

          {!invoiceAvailable && (
            <div className="text-danger small mt-2">
              An invoice must be available before the dispatch can be submitted.
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default DispatchModal;
