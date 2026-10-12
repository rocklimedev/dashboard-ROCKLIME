import { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Input, InputNumber, Modal, Select, Space, Spin, Table, Typography, message } from 'antd';
import { useMergeInventoryProductsMutation, usePreviewProductMergeMutation } from '../../api/inventoryBulkApi';

const money = value => value == null ? 'Not set' : `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export default function MergeProductsModal({ products, onCancel, onMerged }) {
  const [keeperId, setKeeperId] = useState(products[0]?.productId);
  const sourceId = products.find(product => product.productId !== keeperId)?.productId;
  const [preview, setPreview] = useState(null);
  const [failure, setFailure] = useState(null);
  const [reload, setReload] = useState(0);
  const [stockMode, setStockMode] = useState('keep');
  const [priceMode, setPriceMode] = useState('keep');
  const [quantity, setQuantity] = useState(null);
  const [sellingPrice, setSellingPrice] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [note, setNote] = useState('');
  const [getPreview, { isLoading: loading }] = usePreviewProductMergeMutation();
  const [merge, { isLoading: merging }] = useMergeInventoryProductsMutation();
  useEffect(() => {
    let active = true;
    const request = getPreview({ keeperId, sourceId });
    request.unwrap().then(data => {
      if (!active) return;
      setPreview(data); setQuantity(Number(data.keeper.quantity)); setSellingPrice(data.keeper.sellingPrice);
      setStockMode('keep'); setPriceMode('keep');
    }).catch(error => { if (active) setFailure(error?.data?.message || 'Could not load the merge preview.'); });
    return () => { active = false; request.abort(); };
  }, [keeperId, sourceId, reload, getPreview]);
  const finalQuantity = !preview ? null : stockMode === 'sum' ? Number(preview.keeper.quantity) + Number(preview.source.quantity) : stockMode === 'source' ? Number(preview.source.quantity) : stockMode === 'custom' ? quantity : Number(preview.keeper.quantity);
  const finalPrice = !preview ? null : priceMode === 'source' ? preview.source.sellingPrice : priceMode === 'custom' ? sellingPrice : preview.keeper.sellingPrice;
  const validQuantity = Number.isSafeInteger(finalQuantity) && finalQuantity >= 0 && finalQuantity <= 2147483647;
  const validPrice = priceMode === 'keep' && finalPrice == null || typeof finalPrice === 'number' && Number.isFinite(finalPrice) && finalPrice >= 0 && finalPrice <= 999999999999;
  const submit = async () => {
    try {
      const result = await merge({ keeperId, sourceId, fingerprint: preview.fingerprint, stockMode, priceMode, ...(stockMode === 'custom' ? { quantity } : {}), ...(priceMode === 'custom' ? { sellingPrice } : {}), note }).unwrap();
      message.success(result.message); onMerged(result);
    } catch (error) { setFailure(error?.data?.message || 'Merge failed. Refresh the preview before trying again.'); setConfirmed(false); }
  };
  const downloadPreview = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ ...preview, choices: { stockMode, priceMode, finalQuantity, finalPrice }, note }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `product-merge-preview-${keeperId}-${sourceId}.json`;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <Modal open title="Merge two products" width={950} onCancel={() => !merging && onCancel()} onOk={submit} okText="Merge products" confirmLoading={merging} okButtonProps={{ danger: true, disabled: loading || !preview || preview.blockers.length > 0 || !confirmed || !validQuantity || !validPrice || !!failure }} cancelButtonProps={{ disabled: merging }} closable={!merging} maskClosable={!merging}>
    <Typography.Paragraph>Choose the product to keep. The other product will be removed after its supported references, inventory history and keywords are transferred.</Typography.Paragraph>
    <Space wrap style={{ marginBottom: 16 }}>
      <Typography.Text strong>Keep product</Typography.Text>
      <Select style={{ minWidth: 300, maxWidth: '100%' }} value={keeperId} disabled={merging} onChange={value => { setKeeperId(value); setPreview(null); setFailure(null); setConfirmed(false); }} options={products.map(product => ({ value: product.productId, label: `${product.name} (${product.product_code})` }))} />
      <Button disabled={loading || merging} onClick={() => { setReload(value => value + 1); setPreview(null); setFailure(null); setConfirmed(false); }}>Refresh preview</Button>
      <Button disabled={!preview || merging} onClick={downloadPreview}>Download preview JSON</Button>
    </Space>
    {failure && <Alert type="error" showIcon message={failure} style={{ marginBottom: 16 }} />}
    <Spin spinning={loading}>
      {preview && <>
        <Table rowKey="productId" size="small" pagination={false} scroll={{ x: 650 }} dataSource={[{ ...preview.keeper, decision: 'Keep' }, { ...preview.source, decision: 'Remove' }]} columns={[
          { title: 'Action', dataIndex: 'decision' }, { title: 'Product', dataIndex: 'name' }, { title: 'Company code', render: () => preview.companyCode },
          { title: 'Stock', dataIndex: 'quantity' }, { title: 'Selling price', dataIndex: 'sellingPrice', render: money },
        ]} />
        {preview.blockers.map((blocker, index) => <Alert key={index} type="error" showIcon message={blocker} style={{ marginTop: 12 }} />)}
        <Space wrap style={{ marginTop: 20 }}>
          <Typography.Text strong>Final stock</Typography.Text>
          <Select disabled={merging} value={stockMode} onChange={value => { setStockMode(value); setConfirmed(false); }} style={{ width: 230 }} options={[{ value: 'keep', label: 'Keep selected product stock' }, { value: 'sum', label: 'Combine both stocks' }, { value: 'source', label: 'Use removed product stock' }, { value: 'custom', label: 'Enter final stock' }]} />
          {stockMode === 'custom' && <InputNumber disabled={merging} min={0} max={2147483647} precision={0} value={quantity} onChange={value => { setQuantity(value); setConfirmed(false); }} />}
          <Typography.Text strong>{finalQuantity ?? '—'} units</Typography.Text>
        </Space>
        <Space wrap style={{ marginTop: 16, marginBottom: 16 }}>
          <Typography.Text strong>Final selling price</Typography.Text>
          <Select disabled={merging} value={priceMode} onChange={value => { setPriceMode(value); setConfirmed(false); }} style={{ width: 230 }} options={[{ value: 'keep', label: 'Keep selected product price' }, { value: 'source', label: 'Use removed product price' }, { value: 'custom', label: 'Enter selling price' }]} />
          {priceMode === 'custom' && <InputNumber disabled={merging} min={0} max={999999999999} precision={2} value={sellingPrice} onChange={value => { setSellingPrice(value); setConfirmed(false); }} />}
          <Typography.Text strong>{money(finalPrice)}</Typography.Text>
        </Space>
        <Alert type="info" showIcon message={`${preview.historyRecordsToTransfer} inventory history records will move to the kept product. Original history quantities and dates remain recorded. Keywords and images are combined. The kept product's name, internal code and conflicting metadata stay; missing metadata is filled from the other product.`} />
        <details style={{ margin: '16px 0' }}><summary>Review {preview.differences.length} product field differences</summary><pre style={{ maxHeight: 250, overflow: 'auto', whiteSpace: 'pre-wrap', marginTop: 8 }}>{JSON.stringify(preview.differences, null, 2)}</pre></details>
        {preview.references.length > 0 && <Table size="small" rowKey={row => `${row.storage}-${row.model}`} pagination={false} dataSource={preview.references} columns={[{ title: 'Records', dataIndex: 'model', render: value => value.replace(/([a-z])([A-Z])/g, '$1 $2') }, { title: 'Count', dataIndex: 'records' }, { title: 'Merge action', dataIndex: 'action' }]} />}
        <Input.TextArea value={note} disabled={merging} onChange={event => setNote(event.target.value)} maxLength={2000} placeholder="Merge note (optional)" style={{ marginTop: 16 }} />
        <Checkbox checked={confirmed} disabled={merging || preview.blockers.length > 0} onChange={event => setConfirmed(event.target.checked)} style={{ marginTop: 16 }}>I confirm these are the same product and have reviewed the final stock and price.</Checkbox>
      </>}
    </Spin>
  </Modal>;
}
