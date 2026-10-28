import { useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, Select, Space, Switch, Table, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, PlusOutlined } from '@ant-design/icons';
import { toast } from 'sonner';
import { APPS, ADMIN_ROLES } from '../../apps/registry';
import { useRoles } from '../../utils/useCan';
import { useGetSettingsQuery, useSaveSettingMutation } from '../../api/settingsApi';
import { useGetRolesQuery } from '../../api/rolesApi';
import { DEFAULT_DOCUMENT_EXPORTS } from '../../utils/documentExportDefaults';
import { documentExportFilename } from '../../utils/documentExportFilename';

export function DocumentFormats() {
  const admin = useRoles().some((r) => ADMIN_ROLES.includes(r));
  const { data, isLoading, error } = useGetSettingsQuery();
  const [save, { isLoading: saving }] = useSaveSettingMutation();
  const [form] = Form.useForm();
  const values = Form.useWatch([], form) || DEFAULT_DOCUMENT_EXPORTS;
  useEffect(() => {
    if (data) form.setFieldsValue({ ...DEFAULT_DOCUMENT_EXPORTS, ...data.data?.documentExports });
  }, [data, form]);
  if (!admin) return <Alert type="error" message="Administrators only" />;
  return (
    <div className="page-wrapper">
      <div className="content">
        <Typography.Title level={3}>Document formats</Typography.Title>
        <Typography.Paragraph>
          Manage PDF and Excel export filenames. Use {'{customer}'} for the customer (vendor on
          purchase orders), {'{number}'} for the document number, and {'{date}'} for its date.
          Extensions are added automatically.
        </Typography.Paragraph>
        {error && <Alert type="error" message="Could not load settings" />}
        <Card loading={isLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={async (fields) => {
              try {
                await save({ key: 'documentExports', ...fields }).unwrap();
                toast.success('Document formats saved');
              } catch (e) {
                toast.error(e?.data?.message || 'Could not save formats');
              }
            }}
          >
            {['quotation', 'order', 'purchase'].map((type) => (
              <div key={type}>
                <Form.Item
                  name={type}
                  label={
                    {
                      quotation: 'Quotation filename',
                      order: 'Order filename',
                      purchase: 'Purchase order filename',
                    }[type]
                  }
                  rules={[
                    { required: true },
                    {
                      validator: (_, value) =>
                        value?.includes('{number}')
                          ? Promise.resolve()
                          : Promise.reject(new Error('Include {number} in the filename')),
                    },
                  ]}
                >
                  <Input maxLength={180} />
                </Form.Item>
                <Typography.Paragraph type="secondary">
                  Preview:{' '}
                  {documentExportFilename({
                    customerName: type === 'purchase' ? 'Sample Vendor' : 'Sample Customer',
                    documentNumber: { quotation: 'QT-102', order: 'SO-102', purchase: 'PO-102' }[
                      type
                    ],
                    date: '2026-10-28',
                    documentType: type,
                    formats: values,
                  })}
                </Typography.Paragraph>
              </div>
            ))}
            <Form.Item name="dateFormat" label="Date format">
              <Select
                options={['DD-MM-YYYY', 'YYYY-MM-DD', 'DD-MMM-YYYY'].map((value) => ({
                  value,
                  label: value,
                }))}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={saving} disabled={!!error}>
              Save document formats
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export function OrganiseApps() {
  const admin = useRoles().some((r) => ADMIN_ROLES.includes(r));
  const { data, isLoading, error } = useGetSettingsQuery();
  const { data: roleData } = useGetRolesQuery(undefined, { skip: !admin });
  const [save, { isLoading: saving }] = useSaveSettingMutation();
  const [draftEntries, setDraftEntries] = useState(null);
  const saved = data?.data?.apps?.entries || [];
  const entries = draftEntries ?? [
    ...saved,
    ...APPS.filter((app) => !saved.some((e) => e.key === app.key)).map((app) => ({
      key: app.key,
      name: app.name,
      module: app.module,
      enabled: true,
      lockedRoles: [],
    })),
  ];
  const setEntries = (update) =>
    setDraftEntries((previous) =>
      typeof update === 'function' ? update(previous ?? entries) : update,
    );
  const [addForm] = Form.useForm();
  const roles = (Array.isArray(roleData) ? roleData : roleData?.data || roleData?.roles || [])
    .map((r) => r.roleName)
    .filter((r) => !ADMIN_ROLES.includes(r));
  const update = (index, patch) =>
    setEntries((current) =>
      current.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    );
  const move = (index, direction) =>
    setEntries((current) => {
      const next = [...current];
      [next[index], next[index + direction]] = [next[index + direction], next[index]];
      return next;
    });
  if (!admin) return <Alert type="error" message="Administrators only" />;
  return (
    <div className="page-wrapper">
      <div className="content">
        <Typography.Title level={3}>Organise apps</Typography.Title>
        <Typography.Paragraph>
          Arrange the launcher and app switcher, rename apps, and lock access for selected roles.
          Administrators retain access to manage these settings. New registry entries link to
          existing ERP pages and retain their page permissions.
        </Typography.Paragraph>
        {error && <Alert type="error" message="Could not load app registry" />}
        <Table
          rowKey="key"
          loading={isLoading}
          dataSource={entries}
          pagination={false}
          scroll={{ x: 900 }}
          columns={[
            {
              title: 'Order',
              render: (_, entry, index) => (
                <Space>
                  <Button
                    aria-label={`Move ${entry.name} up`}
                    icon={<ArrowUpOutlined />}
                    disabled={!index}
                    onClick={() => move(index, -1)}
                  />
                  <Button
                    aria-label={`Move ${entry.name} down`}
                    icon={<ArrowDownOutlined />}
                    disabled={index === entries.length - 1}
                    onClick={() => move(index, 1)}
                  />
                </Space>
              ),
            },
            {
              title: 'App',
              render: (_, entry, index) => (
                <>
                  <Input
                    value={entry.name}
                    maxLength={80}
                    onChange={(e) => update(index, { name: e.target.value })}
                  />
                  <Typography.Text type="secondary">
                    {entry.key}
                    {entry.custom ? ` · ${entry.home}` : ''}
                  </Typography.Text>
                </>
              ),
            },
            {
              title: 'Enabled',
              render: (_, entry, index) => (
                <Switch
                  checked={entry.enabled !== false}
                  onChange={(enabled) => update(index, { enabled })}
                />
              ),
            },
            {
              title: 'Locked for roles',
              width: 300,
              render: (_, entry, index) => (
                <Select
                  style={{ width: '100%' }}
                  mode="multiple"
                  placeholder="Choose roles"
                  value={entry.lockedRoles || []}
                  options={[...new Set([...roles, ...(entry.lockedRoles || [])])].map((role) => ({
                    label: role,
                    value: role,
                  }))}
                  onChange={(lockedRoles) => update(index, { lockedRoles })}
                />
              ),
            },
            {
              title: '',
              render: (_, entry, index) =>
                entry.custom && (
                  <Button
                    danger
                    onClick={() => setEntries((current) => current.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                ),
            },
          ]}
        />
        <Card title="Add app registry entry" style={{ marginTop: 24 }}>
          <Form
            form={addForm}
            layout="vertical"
            onFinish={(values) => {
              if (entries.some((e) => e.key === values.key)) {
                toast.error('App key already exists');
                return;
              }
              const target = APPS.flatMap((app) =>
                app.items.map((item) => ({ ...item, module: item.module || app.module, app })),
              ).find((item) => item.to === values.home);
              if (!target) return;
              setEntries((current) => [
                ...current,
                {
                  ...values,
                  module: target.module || undefined,
                  adminOnly: !!target.adminOnly,
                  custom: true,
                  enabled: true,
                  lockedRoles: [],
                },
              ]);
              addForm.resetFields();
            }}
          >
            <Form.Item
              name="key"
              label="Unique app key"
              rules={[
                {
                  required: true,
                  pattern: /^[a-z][a-z0-9-]{0,49}$/,
                  message: 'Use lowercase letters, numbers and hyphens',
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="name" label="App name" rules={[{ required: true }]}>
              <Input maxLength={80} />
            </Form.Item>
            <Form.Item name="home" label="Existing ERP page" rules={[{ required: true }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={APPS.flatMap((app) =>
                  app.items.map((item) => ({
                    value: item.to,
                    label: `${app.name} / ${item.label}`,
                  })),
                )}
              />
            </Form.Item>
            <Button htmlType="submit" icon={<PlusOutlined />}>
              Add entry
            </Button>
          </Form>
        </Card>
        <Button
          type="primary"
          loading={saving}
          disabled={!!error || !entries.length}
          style={{ marginTop: 16 }}
          onClick={async () => {
            try {
              await save({ key: 'apps', entries }).unwrap();
              toast.success('App registry saved');
            } catch (e) {
              toast.error(e?.data?.message || 'Could not save app registry');
            }
          }}
        >
          Save app registry
        </Button>
      </div>
    </div>
  );
}
