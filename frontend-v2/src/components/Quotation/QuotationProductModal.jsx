import Loader from '../Common/Loader';
import ModalShell from '../Common/ModalShell';
import './QuotationProductModal.styles.css';
import React, { useMemo } from 'react';
import { Table, Image, Empty, Typography, Card, Tag, Divider, Alert, Collapse } from 'antd';
import { ExclamationCircleOutlined, HomeOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useGetQuotationByIdQuery } from '../../api/quotationApi';

const { Text, Title } = Typography;
const { Panel } = Collapse;

const safeParse = (data, fallback = []) => {
  if (Array.isArray(data)) return data;
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch {
    return fallback;
  }
};

const safeNum = (val, fallback = 0) => {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
};

const QuotationProductModal = ({ show, onHide, quotationId }) => {
  const {
    data: q = {},
    isLoading,
    isError,
  } = useGetQuotationByIdQuery(quotationId, {
    skip: !quotationId,
  });

  // Prefer PostgreSQL JSON products (has isOptionFor, floorId, etc.)
  const allItems = useMemo(() => {
    const products = safeParse(q.products, []);
    if (products.length > 0) return products;

    // Fallback to MongoDB items if needed
    return q.items || [];
  }, [q.products, q.items]);

  const floors = useMemo(() => safeParse(q.floors, []), [q.floors]);

  // Group items by floor → room
  const groupedItems = useMemo(() => {
    const map = {};

    allItems.forEach((item) => {
      const floorId = item.floorId || 'unassigned';
      const floorName =
        floors.find((f) => f.floorId === floorId)?.floorName ||
        item.floorName ||
        'Unassigned Floor';

      const roomId = item.roomId || 'unassigned';
      const roomName = item.roomName || 'Unassigned Room';

      const floorKey = `${floorId}|${floorName}`;
      if (!map[floorKey]) {
        map[floorKey] = {
          floorId,
          floorName,
          itemsByRoom: {},
        };
      }

      const roomKey = `${roomId}|${roomName}`;
      if (!map[floorKey].itemsByRoom[roomKey]) {
        map[floorKey].itemsByRoom[roomKey] = {
          roomId,
          roomName,
          items: [],
        };
      }

      map[floorKey].itemsByRoom[roomKey].items.push(item);
    });

    // Sort floors by sortOrder if available, else by appearance
    return Object.values(map).sort((a, b) => {
      const fa = floors.find((f) => f.floorId === a.floorId);
      const fb = floors.find((f) => f.floorId === b.floorId);
      return (fa?.sortOrder ?? 999) - (fb?.sortOrder ?? 999);
    });
  }, [allItems, floors]);

  const hasItems = allItems.length > 0;

  // Financials from calculated object (backend-provided)
  const calculated = q.calculated || {};
  const subtotal = safeNum(calculated.subTotal);
  const extraDiscountAmount = safeNum(calculated.extraDiscountAmount);
  const extraDiscountType = q.extraDiscountType || 'fixed';
  const shippingAmount = safeNum(calculated.shippingAmount);
  const gstAmount = safeNum(calculated.gstAmount);
  const roundOff = safeNum(calculated.roundOff);
  const finalAmount = safeNum(calculated.finalAmount);

  const optionalPotential = useMemo(() => {
    return allItems
      .filter((item) => !!item.isOptionFor)
      .reduce((sum, item) => sum + safeNum(item.price) * safeNum(item.quantity, 1), 0);
  }, [allItems]);

  const commonColumns = [
    {
      title: '#',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Image',
      width: 90,
      align: 'center',
      render: (_, record) => {
        const url = record.imageUrl;
        return url ? (
          <Image
            className="fv2-quotationproductmodal-3e0f72bcaf"
            src={url}
            width={56}
            height={56}

            preview={{ mask: 'View' }}
            fallback="https://via.placeholder.com/56?text=No+Img"
          />
        ) : (
          <div className="fv2-quotationproductmodal-225d492e40">No Img</div>
        );
      },
    },
    {
      title: 'Product',
      dataIndex: 'name',
      render: (name, record) => (
        <div>
          <Text strong>{name || 'Unnamed'}</Text>
          {record.productCode && (
            <Text className="fv2-quotationproductmodal-2e48c98497" type="secondary">
              {record.productCode}
            </Text>
          )}
          {record.companyCode && record.companyCode !== record.productCode && (
            <Text className="fv2-quotationproductmodal-e6b7fa1a4c" type="secondary">
              ({record.companyCode})
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Qty',
      width: 80,
      align: 'center',
      dataIndex: 'quantity',
      render: (val) => Number(val || 1),
    },
    {
      title: 'Price',
      width: 110,
      align: 'right',
      render: (_, r) => `₹${safeNum(r.price).toLocaleString('en-IN')}`,
    },
    {
      title: 'Disc',
      width: 100,
      align: 'center',
      render: (_, r) => {
        const d = safeNum(r.discount);
        if (d <= 0) return '—';
        return r.discountType === 'percent' ? `${d}%` : `₹${d.toLocaleString('en-IN')}`;
      },
    },
    {
      title: 'Total',
      width: 130,
      align: 'right',
      render: (_, r) => <Text strong>₹{safeNum(r.total).toLocaleString('en-IN')}</Text>,
    },
  ];

  const tableSummary = () => (
    <>
      <Table.Summary.Row>
        <Table.Summary.Cell colSpan={6} align="right">
          <Text strong>Subtotal (Main items only)</Text>
        </Table.Summary.Cell>
        <Table.Summary.Cell align="right">
          <Text strong>₹{subtotal.toLocaleString('en-IN')}</Text>
        </Table.Summary.Cell>
      </Table.Summary.Row>

      {extraDiscountAmount > 0 && (
        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={6} align="right">
            <Text>
              Extra Discount{' '}
              {extraDiscountType === 'percent' &&
                `(${safeNum(q.extraDiscount || extraDiscountAmount)}%)`}
            </Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell align="right">
            <Text type="danger">-₹{extraDiscountAmount.toLocaleString('en-IN')}</Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}

      {shippingAmount > 0 && (
        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={6} align="right">
            <Text>Shipping</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell align="right">
            <Text type="success">+₹{shippingAmount.toLocaleString('en-IN')}</Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}

      {gstAmount > 0 && (
        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={6} align="right">
            <Text>GST</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell align="right">
            <Text>₹{gstAmount.toLocaleString('en-IN')}</Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}

      {roundOff !== 0 && (
        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={6} align="right">
            <Text>Round Off</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell align="right">
            <Text type={roundOff >= 0 ? 'success' : 'danger'}>
              {roundOff >= 0 ? '+' : '-'}₹{Math.abs(roundOff).toLocaleString('en-IN')}
            </Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}

      <Table.Summary.Row className="fv2-quotationproductmodal-0978d7e42f">
        <Table.Summary.Cell colSpan={6} align="right">
          <Text className="fv2-quotationproductmodal-5abfb2e13b" strong>
            Final Amount
          </Text>
        </Table.Summary.Cell>
        <Table.Summary.Cell align="right">
          <Text className="fv2-quotationproductmodal-4c7cf0a4bf" strong>
            ₹{finalAmount.toLocaleString('en-IN')}
          </Text>
        </Table.Summary.Cell>
      </Table.Summary.Row>

      {optionalPotential > 0 && (
        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={7} align="center">
            <Divider plain>
              <Text type="secondary">Optional Items (not included in final amount)</Text>
            </Divider>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}
    </>
  );

  if (isLoading) {
    return (
      <ModalShell open={show} onCancel={onHide} footer={null} centered width={600}>
        <div className="fv2-quotationproductmodal-d98072594e">
          <Loader size="large" />
          <div className="fv2-quotationproductmodal-0963a4c52d">
            <Text type="secondary">Loading quotation details…</Text>
          </div>
        </div>
      </ModalShell>
    );
  }

  if (isError || !q.quotationId) {
    return (
      <ModalShell open={show} onCancel={onHide} footer={null} centered width={500}>
        <div className="fv2-quotationproductmodal-65d661d5b6">
          <ExclamationCircleOutlined className="fv2-quotationproductmodal-70117cb76b" />
          <Title className="fv2-quotationproductmodal-711340df7f" level={4}>
            Failed to load quotation
          </Title>
          <Text type="secondary">Please try again or contact support.</Text>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      open={show}
      onCancel={onHide}
      footer={null}
      width={1200}
      centered
      title={
        <div>
          <Title className="fv2-quotationproductmodal-29d886754e" level={4}>
            #{q.reference_number} {q.document_title}
          </Title>
          <Text type="secondary">
            {q.customer?.name || 'Customer'} •{' '}
            {q.quotation_date ? new Date(q.quotation_date).toLocaleDateString('en-IN') : '—'}
          </Text>
        </div>
      }
    >
      <div className="fv2-quotationproductmodal-3d2c821450">
        {!hasItems ? (
          <Card>
            <Empty description="No products found in this quotation." />
          </Card>
        ) : (
          <>
            <Collapse defaultActiveKey={['main']} bordered={false}>
              {groupedItems.map((floorGroup) => (
                <Panel
                  key={floorGroup.floorId}
                  header={
                    <span>
                      <HomeOutlined className="fv2-quotationproductmodal-c02157898c" />
                      {floorGroup.floorName}
                      <Text className="fv2-quotationproductmodal-1514e8e9a7" type="secondary">
                        (
                        {Object.values(floorGroup.itemsByRoom).reduce(
                          (sum, r) => sum + r.items.length,
                          0,
                        )}{' '}
                        items)
                      </Text>
                    </span>
                  }
                >
                  {Object.values(floorGroup.itemsByRoom).map((roomGroup) => (
                    <div className="fv2-quotationproductmodal-c85df88c8f" key={roomGroup.roomId}>
                      <div className="fv2-quotationproductmodal-49ca37eff2">
                        <ApartmentOutlined className="fv2-quotationproductmodal-c02157898c" />
                        <Text strong>{roomGroup.roomName}</Text>
                        <Text className="fv2-quotationproductmodal-4c9c944e67" type="secondary">
                          ({roomGroup.items.length} items)
                        </Text>
                      </div>

                      <Table
                        columns={commonColumns}
                        dataSource={roomGroup.items}
                        rowKey={(r, i) => r.productId || i}
                        pagination={false}
                        bordered
                        size="middle"
                        scroll={{ x: 'max-content' }}
                        summary={roomGroup.roomId === 'unassigned' ? tableSummary : undefined}
                      />

                      {roomGroup.roomId === 'unassigned' && optionalPotential > 0 && (
                        <div className="fv2-quotationproductmodal-489a57ce09">
                          <Text type="secondary">
                            Optional items potential (not included): ₹
                            {optionalPotential.toLocaleString('en-IN')}
                          </Text>
                        </div>
                      )}
                    </div>
                  ))}
                </Panel>
              ))}
            </Collapse>

            {/* Global Financial Summary (shown if no unassigned items or as fallback) */}
            {groupedItems.every((g) => g.floorId !== 'unassigned') && (
              <Card className="fv2-quotationproductmodal-0963a4c52d" title="Financial Summary">
                <Table
                  columns={[
                    { title: 'Description', dataIndex: 'desc' },
                    { title: 'Amount', dataIndex: 'amount', align: 'right' },
                  ]}
                  dataSource={[
                    {
                      desc: 'Main Subtotal',
                      amount: `₹${subtotal.toLocaleString('en-IN')}`,
                    },
                    extraDiscountAmount > 0 && {
                      desc: `Extra Discount ${extraDiscountType === 'percent' ? `(${safeNum(q.extraDiscount || extraDiscountAmount)}%)` : ''}`,
                      amount: (
                        <Text type="danger">-₹{extraDiscountAmount.toLocaleString('en-IN')}</Text>
                      ),
                    },
                    shippingAmount > 0 && {
                      desc: 'Shipping',
                      amount: (
                        <Text type="success">+₹{shippingAmount.toLocaleString('en-IN')}</Text>
                      ),
                    },
                    gstAmount > 0 && {
                      desc: 'GST',
                      amount: `₹${gstAmount.toLocaleString('en-IN')}`,
                    },
                    roundOff !== 0 && {
                      desc: 'Round Off',
                      amount: (
                        <Text type={roundOff >= 0 ? 'success' : 'danger'}>
                          {roundOff >= 0 ? '+' : '-'}₹{Math.abs(roundOff).toLocaleString('en-IN')}
                        </Text>
                      ),
                    },
                    {
                      desc: 'Final Amount',
                      amount: (
                        <Text className="fv2-quotationproductmodal-3730a5ccfc" strong>
                          ₹{finalAmount.toLocaleString('en-IN')}
                        </Text>
                      ),
                    },
                    optionalPotential > 0 && {
                      desc: 'Potential from options (not included)',
                      amount: (
                        <Text type="secondary">₹{optionalPotential.toLocaleString('en-IN')}</Text>
                      ),
                    },
                  ].filter(Boolean)}
                  pagination={false}
                  showHeader={false}
                  size="small"
                />
              </Card>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
};

export default React.memo(QuotationProductModal);
