import Loader from '../../components/Common/Loader';
import './ProductReferencesPage.styles.css';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Image,
  Input,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useGetProductByIdQuery, useGetProductReferencesQuery } from '../../api/productApi';
import PageHeader from '../../components/Common/PageHeader';
import { productImage } from '../../components/Quotation/productSyncHelpers';

const labels = { quotation: 'Quotation', order: 'Order', po: 'Purchase Order', fgs: 'FGS' };
const money = (value) =>
  value == null
    ? '—'
    : `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value) => (value ? new Date(value).toLocaleDateString('en-IN') : '—');

export default function ProductReferencesPage() {
  const { productId } = useParams();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const {
    data: product,
    isLoading: loadingProduct,
    error: productError,
  } = useGetProductByIdQuery(productId);
  const { currentData: data, isFetching, error, refetch } = useGetProductReferencesQuery(productId);
  const references = data?.references || [];
  const rows = references.filter(
    (r) =>
      (tab === 'all' || r.type === tab) &&
      `${r.number} ${r.party} ${r.status}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const counts = Object.fromEntries(
    Object.keys(labels).map((key) => [key, references.filter((r) => r.type === key).length]),
  );
  const lineColumns = [
    { title: 'Product', dataIndex: 'name' },
    { title: 'Quantity', dataIndex: 'quantity' },
    { title: 'Unit price', dataIndex: 'price', render: money },
    {
      title: 'Discount',
      render: (_, p) => (p.discountType === 'percent' ? `${p.discount}%` : money(p.discount)),
    },
    { title: 'Tax', dataIndex: 'tax', render: (value) => value ?? '—' },
    { title: 'Line total', dataIndex: 'total', render: money },
    { title: 'Option', dataIndex: 'optionType', render: (value) => value || '—' },
    {
      title: 'Floor / room',
      render: (_, p) =>
        p.locations.length
          ? p.locations.map((l, index) => (
              <div key={index}>
                {[l.floorName, l.roomName].filter(Boolean).join(' / ') || 'Unassigned'} · Qty{' '}
                {l.assignedQuantity}
              </div>
            ))
          : '—',
    },
  ];
  return (
    <div className="page-wrapper">
      <PageHeader title="References" subtitle="Where this product is used across your documents" />
      <div className="content">
        <Space className="fv2-productreferencespage-ca44629c70" wrap>
          <Link to="/inventory/list">
            <Button icon={<ArrowLeftOutlined />}>Inventory</Button>
          </Link>
          <Link to={`/product/${encodeURIComponent(productId)}`}>
            <Button>Product details</Button>
          </Link>
          <Link to={`/product/${encodeURIComponent(productId)}/inventory`}>
            <Button>Stock history</Button>
          </Link>
          <Button icon={<ReloadOutlined />} loading={isFetching} onClick={refetch}>
            Refresh references
          </Button>
        </Space>
        {loadingProduct && <Loader />}
        {productError && (
          <Alert
            className="fv2-productreferencespage-37ea7fee10"
            type="error"
            showIcon
            message="Could not load product details"
          />
        )}
        {product && (
          <Card className="fv2-productreferencespage-ca44629c70">
            <Space align="start" size="large" wrap>
              {productImage(product) && (
                <Image
                  className="fv2-productreferencespage-f4ae513038"
                  src={productImage(product)}
                  alt={product.name}
                  width={88}
                  height={88}
                />
              )}
              <div>
                <Typography.Title className="fv2-productreferencespage-e3b9ea0364" level={4}>
                  {product.name}
                </Typography.Title>
                <Descriptions
                  size="small"
                  column={2}
                  items={[
                    { key: 'code', label: 'Product code', children: product.product_code || '—' },
                    {
                      key: 'company',
                      label: 'Company code',
                      children: product.meta?.['d11da9f9-3f2e-4536-8236-9671200cca4a'] || '—',
                    },
                    { key: 'stock', label: 'Current stock', children: product.quantity ?? 0 },
                    {
                      key: 'refs',
                      label: 'Documents',
                      children: isFetching && !data ? 'Loading…' : references.length,
                    },
                  ]}
                />
              </div>
            </Space>
          </Card>
        )}
        <Card>
          {error && (
            <Alert
              className="fv2-productreferencespage-37ea7fee10"
              type="error"
              showIcon
              message="Could not load references. Use Refresh references to retry."
            />
          )}
          <Input
            className="fv2-productreferencespage-c224b12cf1"
            prefix={<SearchOutlined />}
            placeholder="Search document number, customer/vendor, or status"
            allowClear
            value={search}

            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Tabs
            activeKey={tab}
            onChange={(key) => {
              setTab(key);
              setPage(1);
            }}
            items={[
              { key: 'all', label: `All (${references.length})` },
              ...Object.entries(labels).map(([key, label]) => ({
                key,
                label: `${label} (${counts[key]})`,
              })),
            ]}
          />
          <Table
            loading={isFetching}
            rowKey="key"
            dataSource={rows}
            scroll={{ x: 850 }}
            pagination={{
              current: page,
              onChange: setPage,
              defaultPageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `${total} documents`,
            }}
            locale={{
              emptyText: error ? 'References unavailable' : 'No references found for this product',
            }}
            columns={[
              { title: 'Document', render: (_, r) => <Link to={r.href}>{r.number}</Link> },
              { title: 'Type', render: (_, r) => labels[r.type] },
              { title: 'Date', dataIndex: 'date', render: date },
              { title: 'Customer / vendor', dataIndex: 'party' },
              { title: 'Status', dataIndex: 'status', render: (value) => <Tag>{value}</Tag> },
              { title: 'Product quantity', dataIndex: 'quantity' },
            ]}
            expandable={{
              expandedRowRender: (r) => (
                <Table
                  size="small"
                  pagination={false}
                  dataSource={r.lines.map((line, index) => ({ ...line, key: index }))}
                  columns={lineColumns}
                  scroll={{ x: 900 }}
                />
              ),
            }}
          />
        </Card>
      </div>
    </div>
  );
}
