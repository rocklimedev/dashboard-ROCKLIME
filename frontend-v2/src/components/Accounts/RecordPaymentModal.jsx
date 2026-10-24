import ModalShell from '../Common/ModalShell';
import './RecordPaymentModal.styles.css';
import { useEffect } from 'react';
import { DatePicker, Form, Input, InputNumber, Select, Typography } from 'antd';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { useRecordPaymentMutation } from '../../api/paymentsApi';
import { inr } from '../../utils/quotationMath';
import { MODES } from './paymentModes';

const { Text } = Typography;

/**
 * Record a payment against one order.
 *   orders: [{ id, orderNo, customerName, due }] to choose from (or pass a single one)
 */
export default function RecordPaymentModal({ open, onClose, orders = [], defaultOrderId, onDone }) {
  const [form] = Form.useForm();
  const [record, { isLoading }] = useRecordPaymentMutation();
  const orderId = Form.useWatch('orderId', form);
  const mode = Form.useWatch('mode', form);
  const selected = orders.find((o) => o.id === orderId);

  useEffect(() => {
    if (open) {
      const first =
        orders.find((o) => o.id === defaultOrderId) || (orders.length === 1 ? orders[0] : null);
      form.setFieldsValue({
        orderId: first?.id,
        amount: first?.due > 0 ? first.due : undefined,
        mode: 'UPI',
        receivedAt: dayjs(),
        reference: undefined,
        notes: undefined,
      });
    }
  }, [open, defaultOrderId, orders, form]);

  const submit = async () => {
    try {
      const v = await form.validateFields();
      const r = await record({ ...v, receivedAt: v.receivedAt?.toISOString() }).unwrap();
      toast.success(r.message || 'Payment recorded');
      onDone?.(r);
      onClose();
    } catch (e) {
      if (e?.errorFields) return;
      toast.error(e?.data?.message || 'Could not record the payment');
    }
  };

  return (
    <ModalShell
      open={open}
      onCancel={onClose}
      onOk={submit}
      okText="Record payment"
      confirmLoading={isLoading}
      title="Record a payment"
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="orderId"
          label="Order"
          rules={[{ required: true, message: 'Choose the order' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            disabled={orders.length === 1}
            options={orders.map((o) => ({
              value: o.id,
              label: `${o.orderNo}${o.customerName ? ` · ${o.customerName}` : ''} · due ${inr(o.due)}`,
            }))}
            onChange={(id) => {
              const o = orders.find((x) => x.id === id);
              if (o?.due > 0) form.setFieldValue('amount', o.due);
            }}
          />
        </Form.Item>
        {selected && (
          <Text className="fv2-recordpaymentmodal-818e25e50c" type="secondary">
            Billed {inr(selected.billed ?? 0)} · paid {inr(selected.paid ?? 0)} · due{' '}
            {inr(selected.due)}
          </Text>
        )}
        <Form.Item
          name="amount"
          label="Amount received (₹)"
          rules={[
            { required: true, message: 'Enter the amount' },
            {
              validator: (_, v) =>
                selected && v > selected.due + 1
                  ? Promise.reject(new Error(`Only ${inr(selected.due)} is due`))
                  : Promise.resolve(),
            },
          ]}
        >
          <InputNumber className="fv2-recordpaymentmodal-0f673fa6b8" min={1} precision={2} />
        </Form.Item>
        <Form.Item name="mode" label="Mode" rules={[{ required: true }]}>
          <Select options={MODES} />
        </Form.Item>
        <Form.Item
          name="reference"
          label={mode === 'CHEQUE' ? 'Cheque number' : 'Reference (UTR / transaction id)'}
          rules={[
            {
              required: ['CHEQUE', 'BANK'].includes(mode),
              message: 'Required for cheque and bank transfer',
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="receivedAt" label="Received on" rules={[{ required: true }]}>
          <DatePicker
            className="fv2-recordpaymentmodal-0f673fa6b8"

            format="DD MMM YYYY"
            disabledDate={(d) => d && d.isAfter(dayjs().endOf('day'))}
          />
        </Form.Item>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </ModalShell>
  );
}
