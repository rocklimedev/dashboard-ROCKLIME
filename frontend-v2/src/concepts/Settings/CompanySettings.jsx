import ModalShell from '../../components/Common/ModalShell';
import './CompanySettings.styles.css';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Skeleton,
  Space,
  Switch,
  Typography,
} from 'antd';
import { toast } from 'sonner';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useGetSettingsQuery, useSaveSettingMutation } from '../../api/settingsApi';
import { useRoles } from '../../utils/useCan';
import { useLazyGetDailySummaryQuery, useSendDailySummaryMutation } from '../../api/dashboardApi';

const { Title, Text } = Typography;

const STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

/** Settings → Company & documents: what is printed on quotations and other documents. */
/** An editable list of lines (inclusions, exclusions, terms). */
function ListField({ name, title, isAdmin, addLabel, numbered = false }) {
  return (
    <div className="fv2-companysettings-36c2b69b88">
      <Text strong>{title}</Text>
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <Space className="fv2-companysettings-878f6fdf52" direction="vertical">
            {fields.map((f, i) => (
              <div className="fv2-companysettings-ed8e7bb806" key={f.key}>
                <Text className="fv2-companysettings-ed5668a05b" type="secondary">
                  {numbered ? `${i + 1}.` : '•'}
                </Text>
                <Form.Item {...f} style={{ marginBottom: 0, flex: 1 }}>
                  <Input />
                </Form.Item>
                {isAdmin && <MinusCircleOutlined onClick={() => remove(f.name)} />}
              </div>
            ))}
            {isAdmin && (
              <Button type="dashed" onClick={() => add('')} icon={<PlusOutlined />}>
                {addLabel}
              </Button>
            )}
          </Space>
        )}
      </Form.List>
    </div>
  );
}

