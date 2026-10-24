import ModalShell from '../Common/ModalShell';
import './MarkDeliveredModal.styles.css';
import { useState } from 'react';
import { DatePicker, Form, Input, Upload, Button } from 'antd';
import { toast } from 'sonner';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useMarkDispatchDeliveredMutation } from '../../api/orderApi';

/** Confirms one dispatch reached the customer: who received it, when, and a photo / signed delivery note. */
export default function MarkDeliveredModal({ orderId, dispatch, open, onClose }) {
  const [form] = Form.useForm();
  const [file, setFile] = useState(null);
  const [markDelivered, { isLoading }] = useMarkDispatchDeliveredMutation();

  const submit = async () => {
    const v = await form.validateFields();
    if (!v.receivedBy?.trim() && !file) {
      toast.error('Enter who received the goods, or attach the signed delivery note / photo');
      return;
    }
    const fd = new FormData();
    if (v.receivedBy?.trim()) fd.append('receivedBy', v.receivedBy.trim());
    if (v.deliveredAt) fd.append('deliveredAt', v.deliveredAt.toISOString());
    if (v.deliveryNote?.trim()) fd.append('deliveryNote', v.deliveryNote.trim());
    if (file) fd.append('file', file);
    try {
      const r = await markDelivered({ orderId, dispatchId: dispatch.id, formData: fd }).unwrap();
      toast.success(
        r.orderStatus === 'DELIVERED'
          ? 'Delivered — the whole order has reached the customer'
          : 'Marked delivered',
      );
      form.resetFields();
      setFile(null);
      onClose();
    } catch (e) {
      toast.error(e?.data?.message || 'Could not mark delivered');
    }
  };

  return (
    <ModalShell
      open={open}
      title={`Delivered · dispatch #${dispatch?.dispatchNumber || ''}`}
      okText="Mark delivered"
      okButtonProps={{ loading: isLoading }}
      onOk={submit}
      onCancel={onClose}
      destroyOnHidden
      zIndex={2000}
    >
      <Form form={form} layout="vertical" initialValues={{ deliveredAt: dayjs() }}>
        <Form.Item
          name="receivedBy"
          label="Received by"
          extra="Name of the person at site who took the goods"
        >
          <Input placeholder="e.g. Ramesh (site supervisor)" />
        </Form.Item>
        <Form.Item name="deliveredAt" label="Delivered on">
          <DatePicker
            className="fv2-markdeliveredmodal-0e4cf9159e"
            showTime={{ format: 'h:mm a' }}
            format="D MMM YYYY, h:mm a"

            disabledDate={(d) => d && d.isAfter(dayjs().endOf('day'))}
          />
        </Form.Item>
        <Form.Item label="Proof (photo or signed delivery note)">
          <Upload
            beforeUpload={(f) => {
              setFile(f);
              return false;
            }}
            onRemove={() => setFile(null)}
            maxCount={1}
            accept=".jpg,.jpeg,.png,.pdf"
            fileList={file ? [{ uid: '1', name: file.name, status: 'done' }] : []}
          >
            <Button icon={<UploadOutlined />}>Attach photo or PDF</Button>
          </Upload>
        </Form.Item>
        <Form.Item name="deliveryNote" label="Note (optional)">
          <Input.TextArea rows={2} placeholder="e.g. 2 boxes slightly damaged, customer accepted" />
        </Form.Item>
      </Form>
    </ModalShell>
  );
}
