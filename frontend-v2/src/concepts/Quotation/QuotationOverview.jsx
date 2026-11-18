import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Segmented,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import { Helmet } from 'react-helmet';
import { useGetQuotationByIdQuery } from '../../api/quotationApi';
import Loader from '../../components/Common/Loader';
import { quotationSheets } from '../../components/Quotation/hooks/quotationWorkbook';
import { isOptional } from '../../utils/quotationMath';
import './QuotationOverview.styles.css';

const asList = (value) => {
  try {
    for (let i = 0; i < 3 && typeof value === 'string'; i++) value = JSON.parse(value);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export default function QuotationOverview() {
  const { id } = useParams();
  const { data: quotation, isLoading, error, refetch } = useGetQuotationByIdQuery(id);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('room');
  const [selected, setSelected] = useState('all');
  const [page, setPage] = useState(1);
  const register = useMemo(() => {
    try {
      const products = asList(quotation?.products || quotation?.items);
      const sheets = quotationSheets(products, quotation || {});
      // The complete list keeps quotation lines intact; location sheets split quantities.
      const floors = asList(quotation?.floors);
      const rows = products.map((product) => {
        const locations = product.locations?.length ? product.locations : [product];
        const names = locations.map((location) => {
          const floor = floors.find((item) => item.floorId === location.floorId);
          const room = floor?.rooms?.find((item) => item.roomId === location.roomId);
          return {
            floor: location.floorName || floor?.floorName || 'Unassigned floor',
            room: location.roomName || room?.roomName || 'Unassigned room',
          };
        });
        return {
          ...product,
          floorName: [...new Set(names.map((location) => location.floor))].join(', '),
          roomName: [...new Set(names.map((location) => location.room))].join(', '),
        };
      });
      return { sheets, rows };
    } catch (cause) {
      return { sheets: [], rows: [], error: cause.message };
    }
  }, [quotation]);
  const groups = register.sheets.filter((sheet) => sheet.id.startsWith(`${mode}:`));
  const active = groups.find((group) => group.id === selected);
  const rows = (active?.rows || register.rows).map((row, index) => ({
    ...row,
    key: index,
    floorName: row.floorName || 'Unassigned floor',
    roomName: row.roomName || 'Unassigned room',
  }));
  const query = search.trim().toLowerCase();
  const filtered = rows.filter((row) =>
    [
      row.name,
      row.companyCode,
      row.productCode,
      row.description,
      row.brand,
      row.floorName,
      row.roomName,
    ].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(query),
    ),
  );
  const columns = [
    {
      title: 'Product',
      dataIndex: 'name',
      width: 260,
      render: (name, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{name || 'Unnamed product'}</Typography.Text>
          {row.description && <Typography.Text type="secondary">{row.description}</Typography.Text>}
          {isOptional(row) && <Tag>Optional</Tag>}
        </Space>
      ),
    },
    {
      title: 'Code',
      key: 'code',
      width: 150,
      render: (_, row) => row.companyCode || row.productCode || '—',
    },
    { title: 'Floor', dataIndex: 'floorName', width: 170 },
    { title: 'Room', dataIndex: 'roomName', width: 170 },
    {
      title: 'Quantity',
      key: 'quantity',
      align: 'right',
      width: 110,
      render: (_, row) => row.quantity ?? row.qty ?? 1,
    },
    { title: 'Unit', key: 'unit', width: 90, render: (_, row) => row.unit || row.uom || '—' },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="quotation-overview">
          <Helmet>
            <title>Quotation overview</title>
          </Helmet>
          <div className="quotation-overview__header">
            <div>
              <Typography.Text type="secondary">QUOTATION OVERVIEW</Typography.Text>
              <Typography.Title level={2}>
                {quotation?.reference_number || 'Quotation'}
              </Typography.Title>
              <Typography.Text type="secondary">
                Find products and their assigned rooms and floors.
              </Typography.Text>
            </div>
            <Link to={`/quotation/${id}`}>
              <Button icon={<ArrowLeftOutlined />}>Quotation details</Button>
            </Link>
          </div>
          {isLoading ? (
            <Loader />
          ) : error ? (
            <Alert
              type="error"
              showIcon
              message="Could not load quotation"
              action={<Button onClick={refetch}>Retry</Button>}
            />
          ) : register.error ? (
            <Alert
              type="error"
              showIcon
              message="Could not build location overview"
              description={register.error}
            />
          ) : (
            <Card>
              <div className="quotation-overview__controls">
                <Input
                  aria-label="Search quotation products, codes, rooms or floors"
                  placeholder="Search products, codes, rooms or floors…"
                  prefix={<SearchOutlined />}
                  allowClear
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
                <Segmented
                  aria-label="Group by location"
                  options={[
                    { label: 'Rooms', value: 'room' },
                    { label: 'Floors', value: 'floor' },
                  ]}
                  value={mode}
                  onChange={(value) => {
                    setMode(value);
                    setSelected('all');
                    setPage(1);
                  }}
                />
              </div>
              <Tabs
                activeKey={active?.id || 'all'}
                onChange={(value) => {
                  setSelected(value);
                  setPage(1);
                }}
                items={[
                  { key: 'all', label: 'All products' },
                  ...groups.map((group) => ({
                    key: group.id,
                    label: group.label.replace(/^(Room|Floor) · /, ''),
                  })),
                ]}
              />
              <Typography.Paragraph type="secondary">
                {filtered.length} of {rows.length} {active ? 'product allocations' : 'products'} ·{' '}
                {active
                  ? 'Quantities reflect the selected location.'
                  : 'Each quotation product is shown once with its total quantity.'}{' '}
                Optional products are marked separately.
              </Typography.Paragraph>
              <Table
                columns={columns}
                dataSource={filtered}
                scroll={{ x: 950 }}
                pagination={{
                  current: page,
                  onChange: setPage,
                  pageSize: 20,
                  showSizeChanger: false,
                  hideOnSinglePage: true,
                }}
                locale={{
                  emptyText: (
                    <Empty
                      description={
                        query ? 'No products match your search' : 'No products in this quotation'
                      }
                    />
                  ),
                }}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
