import { useState } from "react";
import { Alert, Button, Input, InputNumber, Modal, Select, Space, Table, Typography, message } from "antd";
import { useCreateQuotationDispatchMutation, useGetQuotationDispatchesQuery } from "../../api/quotationApi";
const { Text } = Typography;
const groupsFor = line => {
 const locations = line.locations?.length ? line.locations : [line];
 return [...new Set(locations.map(loc => [loc.floorName, loc.roomName].filter(Boolean).join(" / ") || "Unassigned"))];
};
export default function QuotationDispatchModal({ open, quotation, onClose, onSuccess }) {
 const id = quotation?.quotationId;
 const { data, isFetching, error, refetch } = useGetQuotationDispatchesQuery(id, { skip: !open || !id, refetchOnMountOrArgChange: true });
 const [create, { isLoading }] = useCreateQuotationDispatchMutation();
 const [quantities, setQuantities] = useState({});
 const [group, setGroup] = useState(null);
 const [search, setSearch] = useState("");
 const [transport, setTransport] = useState({});
 const [remarks, setRemarks] = useState("");
 const lines = data?.lines || [];
 const groups = [...new Set(lines.flatMap(groupsFor))];
 const shown = lines.filter(line => (!group || groupsFor(line).includes(group)) && [line.name, line.companyCode, line.productCode].join(" ").toLowerCase().includes(search.toLowerCase()));
 const setQuantity = (line, value) => setQuantities(previous => ({ ...previous, [line.sourceLineKey]: Math.max(0, Math.min(line.remaining, Number(value) || 0)) }));
 const reset = () => { setQuantities({}); setGroup(null); setSearch(""); setTransport({}); setRemarks(""); };
 const total = lines.reduce((sum, line) => sum + (quantities[line.sourceLineKey] || 0), 0);
 const submit = async () => {
  const items = lines.filter(line => quantities[line.sourceLineKey] > 0).map(line => ({ sourceLineKey: line.sourceLineKey, productId: line.productId, quantity: quantities[line.sourceLineKey] }));
  if (!items.length) return message.error("Select products and enter dispatch quantities.");
  try {
   const result = await create({ id, items, ...transport, remarks }).unwrap();
   message.success("Dispatch recorded"); reset(); onClose(); onSuccess?.(result);
  } catch (e) { message.error(e?.data?.message || "Could not record dispatch"); refetch(); }
 };
 return <Modal title={"Dispatch from " + (quotation?.reference_number || "quotation")} open={open} width={1000} onCancel={onClose}
  afterClose={reset} onOk={submit} okText={"Dispatch selected (" + total + ")"} confirmLoading={isLoading}
  okButtonProps={{ disabled: !total || isFetching || !!error }} cancelButtonProps={{ disabled: isLoading }} closable={!isLoading} maskClosable={!isLoading}>
  <Alert type="info" showIcon message="Choose any products and quantities for this shipment. Remaining quantities include dispatches from linked orders. Stock is deducted when you confirm." style={{ marginBottom: 16 }} />
  {error && <Alert type="error" message="Could not load remaining quantities" action={<Button onClick={refetch}>Retry</Button>} />}
  <Space wrap style={{ marginBottom: 12 }}>
   <Input.Search placeholder="Find product or code" value={search} onChange={e => setSearch(e.target.value)} />
   <Select placeholder="Floor / room group" allowClear style={{ minWidth: 220 }} value={group} onChange={setGroup} options={groups.map(value => ({ value, label: value }))} />
   <Button onClick={() => setQuantities(previous => ({ ...previous, ...Object.fromEntries(shown.map(line => [line.sourceLineKey, line.remaining])) }))}>Select visible products</Button>
   <Button onClick={() => setQuantities({})}>Clear selection</Button>
  </Space>
  <Table rowKey="sourceLineKey" size="small" loading={isFetching} dataSource={shown} pagination={false} scroll={{ y: 350, x: 820 }}
   rowSelection={{ selectedRowKeys: lines.filter(line => quantities[line.sourceLineKey] > 0).map(line => line.sourceLineKey),
    getCheckboxProps: line => ({ disabled: !line.remaining }),
    onSelect: (line, selected) => setQuantity(line, selected ? line.remaining : 0),
    onSelectAll: (selected, selectedRows, changedRows) => setQuantities(previous => ({ ...previous, ...Object.fromEntries(changedRows.map(line => [line.sourceLineKey, selected ? line.remaining : 0])) })),
   }} columns={[
    { title: "Product", render: (_, line) => <><Text strong>{line.name}</Text><div><Text type="secondary">{line.companyCode || line.productCode}</Text></div><small>{groupsFor(line).join(", ")}</small></> },
    { title: "Quoted", dataIndex: "quantity", width: 80 }, { title: "Dispatched", dataIndex: "dispatched", width: 100 }, { title: "Remaining", dataIndex: "remaining", width: 90 },
    { title: "Dispatch quantity", width: 150, render: (_, line) => <InputNumber aria-label={"Dispatch quantity for " + line.name} min={0} max={line.remaining} precision={0} disabled={!line.remaining} value={quantities[line.sourceLineKey] || 0} onChange={value => setQuantity(line, value)} /> },
   ]} />
  <div className="row g-2" style={{ marginTop: 12 }}>
   {[["vehicleNo", "Vehicle number"], ["driverName", "Driver name"], ["driverPhone", "Driver phone"], ["carrier", "Carrier / transporter"], ["trackingNumber", "Tracking / LR number"], ["ewayBillNo", "E-way bill (12 digits)"]].map(([key, label]) => <div className="col-md-4" key={key}><Input placeholder={label} aria-label={label} value={transport[key] || ""} onChange={e => setTransport(previous => ({ ...previous, [key]: e.target.value }))} /></div>)}
   <div className="col-12"><Input.TextArea placeholder="Dispatch remarks" value={remarks} onChange={e => setRemarks(e.target.value)} /></div>
  </div>
  <Text type="secondary">Fixed quotation charges and discounts are allocated to the selected goods proportionately. This creates the dispatch document; GST invoices remain available through the order invoice workflow.</Text>
 </Modal>;
}
