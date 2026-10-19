// Purchase order page: status, receiving, and the PO itself as the vendor receives it.
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Space, Spin, Tag, Typography, message } from "antd";
import { ArrowLeftOutlined, DownloadOutlined, FileExcelOutlined, EditOutlined, WhatsAppOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Helmet } from "react-helmet";
import { useGetPurchaseOrderByIdQuery } from "../../api/poApi";
import PoReceivingPanel from "../../components/Stock/PoReceivingPanel";
import ServerPdfFrame from "../../components/Common/ServerPdfFrame";
import { API_URL } from "../../store/config";
import { token } from "../../components/Quotation/quotationPdf";

import PdfExportOptions from "../../components/Common/PdfExportOptions";
import { buildPoExcel, fetchPoExport, PO_EXPORT_FIELDS, savePoExport } from "./poExport";

const { Title, Text } = Typography;
const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const STATUS = {
  pending: ["Draft", "default"],
  in_negotiation: ["In negotiation", "gold"],
  confirmed: ["Confirmed", "blue"],
  partial_delivered: ["Part received", "orange"],
  delivered: ["Received", "green"],
  cancelled: ["Cancelled", "red"],
};

export default function PODetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: po, isLoading, error } = useGetPurchaseOrderByIdQuery(id);
  const [busy, setBusy] = useState(null);
  const [exportOptions, setExportOptions] = useState({ hidden: [] });
  const loadPdf = useCallback(() => fetchPoExport(id, exportOptions), [id, exportOptions]);
  const setHidden = hidden => setExportOptions({ hidden });
  const customExport = exportOptions.hidden.length > 0;

  if (isLoading) return <Spin style={{ display: "block", marginTop: 100 }} />;
  if (error || !po) return <div className="page-wrapper"><div className="content">{error?.data?.message || "Purchase order not found"}</div></div>;

  const [label, color] = STATUS[po.status] || [po.status, "default"];
  const download = async () => {
    setBusy("pdf");
    try {
      const { blob } = await fetchPoExport(id, exportOptions);
      savePoExport(blob, `PO-${po.poNumber}.pdf`);
    } catch (e) {
      message.error(e.message);
    } finally {
      setBusy(null);
    }
  };
  const downloadExcel = async () => {
    setBusy("excel");
    try { savePoExport(await buildPoExcel(po, exportOptions.hidden), `PO-${po.poNumber}.xlsx`); }
    catch (e) { message.error(e.message || "Could not export Excel"); }
    finally { setBusy(null); }
  };
  const send = async () => {
    setBusy("wa");
    try {
      const r = await fetch(`${API_URL}/purchase-orders/${id}/share`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Could not make a link");
      window.open(d.whatsapp, "_blank");
    } catch (e) {
      message.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page-wrapper">
      <Helmet>
        <title>PO {po.poNumber}</title>
      </Helmet>
      <div className="content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <Space size={8} align="center">
              <Title level={4} style={{ margin: 0 }}>
                PO {po.poNumber}
              </Title>
              <Tag color={color}>{label}</Tag>
            </Space>
            <div>
              <Text type="secondary">
                {[po.vendor?.vendorName, inr(po.totalAmount), po.expectDeliveryDate ? `deliver by ${dayjs(po.expectDeliveryDate).format("D MMM")}` : null].filter(Boolean).join(" · ")}
              </Text>
            </div>
          </div>
          <Space wrap>
            <PdfExportOptions fields={PO_EXPORT_FIELDS} hidden={exportOptions.hidden} onHiddenChange={setHidden} onReset={() => setHidden([])} />
            <Button disabled={customExport} title={customExport ? "Reset export options to share the standard PO link" : undefined} type="primary" icon={<WhatsAppOutlined />} loading={busy === "wa"} onClick={send} style={{ background: "#25D366", borderColor: "#25D366" }}>
              Send to vendor
            </Button>
            <Button icon={<DownloadOutlined />} loading={busy === "pdf"} onClick={download}>
              PDF
            </Button>
            <Button icon={<FileExcelOutlined />} loading={busy === "excel"} onClick={downloadExcel}>Excel</Button>
            {!["delivered", "cancelled"].includes(po.status) && (
              <Button icon={<EditOutlined />} onClick={() => navigate(`/po/${id}/edit`)}>
                Edit
              </Button>
            )}
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/purchase-manager")}>
              Back
            </Button>
          </Space>
        </div>
        <PoReceivingPanel po={po} />
        <div style={{ maxWidth: 1000, margin: "16px auto 0" }}>
          <ServerPdfFrame loadPdf={loadPdf} path={`/purchase-orders/${id}/pdf`} refreshKey={`${po.updatedAt}-${po.status}`} />
        </div>
      </div>
    </div>
  );
}
