import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Input, Modal, Result, Select, Space, Steps, Table, Tabs, Typography, Upload, message } from "antd";
import { ArrowLeftOutlined, FileExcelOutlined, UploadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useGetAllProductMetaQuery } from "../../api/productMetaApi";
import { usePreviewBrandOnboardingMutation, useCommitBrandOnboardingMutation } from "../../api/brandOnboardingApi";
import PageHeader from "../../components/Common/PageHeader";

const fields = { name: "Product name", product_code: "Product code", companyCode: "Company code", sellingPrice: "Selling price",
  quantity: "Initial stock", category: "Category", parentCategory: "Parent category", description: "Description", images: "Image URLs", keywords: "Keywords", tax: "Tax (%)" };
const normalize = (value) => String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
const aliases = { productname: "name", name: "name", productcode: "product_code", sku: "product_code", code: "product_code",
  companycode: "companyCode", sellingprice: "sellingPrice", price: "sellingPrice", quantity: "quantity", stock: "quantity",
  initialstock: "quantity", category: "category", categoryname: "category", parentcategory: "parentCategory", description: "description",
  images: "images", image: "images", imageurls: "images", keywords: "keywords", tax: "tax", gst: "tax" };

export default function OnboardNewBrandWorkspace() {
  const { data: brands = [] } = useGetAllBrandsQuery();
  const { data: metas = [], isLoading: loadingMetadata } = useGetAllProductMetaQuery();
  const [workbook, setWorkbook] = useState(null);
  const [sheet, setSheet] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [mapping, setMapping] = useState({});
  const [extra, setExtra] = useState({});
  const [brandId, setBrandId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [review, setReview] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState(null);
  const revision = useRef(0);
  const [preview, { isLoading: checking }] = usePreviewBrandOnboardingMutation();
  const [commit, { isLoading: saving }] = useCommitBrandOnboardingMutation();
  const changed = () => { revision.current += 1; setReview(null); };
  const loadSheet = (book, sheetName) => {
    const cells = XLSX.utils.sheet_to_json(book.Sheets[sheetName], { header: 1, raw: false, defval: "", blankrows: true });
    const headerIndex = cells.findIndex((r) => r.some((v) => String(v).trim()));
    if (headerIndex < 0) throw new Error("This sheet is empty.");
    const names = cells[headerIndex].map((h, i) => String(h).trim() || `Column ${i + 1}`);
    const data = cells.slice(headerIndex + 1).map((r, i) => ({ key: headerIndex + i + 2, cells: names.map((_, c) => String(r[c] ?? "")) }))
      .filter((r) => r.cells.some((v) => v.trim()));
    if (!data.length || data.length > 1000) throw new Error("Use a sheet with 1–1000 product rows. Split larger sheets before uploading.");
    const used = new Set(); const next = {}; const metadata = {};
    names.forEach((header, i) => {
      const known = aliases[normalize(header)];
      const meta = metas.find((m) => normalize(m.title) === normalize(header));
      const target = known || (meta ? `meta:${meta.id}` : `new:${i}`);
      next[i] = used.has(target) ? "ignore" : target; used.add(target);
      metadata[i] = { title: header, fieldType: meta?.fieldType === "number" ? "number" : "string" };
    });
    setSheet(sheetName); setHeaders(names); setRows(data); setSelected(data.map((r) => r.key));
    setMapping(next); setExtra(metadata); changed(); setResult(null);
  };
  const upload = async (file) => {
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Workbook must be under 10 MB.");
      const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
      loadSheet(book, book.SheetNames[0]); setWorkbook(book);
    } catch (error) { message.error(error.message || "Could not read this workbook."); }
    return false;
  };
  const payload = () => {
    const active = Object.entries(mapping).filter(([, value]) => value !== "ignore");
    const targets = active.map(([, value]) => value);
    if (!targets.includes("name") || !targets.includes("product_code")) throw new Error("Map product name and product code columns.");
    if (new Set(targets).size !== targets.length) throw new Error("Map each destination field only once.");
    const extendedFields = active.filter(([, value]) => value.startsWith("meta:") || value.startsWith("new:")).map(([index, value]) => {
      const definition = metas.find((m) => `meta:${m.id}` === value);
      return { key: index, title: definition?.title || extra[index].title,
        fieldType: definition ? definition.fieldType === "string" ? "string" : "number" : extra[index].fieldType,
        ...(definition ? { metaId: definition.id } : {}) };
    });
    const data = rows.filter((r) => selected.includes(r.key)).map((r) => {
      const product = { sourceRow: r.key, extended: {} };
      active.forEach(([index, value]) => {
        if (value.startsWith("meta:") || value.startsWith("new:")) product.extended[index] = r.cells[index];
        else product[value] = r.cells[index];
      });
      return product;
    });
    return { ...(brandId ? { brandId } : { brandName }), rows: data, fields: extendedFields };
  };
  const validate = async () => {
    try {
      const version = revision.current;
      const body = payload();
      const response = await preview(body).unwrap();
      if (version !== revision.current) return message.info("Data changed during validation. Review again to use the latest edits.");
      setReview({ ...response, body });
    }
    catch (error) { message.error(error.data?.message || error.message || "Review failed."); }
  };
  const importData = async () => {
    try { const response = await commit(review.body).unwrap(); setResult(response); setConfirmed(false); }
    catch (error) { setConfirmed(false); setReview(null); message.error(error.data?.message || "Import failed. Review again before retrying."); }
  };
  const template = () => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
      ["Product Name", "Product Code", "Company Code", "Selling Price", "Quantity", "Category", "Parent Category", "Description", "Image URLs", "Keywords", "Tax", "Finish", "Material"],
      ["Sample product", "NEW-BRAND-001", "00123", 1500, 0, "Taps", "Bathroom", "Example only — replace or exclude this row", "", "tap,bathroom", 18, "Chrome", "Brass"],
    ]), "Products"); XLSX.writeFile(book, "brand-onboarding-template.xlsx");
  };
  if (result) return <div className="page-wrapper"><div className="content"><Result status="success"
    title={`${result.brandName} is ready`} subTitle={`${result.products} products imported with categories and metadata.`}
    extra={<Space><Link to={`/inventory/list?brandId=${result.brandId}`}><Button type="primary">View inventory</Button></Link>
      <Button onClick={() => { setResult(null); setWorkbook(null); setRows([]); setReview(null); setSelected([]); }}>Start another workbook</Button></Space>} /></div></div>;
  return <div className="page-wrapper"><PageHeader title="Onboard New Brand Workspace" subtitle="Upload, review, and create a brand catalog from Excel" /><div className="content">
    <Space wrap style={{ marginBottom: 20 }}><Link to="/inventory/list"><Button icon={<ArrowLeftOutlined />}>Inventory</Button></Link>
      <Link to="/operations"><Button>Operations</Button></Link><Button icon={<FileExcelOutlined />} onClick={template}>Download template</Button></Space>
    <Steps current={review ? 2 : workbook ? 1 : 0} items={[{ title: "Upload Excel" }, { title: "Map and edit" }, { title: "Review and create" }]} style={{ marginBottom: 24 }} />
    <Card title="Brand and workbook" style={{ marginBottom: 20 }}><Space wrap align="start">
      <Select style={{ width: 260 }} value={brandId} onChange={(v) => { setBrandId(v); changed(); }} options={[
        { value: "", label: "Create a new brand" }, ...brands.map((b) => ({ value: b.id, label: b.brandName })),
      ]} showSearch optionFilterProp="label" />
      {!brandId && <Input placeholder="New brand name" value={brandName} maxLength={100} style={{ width: 260 }} onChange={(e) => { setBrandName(e.target.value); changed(); }} />}
      <Upload accept=".xlsx,.xls" beforeUpload={upload} showUploadList={false} disabled={loadingMetadata}><Button icon={<UploadOutlined />} loading={loadingMetadata}>Upload Excel</Button></Upload>
      {workbook && <Select style={{ width: 240 }} value={sheet} options={workbook.SheetNames.map((name) => ({ value: name, label: name }))}
        onChange={(value) => { try { loadSheet(workbook, value); } catch (error) { message.error(error.message); } }} />}
    </Space></Card>
    {workbook && <><Alert type="info" showIcon style={{ marginBottom: 16 }} message="Review each column and row before creating. Unmapped extra columns default to new metadata fields. Excluded rows are not imported. Existing products are never overwritten." />
      <Tabs items={[
        { key: "data", label: `Excel data (${rows.length} rows)`, children: <Table size="small" rowKey="key" dataSource={rows} scroll={{ x: Math.max(900, headers.length * 180) }} pagination={{ pageSize: 20 }}
          rowSelection={{ selectedRowKeys: selected, onChange: (keys) => { setSelected(keys); changed(); } }}
          columns={[{ title: "Excel row", dataIndex: "key", width: 90, fixed: "left" }, ...headers.map((header, i) => ({ title: header, width: 180,
            render: (_, r) => <Input value={r.cells[i]} onChange={(e) => { const value = e.target.value; setRows((prev) => prev.map((p) => p.key === r.key ? { ...p, cells: p.cells.map((v, c) => c === i ? value : v) } : p)); changed(); }} /> }))]} /> },
        { key: "mapping", label: "Column mapping & extended fields", children: <Table pagination={false} rowKey="index" dataSource={headers.map((header, index) => ({ header, index }))} columns={[
          { title: "Excel column", dataIndex: "header" }, { title: "Import as", render: (_, r) => <Select style={{ width: 280 }} showSearch optionFilterProp="label" value={mapping[r.index]} onChange={(v) => { setMapping((prev) => ({ ...prev, [r.index]: v })); changed(); }} options={[
            { value: "ignore", label: "Ignore column" }, ...Object.entries(fields).map(([value, label]) => ({ value, label })),
            ...metas.map((m) => ({ value: `meta:${m.id}`, label: `Metadata: ${m.title}` })), { value: `new:${r.index}`, label: "Create new metadata field" },
          ]} /> }, { title: "New field title / type", render: (_, r) => mapping[r.index]?.startsWith("new:") ? <Space>
            <Input value={extra[r.index]?.title} onChange={(e) => { setExtra((prev) => ({ ...prev, [r.index]: { ...prev[r.index], title: e.target.value } })); changed(); }} />
            <Select value={extra[r.index]?.fieldType} options={[{ value: "string", label: "Text" }, { value: "number", label: "Number" }]} onChange={(v) => { setExtra((prev) => ({ ...prev, [r.index]: { ...prev[r.index], fieldType: v } })); changed(); }} />
          </Space> : "—" },
        ]} /> },
      ]} />
      <Space style={{ margin: "20px 0" }}><Button type="primary" loading={checking} disabled={!selected.length} onClick={validate}>Review {selected.length} selected products</Button></Space>
      {review && <Card title="Creation review">
        <Alert type={review.errors.length ? "error" : "success"} showIcon message={review.errors.length ? "Resolve the errors below, then review again" : "Validation passed. Ready to create."} />
        <Typography.Paragraph style={{ marginTop: 16 }}>{review.summary.products} products · Categories: {review.summary.categories.join(", ") || "None"} · Parent categories: {review.summary.parentCategories.join(", ") || "None"}</Typography.Paragraph>
        <Table size="small" rowKey="title" pagination={false} dataSource={review.summary.extendedFields} columns={[{ title: "Extended field", dataIndex: "title" }, { title: "Action", dataIndex: "action" }]} />
        {!!review.errors.length && <Table size="small" rowKey={(_, i) => i} dataSource={review.errors} columns={[{ title: "Excel row", dataIndex: "row" }, { title: "Errors", dataIndex: "messages", render: (values) => values.join("; ") }]} />}
        <Button type="primary" disabled={!!review.errors.length} style={{ marginTop: 16 }} onClick={() => setConfirmed(true)}>Create brand catalog</Button>
      </Card>}
    </>}
    <Modal title="Create reviewed catalog" open={confirmed} onCancel={() => !saving && setConfirmed(false)} confirmLoading={saving} onOk={importData} okText="Create catalog" closable={!saving} maskClosable={!saving} cancelButtonProps={{ disabled: saving }}>
      Create {review?.summary.products} new products for {brands.find((b) => b.id === brandId)?.brandName || brandName}, along with the reviewed categories and metadata fields?
    </Modal>
  </div></div>;
}
