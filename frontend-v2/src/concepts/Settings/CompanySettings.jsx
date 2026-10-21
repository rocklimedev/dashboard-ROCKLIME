import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Switch,
  Typography,
  message,
} from 'antd';
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
    <div style={{ marginBottom: 16 }}>
      <Text strong>{title}</Text>
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
            {fields.map((f, i) => (
              <div key={f.key} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <Text type="secondary" style={{ width: 18 }}>
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
      message.error(e?.data?.message || 'Could not build the summary');
    }
  };
  const sendNow = async () => {
    try {
      const r = await sendSummary().unwrap();
      if (r.sent) message.success(`Sent to ${r.to.join(', ')}`);
      else message.warning(r.reason);
    } catch (e) {
      message.error(e?.data?.message || 'Could not send');
    }
  };

  const submit = (key, form) => async () => {
    try {
      const values = await form.validateFields();
      await save({ key, ...values }).unwrap();
      message.success('Saved');
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.data?.message || 'Could not save');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content" style={{ maxWidth: 980 }}>
        <Title level={3} style={{ marginBottom: 0 }}>
          Company &amp; documents
        </Title>
        <Text type="secondary">Printed on quotations, purchase orders and invoices.</Text>
        {!isAdmin && (
          <Alert
            style={{ marginTop: 12 }}
            type="info"
            showIcon
            message="Only administrators can change these settings."
          />
        )}
        {error && (
          <Alert
            style={{ marginTop: 12 }}
            type="error"
            showIcon
            message={error?.data?.message || 'Could not load settings'}
          />
        )}
        {isLoading ? (
          <Skeleton active />
        ) : (
          <>
            <Card title="Company" style={{ marginTop: 16 }}>
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

            <Card title="Quotations" style={{ marginTop: 16 }}>
              <Form form={quoteForm} layout="vertical" disabled={!isAdmin}>
                <Row gutter={16}>
                  <Col xs={12} md={6}>
                    <Form.Item name="validityDays" label="Valid for (days)">
                      <InputNumber min={1} max={180} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Item name="defaultGstRate" label="Default GST %">
                      <InputNumber min={0} max={28} style={{ width: '100%' }} />
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
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
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
                    type="primary"
                    onClick={submit('quotation', quoteForm)}
                    loading={saving}
                    style={{ marginTop: 16 }}
                  >
                    Save quotation settings
                  </Button>
                )}
              </Form>
            </Card>

            <Modal
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
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
                {summary?.text}
              </pre>
            </Modal>

            <Card title="Invoices & Tally" style={{ marginTop: 16 }}>
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
                    <Space
                      direction="vertical"
                      style={{ width: '100%', marginTop: 8, marginBottom: 16 }}
                    >
                      {fields.map((f, i) => (
                        <Space key={f.key} align="baseline" style={{ width: '100%' }}>
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
                <Row gutter={16} style={{ marginTop: 8 }}>
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