export default function CompanySettings() {
  const roles = useRoles();
  const isAdmin = roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'DEVELOPER'].includes(r));
  const { data, isLoading, error } = useGetSettingsQuery();
  const [save, { isLoading: saving }] = useSaveSettingMutation();
  const [companyForm] = Form.useForm();
  const [quoteForm] = Form.useForm();
  const [accountsForm] = Form.useForm();

  useEffect(() => {
    if (data?.data) {
      companyForm.setFieldsValue(data.data.company);
      quoteForm.setFieldsValue(data.data.quotation);
      if (data.data.accounts) accountsForm.setFieldsValue(data.data.accounts);
    }
  }, [data, companyForm, quoteForm, accountsForm]);

  const [loadSummary, { isFetching: summaryLoading }] = useLazyGetDailySummaryQuery();
  const [sendSummary, { isLoading: sending }] = useSendDailySummaryMutation();
  const [summary, setSummary] = useState(null);
  const showSummary = async () => {
    try {
      setSummary(await loadSummary().unwrap());
    } catch (e) {
      toast.error(e?.data?.message || 'Could not build the summary');
    }
  };
  const sendNow = async () => {
    try {
      const r = await sendSummary().unwrap();
      if (r.sent) toast.success(`Sent to ${r.to.join(', ')}`);
      else toast.warning(r.reason);
    } catch (e) {
      toast.error(e?.data?.message || 'Could not send');
    }
  };

  const submit = (key, form) => async () => {
    try {
      const values = await form.validateFields();
      await save({ key, ...values }).unwrap();
      toast.success('Saved');
    } catch (e) {
      if (e?.errorFields) return;
      toast.error(e?.data?.message || 'Could not save');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content fv2-companysettings-f59ef3d562">
        <Title className="fv2-companysettings-648e005843" level={3}>
          Company &amp; documents
        </Title>
        <Text type="secondary">Printed on quotations, purchase orders and invoices.</Text>
        {!isAdmin && (
          <Alert
            className="fv2-companysettings-77b8c5d98f"

            type="info"
            showIcon
            message="Only administrators can change these settings."
          />
        )}
        {error && (
          <Alert
            className="fv2-companysettings-77b8c5d98f"

            type="error"
            showIcon
            message={error?.data?.message || 'Could not load settings'}
          />
        )}
        {isLoading ? (
          <Skeleton active />
        ) : (
          <>
            <Card className="fv2-companysettings-9107b627f1" title="Company">
              <Form form={companyForm} layout="vertical" disabled={!isAdmin}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="name" label="Trading name" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="brandName" label="Name on quotations and gate passes">
                      <Input placeholder="Chhabra Marble" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="legalName" label="Legal name (as on GST)">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="gstin"
                      label="GSTIN"
                      rules={[
                        {
                          pattern: /^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
                          message: '15-character GSTIN, e.g. 07ABCDE1234F1Z5',
                        },
                      ]}
                      normalize={(v) => (v || '').toUpperCase().trim()}
                    >
                      <Input maxLength={15} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="state"
                      label="State (decides CGST+SGST vs IGST)"
                      rules={[{ required: true }]}
                    >
                      <Select showSearch options={STATES.map((s) => ({ value: s, label: s }))} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="stateCode" label="State code">
                      <Input maxLength={2} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="address" label="Address">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="phone" label="Phone">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="email" label="Email">
                      <Input type="email" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="website" label="Website">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Title level={5}>Bank &amp; UPI (for payment details and the QR code)</Title>
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item name="bankName" label="Bank">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="bankBranch" label="Branch">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="bankAccountName" label="Account name">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="bankAccountNo" label="Account number">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="bankIfsc"
                      label="IFSC"
                      normalize={(v) => (v || '').toUpperCase().trim()}
                    >
                      <Input maxLength={11} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="upiId"
                      label="UPI ID"
                      rules={[
                        { pattern: /^$|^[\w.-]+@[\w.-]+$/, message: 'e.g. cmtrading@hdfcbank' },
                      ]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={16}>
                    <Form.Item
                      name="summaryEmails"
                      label="Daily summary email (8 pm)"
                      extra="Sales, dispatches, money collected and tomorrow's follow-ups. Separate several addresses with commas."
                      rules={[
                        {
                          pattern: /^$|^[^@\s,]+@[^@\s,]+(\s*,\s*[^@\s,]+@[^@\s,]+)*$/,
                          message: 'e.g. owner@cmtradingco.com, manager@cmtradingco.com',
                        },
                      ]}
                    >
                      <Input placeholder="owner@cmtradingco.com" />
                    </Form.Item>
                  </Col>
                </Row>
                <Space wrap>
                  {isAdmin && (
                    <Button
                      type="primary"
                      onClick={submit('company', companyForm)}
                      loading={saving}
                    >
                      Save company details
                    </Button>
                  )}
                  <Button onClick={showSummary} loading={summaryLoading}>
                    See today's summary
                  </Button>
                </Space>
              </Form>
            </Card>

            <Card className="fv2-companysettings-9107b627f1" title="Quotations">
              <Form form={quoteForm} layout="vertical" disabled={!isAdmin}>
                <Row gutter={16}>
                  <Col xs={12} md={6}>
                    <Form.Item name="validityDays" label="Valid for (days)">
                      <InputNumber className="fv2-companysettings-183007976a" min={1} max={180} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Item name="defaultGstRate" label="Default GST %">
                      <InputNumber className="fv2-companysettings-183007976a" min={0} max={28} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Item name="defaultStyle" label="Default PDF style">
                      <Select
                        options={[
                          { value: 'detailed', label: 'With photos' },
                          { value: 'compact', label: 'Compact (codes, no photos)' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Item
                      name="showCoverPage"
                      label="Cover page by default"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.List name="discountPresets">
                  {(fields, { add, remove }) => (
                    <div>
                      <Title level={5}>Discount presets</Title>
                      {fields.map(({ key, name, ...rest }) => (
                        <Space key={key} wrap align="start">
                          <Form.Item {...rest} name={[name, 'id']} hidden>
                            <Input />
                          </Form.Item>
                          <Form.Item
                            {...rest}
                            name={[name, 'name']}
                            label="Name"
                            rules={[{ required: true }]}
                          >
                            <Input />
                          </Form.Item>
                          <Form.Item {...rest} name={[name, 'discountMode']} label="Mode">
                            <Select
                              style={{ width: 130 }}
                              options={[
                                { value: 'generic', label: 'Generic' },
                                { value: 'advanced', label: 'Advanced' },
                              ]}
                            />
                          </Form.Item>
                          <Form.Item {...rest} name={[name, 'gstBasis']} label="GST basis">
                            <Select
                              allowClear
                              style={{ width: 140 }}
                              onClear={() =>
                                quoteForm.setFieldValue(['discountPresets', name, 'gstBasis'], null)
                              }
                              options={[
                                { value: 'inclusive', label: 'Inclusive' },
                                { value: 'exclusive', label: 'Exclusive' },
                              ]}
                            />
                          </Form.Item>
                          <Form.Item {...rest} name={[name, 'gstRate']} label="GST %">
                            <InputNumber min={0} />
                          </Form.Item>
                          <Form.Item
                            {...rest}
                            name={[name, 'isDefault']}
                            label="Default"
                            valuePropName="checked"
                          >
                            <Switch
                              onChange={(checked) => {
                                if (checked) {
                                  const rows = quoteForm.getFieldValue('discountPresets');
                                  quoteForm.setFieldValue(
                                    'discountPresets',
                                    rows.map((p, i) => ({ ...p, isDefault: i === name })),
                                  );
                                }
                              }}
                            />
                          </Form.Item>
                          <Button onClick={() => remove(name)}>Delete</Button>
                        </Space>
                      ))}
                      <Button
                        onClick={() =>
                          add({
                            id: crypto.randomUUID(),
                            name: '',
                            discountMode: 'generic',
                            gstBasis: null,
                            gstRate: quoteForm.getFieldValue('defaultGstRate'),
                            isDefault: false,
                          })
                        }
                      >
                        Add preset
                      </Button>
                    </div>
                  )}
                </Form.List>
                <Text className="fv2-companysettings-a2f226d581" type="secondary">
                  In any line you can write {'{validityDays}'}, {'{validTill}'} or {'{gst}'}; the
                  quotation fills in the real value.
                </Text>
                <Row gutter={24}>
                  <Col xs={24} lg={12}>
                    <ListField
                      name="includes"
                      title="Price includes"
                      isAdmin={isAdmin}
                      addLabel="Add an inclusion"
                    />
                  </Col>
                  <Col xs={24} lg={12}>
                    <ListField
                      name="excludes"
                      title="Price excludes"
                      isAdmin={isAdmin}
                      addLabel="Add an exclusion"
                    />
                  </Col>
                </Row>
                <ListField
                  name="keyTerms"
                  title="Terms"
                  isAdmin={isAdmin}
                  addLabel="Add a term"
                  numbered
                />
                {isAdmin && (
                  <Button
                    className="fv2-companysettings-9107b627f1"
                    type="primary"
                    onClick={submit('quotation', quoteForm)}
                    loading={saving}
                  >
                    Save quotation settings
                  </Button>
                )}
              </Form>
            </Card>

            <ModalShell
              open={!!summary}
              title="Today's summary"
              onCancel={() => setSummary(null)}
              zIndex={2000}
              footer={[
                <Button
                  key="wa"
                  href={
                    summary ? `https://wa.me/?text=${encodeURIComponent(summary.text)}` : undefined
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Share on WhatsApp
                </Button>,
                isAdmin && (
                  <Button key="send" type="primary" loading={sending} onClick={sendNow}>
                    Email it now
                  </Button>
                ),
              ]}
            >
              <pre className="fv2-companysettings-c95c767d0b">{summary?.text}</pre>
            </ModalShell>

            <Card className="fv2-companysettings-9107b627f1" title="Invoices & Tally">
              <Form form={accountsForm} layout="vertical" disabled={!isAdmin}>
                <Row gutter={16}>
                  <Col xs={12} md={6}>
                    <Form.Item
                      name="invoicePrefix"
                      label="Invoice number prefix"
                      extra="Numbers look like CM/26-27/0001 and restart every April."
                      rules={[
                        { pattern: /^[A-Za-z0-9-]{1,5}$/, message: 'Up to 5 letters or digits' },
                      ]}
                      normalize={(v) => (v || '').toUpperCase().trim()}
                    >
                      <Input maxLength={5} />
                    </Form.Item>
                  </Col>
                </Row>
                <Text strong>Terms printed on every invoice</Text>
                <Form.List name="invoiceTerms">
                  {(fields, { add, remove }) => (
                    <Space className="fv2-companysettings-28d824ef04" direction="vertical">
                      {fields.map((f, i) => (
                        <Space
                          className="fv2-companysettings-183007976a"
                          key={f.key}
                          align="baseline"
                        >
                          <Text type="secondary">{i + 1}.</Text>
                          <Form.Item
                            {...f}
                            style={{ marginBottom: 0, width: 760, maxWidth: '70vw' }}
                          >
                            <Input />
                          </Form.Item>
                          {isAdmin && <MinusCircleOutlined onClick={() => remove(f.name)} />}
                        </Space>
                      ))}
                      {isAdmin && (
                        <Button type="dashed" onClick={() => add('')} icon={<PlusOutlined />}>
                          Add a term
                        </Button>
                      )}
                    </Space>
                  )}
                </Form.List>
                <Text strong>Tally ledger names</Text>
                <div>
                  <Text type="secondary">
                    Must match the ledgers in your Tally company exactly, or Tally will reject the
                    import.
                  </Text>
                </div>
                <Row className="fv2-companysettings-6ce8c1965e" gutter={16}>
                  {[
                    ['tallySalesLedger', 'Sales'],
                    ['tallyFreightLedger', 'Freight'],
                    ['tallyCgstLedger', 'Output CGST'],
                    ['tallySgstLedger', 'Output SGST'],
                    ['tallyIgstLedger', 'Output IGST'],
                    ['tallyRoundOffLedger', 'Round off'],
                    ['tallyCashLedger', 'Cash'],
                    ['tallyBankLedger', 'Bank (UPI, cheque, transfer)'],
                  ].map(([name, label]) => (
                    <Col xs={12} md={6} key={name}>
                      <Form.Item
                        name={name}
                        label={label}
                        rules={[{ required: true, message: 'Required' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  ))}
                </Row>
                {isAdmin && (
                  <Button
                    type="primary"
                    onClick={submit('accounts', accountsForm)}
                    loading={saving}
                  >
                    Save invoice settings
                  </Button>
                )}
              </Form>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
