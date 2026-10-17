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
} from "antd";
import { UploadOutlined, FilePdfOutlined } from "@ant-design/icons";
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
 * - Carrier / tracking / remarks
 *
 * Document rules (per dispatch batch):
 * - EVERY dispatch must carry its OWN invoice.
 * - EVERY dispatch must carry its OWN gate-pass.
 * - Neither is inherited from the order or from a previous dispatch —
 *   each shipment is its own paperwork event.
 * - Invoice is submitted as multipart field: "invoice"
 * - Gate pass is submitted as multipart field: "gatePass"
 */
const DispatchModal = ({ visible, order, onClose, onSuccess }) => {
  const [dispatchType, setDispatchType] = useState("full");
  const [quantities, setQuantities] = useState({});

  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  // Vehicle / driver / LR / e-way bill for this dispatch
  const [transport, setTransport] = useState({
    vehicleNo: "",
    driverName: "",
    driverPhone: "",
    ewayBillNo: "",
  });
  const setT = (k) => (e) => setTransport((t) => ({ ...t, [k]: e.target.value }));

  const [invoiceFile, setInvoiceFile] = useState(null);
  const [gatePassFile, setGatePassFile] = useState(null);

  const { data: dispatchesData, isFetching: loadingDispatches } =
    useGetOrderDispatchesQuery(order?.id, {
      skip: !visible || !order?.id,
    });

  const [createDispatch, { isLoading: isSubmitting }] =
    useCreateDispatchMutation();

  // ------------------------------------------------------------
  // Document availability — always requires a fresh file for
  // THIS dispatch batch.
  // ------------------------------------------------------------

  // "make" = the ERP makes the document after the dispatch is saved; "upload" = attach a file
  const [invoiceMode, setInvoiceMode] = useState("make");
  const [gatePassMode, setGatePassMode] = useState("make");
  const invoiceReady = invoiceMode === "make" || Boolean(invoiceFile);
  const gatePassReady = gatePassMode === "make" || Boolean(gatePassFile);
  const documentsReady = invoiceReady && gatePassReady;

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
    setTransport({ vehicleNo: "", driverName: "", driverPhone: "", ewayBillNo: "" });

    setInvoiceFile(null);
    setGatePassFile(null);
    setInvoiceMode("make");
    setGatePassMode("make");
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
    // Document validation — both are mandatory for THIS dispatch
    if (!invoiceReady) {
      message.error("Upload this dispatch's invoice, or let the ERP make the GST invoice.");
      return;
    }

    if (!gatePassReady) {
      message.error("Upload this dispatch's gate pass, or let the ERP make it.");
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

    // Transport: the carrier doubles as the transporter, tracking as the LR no.
    if (carrier.trim()) formData.append("transporter", carrier.trim());
    if (trackingNumber.trim()) formData.append("lrNumber", trackingNumber.trim());
    for (const [k, v] of Object.entries(transport)) {
      if (String(v).trim()) formData.append(k, String(v).trim());
    }
    const eway = transport.ewayBillNo.replace(/\s/g, "");
    if (eway && !/^\d{12}$/.test(eway)) {
      message.error("E-way bill number must be 12 digits");
      return;
    }

    // This dispatch's own documents — always sent
    if (invoiceMode === "make") formData.append("makeInvoice", "1");
    else formData.append("invoice", invoiceFile);
    if (gatePassMode === "make") formData.append("makeGatePass", "1");
    else formData.append("gatePass", gatePassFile);

    try {
      const result = await createDispatch({
        orderId: order.id,
        formData,
      }).unwrap();

      message.success(
        (result?.orderStatus === "DISPATCHED" ? "Order fully dispatched" : "Partial dispatch recorded") +
          (result?.invoice ? ` · invoice ${result.invoice.invoiceNo}` : ""),
      );
      if (result?.note) message.info(result.note, 6);

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
      footer={hasAnythingRemaining ? undefined : null}
      okButtonProps={{
        loading: isSubmitting,
        disabled:
          !hasAnythingRemaining || totalSelectedQty === 0 || !documentsReady,
      }}
      width={720}
      destroyOnClose
    >
      {!hasAnythingRemaining && !loadingDispatches ? (
        <div className="text-muted py-3">
          {lines.length === 0
            ? "This order has no items to dispatch."
            : "Everything on this order has already been dispatched."}
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
          {/* Invoice — mandatory per dispatch */}
          {/* -------------------------------------------------- */}

          <div style={{ marginBottom: 16 }}>
            <div className="fw-semibold mb-2">Invoice for this dispatch</div>
            <Radio.Group
              value={invoiceMode}
              onChange={(e) => setInvoiceMode(e.target.value)}
              options={[
                { value: "make", label: "Make the GST invoice in the ERP" },
                { value: "upload", label: "Upload an invoice made elsewhere" },
              ]}
            />
            {invoiceMode === "make" ? (
              <div className="text-muted small mt-1">
                Numbered automatically (CM/26-27/…), at the order's prices, with HSN and CGST/SGST or IGST. If these
                pieces are already on an invoice, the dispatch is linked to it.
              </div>
            ) : (
              <div className="mt-2">
                <Upload
                  beforeUpload={handleInvoiceBeforeUpload}
                  onRemove={handleInvoiceRemove}
                  maxCount={1}
                  accept=".pdf,.png,.jpg,.jpeg"
                >
                  <Button icon={<FilePdfOutlined />}>Upload invoice</Button>
                </Upload>
                {invoiceFile && (
                  <div className="text-muted small mt-2">
                    Selected invoice: <strong>{invoiceFile.name}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* -------------------------------------------------- */}
          {/* Carrier / Tracking */}
          {/* -------------------------------------------------- */}

          <div className="fw-semibold mb-2">Transport (optional)</div>
          <div className="row g-2 mb-3">
            <div className="col-md-4">
              <Input
                placeholder="Vehicle no. e.g. DL1LAB1234"
                value={transport.vehicleNo}
                onChange={setT("vehicleNo")}
              />
            </div>
            <div className="col-md-4">
              <Input placeholder="Driver name" value={transport.driverName} onChange={setT("driverName")} />
            </div>
            <div className="col-md-4">
              <Input placeholder="Driver phone" value={transport.driverPhone} onChange={setT("driverPhone")} inputMode="tel" />
            </div>
            <div className="col-md-4">
              <Input
                placeholder="Transporter / carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <Input
                placeholder="LR / tracking no."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <Input
                placeholder="E-way bill no. (12 digits)"
                value={transport.ewayBillNo}
                onChange={setT("ewayBillNo")}
                inputMode="numeric"
                maxLength={14}
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
          {/* Gate Pass — mandatory per dispatch */}
          {/* -------------------------------------------------- */}

          <div style={{ marginBottom: 16 }}>
            <div className="fw-semibold mb-2">Gate pass</div>
            <Radio.Group
              value={gatePassMode}
              onChange={(e) => setGatePassMode(e.target.value)}
              options={[
                { value: "make", label: "Make the gate pass in the ERP" },
                { value: "upload", label: "Upload a signed gate pass" },
              ]}
            />
            {gatePassMode === "upload" && (
              <div className="mt-2">
                <Upload
                  beforeUpload={handleGatePassBeforeUpload}
                  onRemove={handleGatePassRemove}
                  maxCount={1}
                  accept=".pdf,.png,.jpg,.jpeg"
                >
                  <Button icon={<UploadOutlined />}>Upload gate pass</Button>
                </Upload>
                {gatePassFile && (
                  <div className="text-muted small mt-2">
                    Selected gate pass: <strong>{gatePassFile.name}</strong>
                  </div>
                )}
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

          {!documentsReady && (
            <div className="text-danger small mt-2">
              Attach the invoice and gate pass files, or let the ERP make them.
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default DispatchModal;
