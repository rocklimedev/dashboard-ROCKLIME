import { Button, Collapse, Input, InputNumber, Space, Typography } from "antd";

export default function QuotationCartDetails({ data, onChange, items, setItems }) {
  const charges = data.miscellaneousChargeItems || [];
  const editCharge = (index, key, value) => onChange("miscellaneousChargeItems", charges.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const editItem = (index, key, value) => setItems(previous => previous.map((item, i) => i === index ? { ...item, [key]: value } : item));
  return <Collapse style={{ marginBottom: 16 }} items={[{ key: "details", label: "Quotation details & adjustments", children: <Space direction="vertical" style={{ width: "100%" }}>
    <label style={{ width: "100%" }}>Document title<Input value={data.documentTitle || ""} onChange={event => onChange("documentTitle", event.target.value)} /></label>
    <label>Quotation date<Input type="date" value={data.quotationDate || ""} onChange={event => onChange("quotationDate", event.target.value)} /></label>
    <label style={{ width: "100%" }}>Signature name<Input value={data.signatureName ?? ""} onChange={event => onChange("signatureName", event.target.value)} /></label>
    <label style={{ width: "100%" }}>Signature image<Input value={data.signatureImage || ""} onChange={event => onChange("signatureImage", event.target.value)} /></label>
    <Space wrap>
      <label>Additional discount <InputNumber min={0} value={data.additionalDiscount || 0} onChange={value => onChange("additionalDiscount", value || 0)} /></label>
      <label>Flat goods price <InputNumber min={0} placeholder="No override" value={data.flatPrice ?? null} onChange={value => onChange("flatPrice", value)} /></label>
    </Space>
    <Typography.Text strong>Miscellaneous charges</Typography.Text>
    {charges.map((row, index) => <Space key={index} wrap>
      <Input aria-label={`Charge ${index + 1} name`} value={row.name} onChange={event => editCharge(index, "name", event.target.value)} />
      <InputNumber aria-label={`Charge ${index + 1} amount`} min={0} value={row.amount} onChange={value => editCharge(index, "amount", value || 0)} />
      <Button danger onClick={() => onChange("miscellaneousChargeItems", charges.filter((_, i) => i !== index))}>Remove</Button>
    </Space>)}
    <Button onClick={() => onChange("miscellaneousChargeItems", [...charges, { name: "Miscellaneous charges", amount: 0 }])}>Add charge</Button>
    {items.length > 0 && <Typography.Text strong>Product price overrides</Typography.Text>}
    {items.map((item, index) => <Space key={`${item.productId}-${index}`} wrap>
      <Typography.Text>{item.name || item.productId}</Typography.Text>
      <label>Additional discount per unit <InputNumber min={0} value={item.additionalDiscount || 0} onChange={value => editItem(index, "additionalDiscount", value || 0)} /></label>
      <label>Flat unit price <InputNumber min={0} placeholder="No override" value={item.flatPrice ?? null} onChange={value => editItem(index, "flatPrice", value)} /></label>
    </Space>)}
  </Space> }]} />;
}
