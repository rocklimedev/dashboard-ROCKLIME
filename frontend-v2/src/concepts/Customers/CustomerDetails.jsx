import Loader from '../../components/Common/Loader';
import './CustomerDetails.styles.css';
import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGetCustomerByIdQuery, useGetCustomerOverviewQuery } from '../../api/customerApi';
import {
  useGetAllAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} from '../../api/addressApi';

import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  WalletOutlined,
  CarOutlined,
  AuditOutlined,
  TeamOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons';

import { Card, Table, Tag, Space, Typography, Avatar, Button, Modal, Tabs, Statistic, Row, Col, Timeline, Empty, Alert } from 'antd';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet';
import moment from 'moment';

import AddressModal from '../../components/modals/AddAddressModal';
import { QuotationStatusTag } from '../../components/Quotation/QuotationPipeline';
import { useGetCustomerDealsQuery, useGetCrmMetaQuery } from '../../api/crmApi';
import useCan from '../../utils/useCan';
import DealDrawer from '../CRM/DealDrawer';
import DealFormModal from '../CRM/DealFormModal';
import { lakh } from '../CRM/crmUtils';

const { Title, Text } = Typography;

const formatDate = (date) => (date ? moment(date).format('DD MMM YYYY') : '—');
const inr = (amt) => `₹${Number(amt || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const getInitials = (name) =>
  name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'CU';

const TIMELINE_META = {
  quotation: { color: 'blue', icon: <FileTextOutlined />, link: (id) => `/quotation/${id}` },
  order: { color: 'green', icon: <ShoppingCartOutlined />, link: (id) => `/order/${id}` },
  payment: { color: 'gold', icon: <WalletOutlined />, link: (id) => `/order/${id}` },
  invoice: { color: 'purple', icon: <AuditOutlined />, link: (id) => `/order/${id}` },
  dispatch: { color: 'cyan', icon: <CarOutlined />, link: (id) => `/order/${id}` },
};

const orderTag = (s) => (
  <Tag
    color={
      s === 'DELIVERED'
        ? 'success'
        : s === 'CANCELED'
          ? 'error'
          : s === 'DRAFT'
            ? 'default'
            : 'processing'
    }
  >
    {String(s || '').replace(/_/g, ' ')}
  </Tag>
);

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const can = useCan();
  const canCrm = can('crm', 'view');
  const { data: dealsData } = useGetCustomerDealsQuery(id, { skip: !id || !canCrm });
  const { data: crmMeta } = useGetCrmMetaQuery(undefined, { skip: !canCrm });
  const deals = dealsData?.data || [];
  const [dealOpen, setDealOpen] = useState(null);
  const [newDeal, setNewDeal] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const { data: customerData } = useGetCustomerByIdQuery(id);
  const {
    data: ov,
    isLoading: ovLoading,
    isError: ovError,
  } = useGetCustomerOverviewQuery(id, { skip: !id });
  const customer = ov?.customer || customerData?.data || {};
  const stats = ov?.stats || {};

  const { data: addressesData, refetch: refetchAddresses } = useGetAllAddressesQuery(
    { customerId: customer?.customerId },
    { skip: !customer?.customerId },
  );

  const [createAddress] = useCreateAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();

  const addresses = useMemo(
    () => (addressesData || []).filter((a) => a.customerId === customer.customerId),
    [addressesData, customer.customerId],
  );
  const quotations = ov?.quotations || [];
  const orders = ov?.orders || [];
  const payments = ov?.payments || [];
  const invoices = ov?.invoices || [];
  const timeline = ov?.timeline || [];
  const referrals = ov?.referrals || [];

  const primaryAddress = addresses.find((a) => a.status === 'PRIMARY') || addresses[0];

  const handleEditCustomer = () => {
    navigate(`/customer/edit/${customer.customerId}`, { state: { customer } });
  };

  const whatsappReminder = () => {
    const phone = String(customer.mobileNumber || '')
      .replace(/\D/g, '')
      .slice(-10);
    const text = `Dear ${customer.name}, a gentle reminder that ${inr(stats.due)} is pending against your orders with us. Kindly arrange the payment at the earliest. Thank you.`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const openAddressModal = (addr = null) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const handleAddressSave = async (values) => {
    try {
      if (editingAddress?.addressId) {
        await updateAddress({
          addressId: editingAddress.addressId,
          updatedData: { ...values, customerId: customer.customerId },
        }).unwrap();
        toast.success('Address updated');
      } else {
        await createAddress({
          ...values,
          customerId: customer.customerId,
          status: addresses.length === 0 ? 'PRIMARY' : 'ADDITIONAL',
        }).unwrap();
        toast.success('Address added');
      }
      setIsModalOpen(false);
      setEditingAddress(null);
      refetchAddresses();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = (addressId) => {
    Modal.confirm({
      title: 'Delete Address',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteAddress(addressId).unwrap();
          toast.success('Address deleted');
          refetchAddresses();
        } catch {
          toast.error('Delete failed');
        }
      },
    });
  };

  const tabItems = [
    {
      key: 'timeline',
      label: 'Timeline',
      children:
        timeline.length === 0 ? (
          <Empty description="No activity yet" />
        ) : (
          <Timeline
            items={timeline.map((e, i) => {
              const meta = TIMELINE_META[e.type] || TIMELINE_META.order;
              return {
                key: `${e.type}-${i}`,
                color: meta.color,
                dot: meta.icon,
                children: (
                  <div>
                    <Link to={meta.link(e.id)}>
                      <strong>{e.title}</strong>
                    </Link>
                    <div>
                      <Text type="secondary">{e.detail}</Text>
                    </div>
                    <small>{moment(e.at).format('DD MMM YYYY, h:mm a')}</small>
                  </div>
                ),
              };
            })}
          />
        ),
    },
    {
      key: 'quotations',
      label: `Quotations (${quotations.length})`,
      children:
        quotations.length === 0 ? (
          <Empty description="No quotations yet" />
        ) : (
          <Table
            dataSource={quotations}
            rowKey="quotationId"
            size="small"
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: 'Ref No',
                dataIndex: 'reference_number',
                render: (text, r) => <Link to={`/quotation/${r.quotationId}`}>{text || '—'}</Link>,
              },
              { title: 'Title', dataIndex: 'document_title', ellipsis: true },
              {
                title: 'Status',
                dataIndex: 'status',
                width: 140,
                render: (s, r) => <QuotationStatusTag status={s} lostReason={r.lostReason} />,
              },
              {
                title: 'Amount',
                dataIndex: 'finalAmount',
                align: 'right',
                render: (v) => <strong>{inr(v)}</strong>,
              },
              { title: 'Date', dataIndex: 'quotation_date', render: formatDate, width: 110 },
            ]}
          />
        ),
    },
    canCrm && {
      key: 'deals',
      label: `Deals (${deals.length})`,
      children: (
        <div>
          {can('crm', 'write') && (
            <Button
              className="fv2-customerdetails-46bb660607"
              size="small"
              type="primary"

              onClick={() => setNewDeal(true)}
            >
              + New deal
            </Button>
          )}
          {deals.length === 0 ? (
            <Empty description="No CRM deals for this customer" />
          ) : (
            <Table
              dataSource={deals}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Deal',
                  dataIndex: 'title',
                  render: (t, r) => <a onClick={() => setDealOpen(r.id)}>{t}</a>,
                },
                {
                  title: 'Stage',
                  dataIndex: 'stage',
                  width: 170,
                  render: (st) => {
                    const x = crmMeta?.stages?.find((m) => m.id === st);
                    return <Tag color={x?.color}>{x?.label || st}</Tag>;
                  },
                },
                {
                  title: 'Value',
                  dataIndex: 'amount',
                  align: 'right',
                  render: (v) => (v ? lakh(v) : '—'),
                },
                { title: 'Owner', dataIndex: 'ownerName', width: 130 },
                {
                  title: 'Next follow-up',
                  dataIndex: 'nextTask',
                  render: (n) =>
                    n
                      ? `${n.dueDate ? moment(n.dueDate).format('D MMM') + ' · ' : ''}${n.title}`
                      : '—',
                },
              ]}
            />
          )}
          <DealDrawer id={dealOpen} open={!!dealOpen} onClose={() => setDealOpen(null)} />
          <DealFormModal
            open={newDeal}
            defaults={{ customerId: id }}
            onClose={() => setNewDeal(false)}
            onSaved={(d) => d?.id && setDealOpen(d.id)}
          />
        </div>
      ),
    },
    {
      key: 'orders',
      label: `Orders (${orders.length})`,
      children:
        orders.length === 0 ? (
          <Empty description="No orders yet" />
        ) : (
          <Table
            dataSource={orders}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: 'Order No',
                dataIndex: 'orderNo',
                render: (t, r) => (
                  <Link to={`/order/${r.id}`}>
                    <strong>{t}</strong>
                  </Link>
                ),
              },
              { title: 'Status', dataIndex: 'status', width: 150, render: orderTag },
              { title: 'Amount', dataIndex: 'finalAmount', align: 'right', render: (v) => inr(v) },
              { title: 'Date', dataIndex: 'createdAt', render: formatDate, width: 110 },
              { title: 'Due', dataIndex: 'dueDate', render: formatDate, width: 110 },
            ]}
          />
        ),
    },
    {
      key: 'payments',
      label: `Payments (${payments.length})`,
      children:
        payments.length === 0 ? (
          <Empty description="No payments recorded" />
        ) : (
          <Table
            dataSource={payments}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            columns={[
              { title: 'Receipt', dataIndex: 'receiptNo' },
              {
                title: 'Order',
                dataIndex: 'orderNo',
                render: (t, r) => <Link to={`/order/${r.orderId}`}>#{t}</Link>,
              },
              { title: 'Mode', dataIndex: 'mode', width: 100 },
              { title: 'Reference', dataIndex: 'reference', ellipsis: true },
              {
                title: 'Amount',
                dataIndex: 'amount',
                align: 'right',
                render: (v, r) =>
                  r.status === 'RECEIVED' ? (
                    <strong>{inr(v)}</strong>
                  ) : (
                    <Text delete type="secondary">
                      {inr(v)}
                    </Text>
                  ),
              },
              { title: 'Date', dataIndex: 'receivedAt', render: formatDate, width: 110 },
            ]}
          />
        ),
    },
    {
      key: 'invoices',
      label: `Invoices (${invoices.length})`,
      children:
        invoices.length === 0 ? (
          <Empty description="No tax invoices yet" />
        ) : (
          <Table
            dataSource={invoices}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            columns={[
              { title: 'Invoice', dataIndex: 'invoiceNo' },
              {
                title: 'Order',
                dataIndex: 'orderNo',
                render: (t, r) => <Link to={`/order/${r.orderId}`}>#{t}</Link>,
              },
              {
                title: 'Status',
                dataIndex: 'status',
                width: 110,
                render: (s) => <Tag color={s === 'ISSUED' ? 'blue' : 'red'}>{s}</Tag>,
              },
              { title: 'Total', dataIndex: 'total', align: 'right', render: (v) => inr(v) },
              { title: 'Date', dataIndex: 'invoiceDate', render: formatDate, width: 110 },
            ]}
          />
        ),
    },
    {
      key: 'addresses',
      label: `Addresses (${addresses.length})`,
      children: (
        <>
          <div className="fv2-customerdetails-f6cc28e577">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openAddressModal()}>
              Add Address
            </Button>
          </div>

          {addresses.length === 0 ? (
            <Empty description="No addresses added yet" />
          ) : (
            <Row gutter={[16, 16]}>
              {addresses.map((addr) => (
                <Col xs={24} sm={12} lg={8} key={addr.addressId}>
                  <Card
                    hoverable
                    actions={[
                      <EditOutlined onClick={() => openAddressModal(addr)} key="edit" />,
                      <DeleteOutlined
                        onClick={() => handleDeleteAddress(addr.addressId)}
                        key="delete"
                      />,
                    ]}
                  >
                    <Card.Meta
                      avatar={<EnvironmentOutlined className="fv2-customerdetails-0f8bff5dc7" />}
                      title={
                        addr.status === 'PRIMARY' ? (
                          <Tag color="gold">Primary</Tag>
                        ) : (
                          <Tag>Additional</Tag>
                        )
                      }
                      description={
                        <div>
                          {addr.street}
                          <br />
                          {addr.city}, {addr.state} {addr.postalCode && `(${addr.postalCode})`}
                          <br />
                          {addr.country || 'India'}
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </>
      ),
    },
  ];

  if (ovLoading && !customer.customerId)
    return <Loader className="fv2-customerdetails-908b2e3f7b" />;
  if (!customer.customerId)
    return (
      <div className="fv2-customerdetails-f4d05c6fe6">
        {ovError ? 'Customer not found.' : 'Loading customer...'}
      </div>
    );

  return (
    <div className="page-wrapper">
      <div className="content">
        <Helmet>
          <title>{customer.name || 'Customer'} | Details</title>
        </Helmet>

        {/* Header */}
        <div className="page-header fv2-customerdetails-e60d7cbdad">
          <Space>
            <Avatar className="fv2-customerdetails-e922cba75f" size={72}>
              {getInitials(customer.name)}
            </Avatar>
            <div>
              <Title className="fv2-customerdetails-25d885354f" level={3}>
                {customer.name}
              </Title>
              <Space>
                <Tag icon={customer.isVendor ? <ShopOutlined /> : <UserOutlined />}>
                  {customer.isVendor ? 'Vendor' : 'Customer'}
                </Tag>
                {customer.customerType && <Tag color="geekblue">{customer.customerType}</Tag>}
                {!customer.isActive && <Tag color="red">Inactive</Tag>}
                {ov?.referrer && (
                  <Text type="secondary">
                    Referred by{' '}
                    <Link to={`/customer/${ov.referrer.customerId}`}>{ov.referrer.name}</Link>
                  </Text>
                )}
              </Space>
            </div>
          </Space>

          <Space wrap>
            <Button
              icon={<FileTextOutlined />}
              onClick={() =>
                navigate(`/quotation/add`, { state: { customerId: customer.customerId } })
              }
            >
              New quotation
            </Button>
            {stats.due > 0 && customer.mobileNumber && (
              <Button icon={<WhatsAppOutlined />} onClick={whatsappReminder}>
                Payment reminder
              </Button>
            )}
            <Button type="primary" icon={<EditOutlined />} onClick={handleEditCustomer}>
              Edit Customer
            </Button>
          </Space>
        </div>

        {stats.overLimit && (
          <Alert
            className="fv2-customerdetails-f2c0faf6ba"
            type="error"
            showIcon

            message={`Over credit limit: owes ${inr(stats.due)} against a limit of ${inr(stats.creditLimit)}.`}
          />
        )}
        {!stats.overLimit && stats.overdue > 0 && (
          <Alert
            className="fv2-customerdetails-f2c0faf6ba"
            type="warning"
            showIcon

            message={`${inr(stats.overdue)} is overdue (older than ${stats.creditDays} days).`}
          />
        )}

        <Row className="fv2-customerdetails-85c545b001" gutter={[16, 16]}>
          <Col xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic title={`Orders (${stats.orders || 0})`} value={inr(stats.orderValue)} />
            </Card>
          </Col>
          <Col xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic
                title="Billed / Paid"
                value={`${inr(stats.billed)} / ${inr(stats.paid)}`}
                valueStyle={{ fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic
                title={stats.overdue > 0 ? `Owes (${inr(stats.overdue)} overdue)` : 'Owes'}
                value={inr(stats.due)}
                valueStyle={{ color: stats.due > 0 ? '#cf1322' : '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic
                title="Credit left"
                value={stats.creditLimit ? inr(stats.creditLeft) : 'No limit'}
                valueStyle={{ color: stats.overLimit ? '#cf1322' : undefined }}
                suffix={
                  stats.creditLimit ? (
                    <Text className="fv2-customerdetails-dbe96dbb5b" type="secondary">
                      of {inr(stats.creditLimit)}
                    </Text>
                  ) : null
                }
              />
            </Card>
          </Col>
          <Col xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic
                title={`Open quotations (${stats.openQuotations || 0})`}
                value={inr(stats.openValue)}
              />
            </Card>
          </Col>
          <Col xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic
                title={`Win rate (${stats.won || 0} won · ${stats.lost || 0} lost)`}
                value={stats.winRate == null ? '—' : `${stats.winRate}%`}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} lg={7} xl={6}>
            <Space className="fv2-customerdetails-2ab77978c3" direction="vertical" size={24}>
              <Card title="Contact Information">
                <div className="fv2-customerdetails-fb9afa7ac9">
                  <div>
                    <Text type="secondary">
                      <PhoneOutlined /> Phone
                    </Text>
                    <div>{customer.mobileNumber || '—'}</div>
                  </div>
                  <div>
                    <Text type="secondary">
                      <MailOutlined /> Email
                    </Text>
                    <div>
                      <a href={`mailto:${customer.email}`}>{customer.email || '—'}</a>
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">
                      <ShopOutlined /> Company
                    </Text>
                    <div>{customer.companyName || '—'}</div>
                  </div>
                  <div>
                    <Text type="secondary">
                      <CalendarOutlined /> Since
                    </Text>
                    <div>{formatDate(customer.createdAt)}</div>
                  </div>
                  <div>
                    <Text type="secondary">
                      <ShoppingCartOutlined /> Last order
                    </Text>
                    <div>
                      {stats.lastOrder
                        ? `${formatDate(stats.lastOrder)} (${moment(stats.lastOrder).fromNow()})`
                        : '—'}
                    </div>
                  </div>
                  {customer.gstNumber && (
                    <div>
                      <Text type="secondary">GSTIN</Text>
                      <div>{customer.gstNumber}</div>
                    </div>
                  )}
                  {customer.notes && (
                    <div>
                      <Text type="secondary">Notes</Text>
                      <div className="fv2-customerdetails-2527a7bc9e">{customer.notes}</div>
                    </div>
                  )}
                </div>
              </Card>

              {referrals.length > 0 && (
                <Card
                  title={
                    <span>
                      <TeamOutlined /> Referred {referrals.length} customer
                      {referrals.length > 1 ? 's' : ''}
                    </span>
                  }
                  size="small"
                >
                  {referrals.map((r) => (
                    <div className="fv2-customerdetails-2c66b23ebc" key={r.customerId}>
                      <Link to={`/customer/${r.customerId}`}>{r.name}</Link>
                      <Text type="secondary">
                        {r.orders} order{r.orders === 1 ? '' : 's'} · {inr(r.orderValue)}
                      </Text>
                    </div>
                  ))}
                  <div className="fv2-customerdetails-9dd6610412">
                    <Text strong>
                      Total business: {inr(referrals.reduce((a, r) => a + r.orderValue, 0))}
                    </Text>
                  </div>
                </Card>
              )}

              {primaryAddress && (
                <Card title="Primary Address">
                  <EnvironmentOutlined className="fv2-customerdetails-3d9f63e629" />
                  {primaryAddress.street}
                  <br />
                  {primaryAddress.city}, {primaryAddress.state} {primaryAddress.postalCode}
                  <br />
                  {primaryAddress.country || 'India'}
                </Card>
              )}
            </Space>
          </Col>

          <Col xs={24} lg={17} xl={18}>
            <Card>
              <Tabs defaultActiveKey="timeline" items={tabItems.filter(Boolean)} />
            </Card>
          </Col>
        </Row>

        {/* Address Modal */}
        <AddressModal
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingAddress(null);
          }}
          onFinish={handleAddressSave}
          initialValues={editingAddress || {}}
          title={editingAddress ? 'Edit Address' : 'Add New Address'}
        />
      </div>
    </div>
  );
};

export default CustomerDetails;
