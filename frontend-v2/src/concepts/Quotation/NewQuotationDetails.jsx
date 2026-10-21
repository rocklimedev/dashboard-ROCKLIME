// Quotation page: status and follow-ups at the top, then the quotation itself,
// shown as the same PDF the customer receives (the Chhabra Marble format).
import { useCallback, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { message, Button, Space, Typography, Spin, Alert, Select, Tag, Modal, Checkbox, Table } from "antd";
import { ArrowLeftOutlined, FileExcelFilled } from "@ant-design/icons";
import { Helmet } from "react-helmet";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import DocumentExportOptions from "../../components/Quotation/DocumentExportOptions";
import QuotationDispatchModal from "../../components/Orders/QuotationDispatchModal";
import { useGetQuotationByIdQuery, useGetQuotationVersionsQuery, useCloneQuotationMutation, useGetQuotationDispatchesQuery } from "../../api/quotationApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import { useGetAddressByIdQuery } from "../../api/addressApi";
import { buildQuotationWorkbook, quotationSheets, hasRoomAssignments, addQuotationImages } from "../../components/Quotation/hooks/quotationWorkbook";
import { getSafeTitle } from "../../components/Quotation/hooks/exportHelpers";
import QuotationPdfActions from "../../components/Quotation/QuotationPdfActions";
import QuotationPdfFrame from "../../components/Quotation/QuotationPdfFrame";
import { QuotationPipelineBar } from "../../components/Quotation/QuotationPipeline";
import { orderStateFromQuotation } from "../../components/Quotation/convertToOrder";
import useCan from "../../utils/useCan";

dayjs.extend(relativeTime);
const { Title, Text } = Typography;

const asList = (data) => {
  let v = data;
  for (let i = 0; i < 3 && typeof v === "string"; i++) {
    try {
      v = JSON.parse(v);
    } catch {
      return [];
    }
  }
  return Array.isArray(v) ? v : [];
};
const titleFor = (gender) => ({ male: "Mr.", female: "Ms." })[(gender || "").toLowerCase()] || "";

export default function NewQuotationsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const can = useCan();
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [excelOpen, setExcelOpen] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [version, setVersion] = useState("current");
  const [pdfStyle, setPdfStyle] = useState("detailed");
  const [pdfCover, setPdfCover] = useState(true);
  const [exportOptions, setExportOptions] = useState({ hidden: [] });
  const [pages, setPages] = useState([]);
  const [pageOrder, setPageOrder] = useState(null);
  const onPagesChange = useCallback((next) => setPages(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next), []);
  const resetPages = () => { setPageOrder(null); setPages([]); };
  const [isExporting, setIsExporting] = useState(false);

  const { data: quotation, isLoading: qLoading, error: qError } = useGetQuotationByIdQuery(id);
  const { data: versionsData } = useGetQuotationVersionsQuery(id);
  const { data: dispatchData, isFetching: dispatchLoading } = useGetQuotationDispatchesQuery(id);
  const fullyDispatched = dispatchData?.fullyDispatched === true;
  const linkedOrder = dispatchData?.orders?.[0];
  const [cloneQuotation] = useCloneQuotationMutation();

  // saved versions, newest first; "current" is the live quotation
  const versions = useMemo(
    () => (Array.isArray(versionsData) ? [...versionsData] : []).sort((a, b) => (b.version || 0) - (a.version || 0)),
    [versionsData],
  );
  const versionObj = versions.find((v) => v.version === version);
  const shown = versionObj?.quotationData ? { ...quotation, ...versionObj.quotationData } : quotation || {};
  const items = versionObj ? asList(versionObj.quotationItems) : asList(quotation?.products || quotation?.items);

  const { data: customerResponse } = useGetCustomerByIdQuery(shown.customerId, { skip: !shown.customerId });
  const { data: addressResponse } = useGetAddressByIdQuery(shown.shipTo, { skip: !shown.shipTo });
  const customer = customerResponse?.data;
  const address = addressResponse || {};
  const customerName = customer?.name ? customer.displayName || `${customer.title || titleFor(customer.gender)} ${customer.name}`.trim() : "";
  const excelProducts = useMemo(() => [...items].sort((a, b) => Number(a.priority ?? 9999) - Number(b.priority ?? 9999)), [items]);
  const sheetOptions = useMemo(() => quotationSheets(excelProducts, shown), [excelProducts, shown]);

  const handleExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = buildQuotationWorkbook({
        products: excelProducts,
        customerName: customerName || "Dear Client",
        quotation: shown,
        address: [address.street, address.city, address.state].filter(Boolean).join(", ") + (address.postalCode ? ` - ${address.postalCode}` : ""),
        activeVersion: version,
        selectedSheets,
      });
      await addQuotationImages(workbook, { products: excelProducts, quotation: shown, selectedSheets });
      const buffer = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${getSafeTitle(shown)}_V${version}.xlsx`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExcelOpen(false);
      message.success("Excel exported");
    } catch (error) {
      message.error(error.message || "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (qLoading) return <Spin size="large" style={{ marginTop: 100, display: "block", textAlign: "center" }} />;
  if (qError || !quotation) return <Alert message="Quotation not found" type="error" showIcon style={{ margin: 40 }} />;

  const pdfVersion = version !== "current" ? version : null;

  return (
    <>
      <QuotationDispatchModal open={dispatchOpen} quotation={quotation} onClose={() => setDispatchOpen(false)} onSuccess={result => navigate(`/dispatch/${result.dispatch.id}`)} />
      <Modal title="Dispatch history" open={historyOpen} onCancel={() => setHistoryOpen(false)} footer={null} width={1100}>
        <Table rowKey="id" loading={dispatchLoading} dataSource={dispatchData?.dispatches || []} scroll={{ x: 950 }} expandable={{ expandedRowRender: dispatch => <Table rowKey={(_, index) => index} pagination={false} dataSource={asList(dispatch.items)} columns={[
          { title: "Product", dataIndex: "name" }, { title: "Code", render: (_, item) => item.companyCode || item.productCode || "—" }, { title: "Quantity", dataIndex: "quantity" },
        ]} /> }} columns={[
          { title: "Dispatch", render: (_, dispatch) => <Button type="link" onClick={() => navigate(`/dispatch/${dispatch.id}`)}>#{dispatch.dispatchNumber || dispatch.id.slice(0, 8)}</Button> },
          { title: "Date", render: (_, dispatch) => dispatch.dispatchDate || dispatch.createdAt ? dayjs(dispatch.dispatchDate || dispatch.createdAt).format("DD MMM YYYY, hh:mm A") : "—" },
          { title: "Status", dataIndex: "status", render: status => <Tag>{status}</Tag> },
          { title: "Quantity", render: (_, dispatch) => dispatch.totalQuantity ?? asList(dispatch.items).reduce((sum, item) => sum + Number(item.quantity || 0), 0) },
          { title: "Carrier", dataIndex: "carrier" }, { title: "Tracking", dataIndex: "trackingNumber" }, { title: "Remarks", dataIndex: "remarks" },
        ]} />
      </Modal>
      <Modal title="Excel export — choose sheets" open={excelOpen} onCancel={() => setExcelOpen(false)} onOk={handleExcel} okText="Export Excel" confirmLoading={isExporting} okButtonProps={{ disabled: !selectedSheets.length }}>
        <Alert type="info" showIcon message="Excel includes all pricing fields and optional products. PDF field and page selections apply only to PDF. Summary totals always cover the complete quotation." style={{ marginBottom: 16 }} />
        <Space style={{ marginBottom: 12 }}><Button onClick={() => setSelectedSheets(sheetOptions.map(sheet => sheet.id))}>Select all</Button><Button onClick={() => setSelectedSheets([])}>Clear</Button></Space>
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
          <Checkbox.Group value={selectedSheets} onChange={setSelectedSheets} style={{ display: "flex", flexDirection: "column", gap: 10 }} options={sheetOptions.map(sheet => ({ value: sheet.id, label: sheet.label }))} />
        </div>
      </Modal>
      <Helmet>
        <title>
          {quotation.reference_number || "Quotation"} · {customerName || quotation.document_title || ""}
        </title>
      </Helmet>
      <div className="page-wrapper">
        <div className="content" style={{ padding: 0 }}>
          <div style={{ padding: "14px 24px", background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ minWidth: 260 }}>
                <Space size={8} align="center">
                  <Title level={4} style={{ margin: 0 }}>
                    {quotation.reference_number || "Quotation"}
                  </Title>
                  {version !== "current" && <Tag color="blue">Version {version}</Tag>}
                </Space>
                <div style={{ marginTop: 2 }}>
                  <Text type="secondary">{[customerName, quotation.document_title].filter(Boolean).join(" · ") || "No customer"}</Text>
                </div>
              </div>
              <Space size={10} wrap align="center">
                {fullyDispatched && linkedOrder
                  ? <Button type="primary" onClick={() => navigate(`/order/${linkedOrder.id}`)}>View order #{linkedOrder.orderNo}</Button>
                  : !fullyDispatched && can("quotations", "write") && can("orders", "view") && can("orders", "write") && <Button type="primary" disabled={version !== "current" || dispatchLoading} onClick={() => setDispatchOpen(true)}>Dispatch products</Button>}
                {dispatchData?.dispatches?.length > 0 && can("orders", "view") && <Button onClick={() => setHistoryOpen(true)}>Dispatch history</Button>}
                {versions.length > 0 && (
                  <Select
                    value={version}
                    onChange={(value) => { setVersion(value); resetPages(); }}
                    style={{ width: 190 }}
                    options={[
                      { value: "current", label: "Current version" },
                      ...versions.map((v) => ({
                        value: v.version,
                        label: `Version ${v.version}${v.updatedAt ? ` · ${dayjs(v.updatedAt).fromNow()}` : ""}`,
                      })),
                    ]}
                  />
                )}
                <DocumentExportOptions pdfOnly hasRooms={hasRoomAssignments(items)} exportOptions={exportOptions} setExportOptions={setExportOptions} pages={pages} pageOrder={pageOrder} setPageOrder={setPageOrder} setPdfCover={setPdfCover} />
                <QuotationPdfActions
                  quotationId={id}
                  version={pdfVersion}
                  style={pdfStyle}
                  onStyleChange={(value) => { setPdfStyle(value); resetPages(); }}
                  cover={pdfCover}
                  onCoverChange={(value) => { setPdfCover(value); resetPages(); }}
                  exportOptions={exportOptions}
                  pageOrder={pageOrder}
                  showPreview={false}
                />
                <Button loading={isExporting} onClick={() => { setSelectedSheets(sheetOptions.map(sheet => sheet.id)); setExcelOpen(true); }} icon={<FileExcelFilled />}>
                  Excel
                </Button>
                <Button onClick={() => navigate("/quotations/list")} icon={<ArrowLeftOutlined />}>
                  Back
                </Button>
              </Space>
            </div>
          </div>

          <div style={{ padding: "0 24px" }}>
            <QuotationPipelineBar
              quotation={quotation}
              canEdit={can("quotations", "edit")}
              canConvert={!fullyDispatched && !linkedOrder && !dispatchLoading && can("orders", "view") && can("orders", "write")}
              onConvert={() => navigate("/order/add", { state: orderStateFromQuotation(quotation) })}
              onEdit={() => navigate(`/quotation/${id}/edit`, { state: { quotation } })}
              onRecreate={can("quotations", "write") ? () => navigate(`/cart/quotation?recreate=${encodeURIComponent(id)}`) : undefined}
              onDuplicate={
                can("quotations", "write")
                  ? async () => {
                      try {
                        const r = await cloneQuotation(id).unwrap();
                        const newId = r?.clonedQuotation?.quotationId;
                        message.success("Copy created as a draft");
                        if (newId) navigate(`/quotation/${newId}`);
                      } catch (e) {
                        message.error(e?.data?.message || "Could not duplicate");
                      }
                    }
                  : undefined
              }
            />
          </div>

          {/* The quotation exactly as the customer receives it */}
          <div style={{ padding: "16px 24px 32px", background: "#f6f6f6" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <QuotationPdfFrame
                quotationId={id}
                version={pdfVersion}
                style={pdfStyle}
                cover={pdfCover}
                exportOptions={exportOptions}
                pageOrder={pageOrder}
                onPagesChange={onPagesChange}
                refreshKey={`${quotation.updatedAt || ""}-${quotation.status || ""}-${quotation.finalAmount || ""}`}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
