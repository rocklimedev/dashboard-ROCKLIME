import ProductDeleteModal from './ProductDeleteModal';
import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import { useAuth } from '../../context/AuthContext';
import {
  useUpdateSelectedInventoryMutation,
  useDeleteSelectedInventoryMutation,
  useExportSelectedInventoryMutation,
} from '../../api/inventoryBulkApi';
import { exportInventoryExcel } from '../../utils/inventoryExcel';
import MergeProductsModal from './MergeProductsModal';

export default function InventoryBulkActions({
  products,
  clearSelection,
  getCompanyCode,
  getSellingPrice,
  onComplete,
}) {
  const { auth } = useAuth();
  const elevated = [...(auth?.user?.roles || []), auth?.role].some((role) =>
    ['SUPER_ADMIN', 'DEVELOPER'].includes(role),
  );
  const can = (action) =>
    elevated ||
    (auth?.permissions || []).some(
      (permission) =>
        ['products', 'inventory'].includes(permission.module) && permission.action === action,
    );
  const [update, { isLoading: updating }] = useUpdateSelectedInventoryMutation();
  const [remove, { isLoading: deleting }] = useDeleteSelectedInventoryMutation();
  const [exportData, { isLoading: exporting }] = useExportSelectedInventoryMutation();
  const [writing, setWriting] = useState(false);
  const [mode, setMode] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [stockMode, setStockMode] = useState('set');
  const [priceMode, setPriceMode] = useState('set');
  const [stockValue, setStockValue] = useState(null);
  const [priceValue, setPriceValue] = useState(null);
  const [note, setNote] = useState('');
  const busy = updating || deleting || exporting || writing;
  const errorMessage = (error) =>
    message.error(error?.data?.message || error?.message || 'Bulk action failed.');
  const openEditor = (type) => {
    setDrafts(
      products.map((product) => ({
        productId: product.productId,
        name: product.name,
        companyCode: getCompanyCode(product.metaDetails),
        oldQuantity: Number(product.quantity),
        oldPrice: getSellingPrice(product.metaDetails),
        quantity: Number(product.quantity),
        sellingPrice: getSellingPrice(product.metaDetails),
      })),
    );
    setStockMode('set');
    setPriceMode('set');
    setStockValue(null);
    setPriceValue(null);
    setNote('');
    setMode(type);
  };
  const patchDraft = (id, field, value) =>
    setDrafts((current) =>
      current.map((row) => (row.productId === id ? { ...row, [field]: value } : row)),
    );
  const applyAll = () => {
    const value = mode === 'stock' ? stockValue : priceValue;
    if (value == null || !Number.isFinite(value)) return message.warning('Enter a value to apply.');
    if (mode === 'stock' && (!Number.isSafeInteger(value) || value < 0))
      return message.warning('Stock must be a nonnegative whole number.');
    if (mode === 'price' && (priceMode === 'set' ? value < 0 : value < -100))
      return message.warning('Enter a nonnegative price or a percentage of at least -100%.');
    const next = drafts.map((row) =>
      mode === 'stock'
        ? {
            ...row,
            quantity:
              stockMode === 'add'
                ? row.oldQuantity + value
                : stockMode === 'remove'
                  ? row.oldQuantity - value
                  : value,
          }
        : {
            ...row,
            sellingPrice:
              priceMode === 'percent'
                ? row.oldPrice == null
                  ? null
                  : Math.round(row.oldPrice * (1 + value / 100) * 100) / 100
                : value,
          },
    );
    if (
      next.some((row) =>
        mode === 'stock'
          ? row.quantity < 0 || row.quantity > 2147483647
          : row.sellingPrice == null || row.sellingPrice < 0,
      )
    )
      return message.warning(
        mode === 'stock'
          ? 'Some products have insufficient stock or exceed the stock limit.'
          : 'Some selected products have no existing selling price. Enter their prices individually.',
      );
    setDrafts(next);
  };
  const save = async () => {
    if (
      drafts.some((row) =>
        mode === 'stock'
          ? !Number.isSafeInteger(row.quantity) || row.quantity < 0 || row.quantity > 2147483647
          : typeof row.sellingPrice !== 'number' ||
            !Number.isFinite(row.sellingPrice) ||
            row.sellingPrice < 0,
      )
    )
      return message.warning('Enter a valid value for every selected product.');
    const changed = drafts.filter((row) =>
      mode === 'stock' ? row.quantity !== row.oldQuantity : row.sellingPrice !== row.oldPrice,
    );
    if (!changed.length) return message.info('No values have changed.');
    try {
      const response = await update({
        updates: changed.map((row) =>
          mode === 'stock'
            ? {
                productId: row.productId,
                quantity: row.quantity,
                expectedQuantity: row.oldQuantity,
              }
            : {
                productId: row.productId,
                sellingPrice: row.sellingPrice,
                expectedSellingPrice: row.oldPrice,
              },
        ),
        message: note,
      }).unwrap();
      message.success(response.message);
      setMode(null);
      clearSelection();
      onComplete('update');
    } catch (error) {
      errorMessage(error);
    }
  };
  const deleteSelected = async () => {
    try {
      const response = await remove(products.map((product) => product.productId)).unwrap();
      message.success(response.message);
      setMode(null);
      clearSelection();
      onComplete('delete');
    } catch (error) {
      errorMessage(error);
    }
  };
  const exportSelected = async (format, includeHistory = false) => {
    try {
      const snapshot = await exportData({
        productIds: products.map((product) => product.productId),
        includeHistory,
      }).unwrap();
      setWriting(true);
      if (format === 'excel') await exportInventoryExcel(snapshot, includeHistory);
      else {
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }),
        );
        const link = document.createElement('a');
        link.href = url;
        link.download = `selected-products-${snapshot.exportedAt.slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      message.success('Selected products exported.');
    } catch (error) {
      errorMessage(error);
    } finally {
      setWriting(false);
    }
  };
  if (!products.length) return null;
  return (
    <>
      <Card style={{ marginTop: 20 }} size="small">
        <Space wrap>
          <Typography.Text strong>
            {products.length} selected across pages (maximum 500)
          </Typography.Text>
          <Button disabled={busy} onClick={clearSelection}>
            Clear selection
          </Button>
          {can('edit') && (
            <>
              <Button disabled={busy} onClick={() => openEditor('stock')}>
                Update stock
              </Button>
              <Button disabled={busy} onClick={() => openEditor('price')}>
                Update prices
              </Button>
            </>
          )}
          {can('export') && (
            <>
              <Button disabled={busy} onClick={() => exportSelected('excel')}>
                Export products to Excel
              </Button>
              <Button disabled={busy} onClick={() => exportSelected('json')}>
                Export products JSON
              </Button>
              <Button
                loading={exporting || writing}
                disabled={updating || deleting}
                onClick={() => exportSelected('excel', true)}
              >
                Export inventory records to Excel
              </Button>
            </>
          )}
          {can('delete') && (
            <Button danger disabled={busy} onClick={() => setMode('delete')}>
              Delete selected
            </Button>
          )}
          {can('edit') && can('delete') && (
            <Button disabled={busy || products.length !== 2} onClick={() => setMode('merge')}>
              Merge two products
            </Button>
          )}
        </Space>
      </Card>
      {mode === 'merge' && (
        <MergeProductsModal
          products={products}
          onCancel={() => setMode(null)}
          onMerged={() => {
            setMode(null);
            clearSelection();
            onComplete('merge');
          }}
        />
      )}
      {mode === 'delete' && (
        <ProductDeleteModal
          products={products}
          onCancel={() => !busy && setMode(null)}
          onConfirm={deleteSelected}
          isLoading={deleting}
        />
      )}
      <Modal
        title={mode === 'stock' ? 'Update selected stock' : 'Update selected selling prices'}
        open={mode === 'stock' || mode === 'price'}
        width={900}
        onCancel={() => !updating && setMode(null)}
        onOk={save}
        confirmLoading={updating}
        okText="Save changes"
        cancelButtonProps={{ disabled: updating }}
        closable={!updating}
        maskClosable={!updating}
      >
        <Alert
          type="info"
          showIcon
          message="Review the new values for each product. If stock or prices have changed since selection, the whole update is rejected so you can refresh and try again."
          style={{ marginBottom: 16 }}
        />
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            disabled={updating}
            value={mode === 'stock' ? stockMode : priceMode}
            onChange={mode === 'stock' ? setStockMode : setPriceMode}
            style={{ width: 190 }}
            options={
              mode === 'stock'
                ? [
                    { value: 'set', label: 'Set stock to' },
                    { value: 'add', label: 'Add stock' },
                    { value: 'remove', label: 'Remove stock' },
                  ]
                : [
                    { value: 'set', label: 'Set selling price to' },
                    { value: 'percent', label: 'Change price by %' },
                  ]
            }
          />
          <InputNumber
            disabled={updating}
            value={mode === 'stock' ? stockValue : priceValue}
            onChange={mode === 'stock' ? setStockValue : setPriceValue}
            min={mode === 'price' && priceMode === 'percent' ? -100 : 0}
            precision={mode === 'stock' ? 0 : 2}
            placeholder={
              mode === 'stock'
                ? 'Quantity'
                : priceMode === 'percent'
                  ? 'Percentage'
                  : 'Price in INR'
            }
          />
          <Button disabled={updating} onClick={applyAll}>
            Apply to all selected
          </Button>
        </Space>
        <Table
          rowKey="productId"
          dataSource={drafts}
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 650 }}
          columns={[
            { title: 'Product', dataIndex: 'name' },
            { title: 'Company code', dataIndex: 'companyCode' },
            {
              title: 'Current value',
              render: (_, row) =>
                mode === 'stock'
                  ? row.oldQuantity
                  : row.oldPrice == null
                    ? 'Not set'
                    : `₹${row.oldPrice}`,
            },
            {
              title: mode === 'stock' ? 'New stock' : 'New price (INR)',
              render: (_, row) => (
                <InputNumber
                  disabled={updating}
                  min={0}
                  max={mode === 'stock' ? 2147483647 : 999999999999}
                  precision={mode === 'stock' ? 0 : 2}
                  value={mode === 'stock' ? row.quantity : row.sellingPrice}
                  onChange={(value) =>
                    patchDraft(row.productId, mode === 'stock' ? 'quantity' : 'sellingPrice', value)
                  }
                />
              ),
            },
          ]}
        />
        {mode === 'stock' && (
          <Input.TextArea
            disabled={updating}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={2000}
            placeholder="Note for inventory history (optional)"
            style={{ marginTop: 16 }}
          />
        )}
      </Modal>
    </>
  );
}
