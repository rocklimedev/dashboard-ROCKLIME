import { useEffect, useRef, useState } from 'react';
import { Button, Drawer, Input, List, Modal, Select, Space, Tag, Typography, message } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';

export default function QuotationCartSwitcher({
  workspace,
  snapshot,
  onAction,
  busy,
  ready,
  customers = [],
  vendors = [],
  documentType = 'quotation',
  open,
  onClose,
}) {
  const documentLabel = {
    quotation: 'quotation',
    order: 'order',
    'purchase-order': 'purchase order',
  }[documentType];
  const typeLabel = (draft) =>
    ({ quotation: 'Quotation', order: 'Order', 'purchase-order': 'Purchase order' })[
      draft.documentType || 'quotation'
    ];
  const [rename, setRename] = useState(null);
  const [name, setName] = useState('');
  const latest = useRef(snapshot);
  latest.current = snapshot;
  const lastSaved = useRef(null);
  const serialized = JSON.stringify(snapshot);
  const sourceId = workspace.activeId;
  const savedId = workspace.active?.savedDraftId;
  const action = async (type, extra = {}) => {
    try {
      await onAction(type, latest.current, sourceId, extra);
      return true;
    } catch (error) {
      message.error(
        error?.data?.message ||
          error.message ||
          'Could not save cart. Your current cart is still open.',
      );
      return false;
    }
  };
  useEffect(() => {
    if (!ready || busy || lastSaved.current === serialized) return;
    onAction('session', latest.current, sourceId)
      .then(() => {
        lastSaved.current = serialized;
      })
      .catch(() => message.error('Could not preserve this session in local storage.'));
  }, [serialized, ready, busy, onAction, sourceId]);
  // Flush the latest snapshot when navigating away; old editors cannot overwrite a switched cart.
  const exit = useRef();
  exit.current = () => {
    if (ready && !busy) onAction('session', latest.current, sourceId).catch(() => {});
  };
  useEffect(() => () => exit.current?.(), []);
  return (
    <>
      <Drawer
        title="Saved carts — quotations, orders & purchase orders"
        open={open}
        onClose={onClose}
        width={520}
      >
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <ShoppingCartOutlined />
            <Typography.Text strong>Saved drafts</Typography.Text>
            <Select
              aria-label="Saved draft"
              placeholder="Open a saved draft"
              value={savedId || undefined}
              disabled={busy || !ready}
              style={{ minWidth: 220 }}
              onChange={async (targetId) => {
                if (await action('switch', { targetId })) onClose();
              }}
              options={workspace.drafts.map((draft) => ({
                value: draft.id,
                label: `${draft.name} · ${typeLabel(draft)}`,
              }))}
            />
          </Space>
          <Space wrap>
            <Button
              icon={<SaveOutlined />}
              disabled={!ready || busy}
              onClick={async () => {
                if (await action('save')) message.success('Draft saved');
              }}
            >
              Save draft
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!ready || busy}
              onClick={() => action('new')}
            >
              Save & new {documentLabel}
            </Button>
          </Space>
        </Space>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Your working session stays on this device. Saved drafts change only when you choose Save
          draft or Save &amp; new.
        </Typography.Text>
        <List
          dataSource={workspace.drafts}
          renderItem={(draft) => (
            <List.Item
              actions={[
                <Button
                  key="rename"
                  aria-label={`Rename ${draft.name}`}
                  disabled={busy}
                  icon={<EditOutlined />}
                  onClick={() => {
                    setRename(draft.id);
                    setName(draft.name);
                  }}
                />,
                <Button
                  key="delete"
                  aria-label={`Delete ${draft.name}`}
                  danger
                  disabled={busy}
                  icon={<DeleteOutlined />}
                  onClick={() =>
                    Modal.confirm({
                      title: `Delete ${draft.name}?`,
                      content: 'This removes this draft and its saved products.',
                      okText: 'Delete draft',
                      okButtonProps: { danger: true },
                      onOk: async () => {
                        if (!(await action('delete', { targetId: draft.id })))
                          throw new Error('Draft deletion failed');
                      },
                    })
                  }
                />,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space wrap>
                    <Typography.Text strong>{draft.name}</Typography.Text>
                    <Tag>{typeLabel(draft)}</Tag>
                    {draft.id === savedId && <Tag color="blue">Open in session</Tag>}
                  </Space>
                }
                description={
                  <div>
                    {draft.documentType === 'purchase-order'
                      ? vendors.find(
                          (vendor) =>
                            (vendor.vendorId || vendor.id) ===
                            draft.snapshot?.parent?.selectedVendor,
                        )?.name ||
                        draft.snapshot?.parent?.selectedVendor ||
                        'Vendor not selected'
                      : customers.find(
                          (customer) =>
                            customer.customerId === draft.snapshot?.parent?.selectedCustomer,
                        )?.name ||
                        draft.snapshot?.parent?.selectedCustomer ||
                        'Customer not selected'}
                    <br />
                    {draft.snapshot?.layout?.localCartItems?.length || 0} products ·{' '}
                    {new Date(draft.updatedAt).toLocaleString('en-IN')}
                  </div>
                }
              />
              <Button
                disabled={busy || !ready}
                onClick={async () => {
                  if (await action('switch', { targetId: draft.id })) onClose();
                }}
              >
                {draft.id === savedId ? 'Reload saved' : 'Open'}
              </Button>
            </List.Item>
          )}
        />
      </Drawer>
      <Modal
        title="Rename draft"
        open={!!rename}
        onCancel={() => setRename(null)}
        okButtonProps={{ disabled: !name.trim() || busy }}
        onOk={async () => {
          if (await action('rename', { targetId: rename, name })) setRename(null);
        }}
      >
        <Input
          aria-label="Draft name"
          value={name}
          maxLength={120}
          onChange={(event) => setName(event.target.value)}
          onPressEnter={async () => {
            if (name.trim() && (await action('rename', { targetId: rename, name })))
              setRename(null);
          }}
        />
      </Modal>
    </>
  );
}
