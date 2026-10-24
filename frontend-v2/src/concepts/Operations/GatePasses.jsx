import './GatePasses.styles.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, DatePicker, Input, Space, Table, Tag, Typography } from 'antd';
import { PrinterOutlined, PaperClipOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useGetGatePassesQuery } from '../../api/stockApi';
import './operations.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

/** Operations → Gate passes: every dispatch with its printable gate pass. */
export default function GatePasses() {
  const [search, setSearch] = useState('');
  const [range, setRange] = useState([dayjs().subtract(30, 'day'), dayjs()]);
  const [page, setPage] = useState(1);
  const { data, isFetching } = useGetGatePassesQuery({
    search,
    from: range?.[0]?.format('YYYY-MM-DD'),
    to: range?.[1]?.format('YYYY-MM-DD'),
    page,
    limit: 50,
  });

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="ops-head">
          <div>
            <Title className="fv2-gatepasses-fa530646a3" level={4}>
              Gate passes
            </Title>
            <Text type="secondary">
              One for every dispatch. Print it for the driver; the guard can scan its QR code to
              check it.
            </Text>
          </div>
          <Space wrap>
            <Input.Search
              className="fv2-gatepasses-eb17ac99a3"
              placeholder="Order, customer, vehicle, LR"
              allowClear
              onSearch={(v) => {
                setSearch(v);
                setPage(1);
              }}
            />
            <RangePicker
              value={range}
              onChange={(v) => {
                setRange(v);
                setPage(1);
              }}
              format="D MMM YYYY"
            />
          </Space>
        </div>
        <Card className="ops-panel">
          <Table
            rowKey="id"
            loading={isFetching}
            dataSource={data?.data || []}
            pagination={{
              current: page,
              pageSize: 50,
              total: data?.total || 0,
              onChange: setPage,
              showSizeChanger: false,
            }}
            scroll={{ x: 900 }}
            columns={[
              { title: 'Gate pass', dataIndex: 'gpNo', render: (v) => <Text strong>{v}</Text> },
              {
                title: 'Date',
                render: (_, r) => dayjs(r.dispatchDate || r.createdAt).format('D MMM, h:mm a'),
                width: 140,
              },
              {
                title: 'Order',
                dataIndex: 'orderNo',
                render: (v, r) => <Link to={`/order/${r.orderId}`}>#{v}</Link>,
              },
              { title: 'Customer', dataIndex: 'customer', ellipsis: true },
              {
                title: 'Vehicle',
                render: (_, r) => [r.vehicleNo, r.driverName].filter(Boolean).join(' · ') || '—',
              },
              { title: 'Pieces', dataIndex: 'totalQuantity', align: 'right', width: 80 },
              {
                title: 'Status',
                width: 110,
                render: (_, r) =>
                  r.deliveredAt || r.status === 'DELIVERED' ? (
                    <Tag color="green">Delivered</Tag>
                  ) : r.status === 'RETURNED' ? (
                    <Tag>Returned</Tag>
                  ) : (
                    <Tag color="blue">On the road</Tag>
                  ),
              },
              {
                title: '',
                width: 170,
                render: (_, r) => (
                  <Space size={4}>
                    <Button
                      size="small"
                      icon={<PrinterOutlined />}
                      href={r.printLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Print
                    </Button>
                    {r.uploaded && (
                      <Button
                        size="small"
                        type="text"
                        icon={<PaperClipOutlined />}
                        href={r.uploaded}
                        target="_blank"
                        rel="noreferrer"
                        title="Uploaded gate pass"
                      />
                    )}
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
