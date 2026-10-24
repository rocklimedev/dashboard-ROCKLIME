import './PoRow.styles.css';
// src/components/purchase/PORow.jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Tag, Select, Button, Dropdown, Menu } from 'antd';
import { EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';

import PermissionGate from '../../context/PermissionGate';

const PORow = ({
  po,
  idx,
  vendorMap,
  filters,
  handleEditPO,
  handleDeletePOClick,
  editingPOStatusId,
  setEditingPOStatusId,
  handlePOStatusChange,
  isUpdatingPOStatus,
  handleOpenDatesModal,
  poStatuses,
  isDueDateClose,
}) => {
  const navigate = useNavigate();

  const createdByDisplay = po?.createdBy ? (
    po.createdBy.name || po.createdBy.email || po.createdBy.username || '—'
  ) : (
    <span className="fv2-porow-cc065f44bb">-</span>
  );

  const serial = (filters.page - 1) * filters.limit + idx + 1;
  const vendorName = vendorMap[po.vendorId] || '—';
  const status = po.status || 'pending';

  return (
    <tr key={po.id}>
      <td>{serial}</td>

      <td>
        <div className="d-flex align-items-center gap-2">
          <Link to={`/po/${po.id}`}>{po.poNumber}</Link>
          {po.fgsId && (
            <Tag
              className="fv2-porow-8ad6aecd03"
              color="#e31e24"

              onClick={() => navigate(`/fgs/${po.fgsId}`)}
            >
              FGS
            </Tag>
          )}
        </div>
      </td>

      <td>
        <PermissionGate api="write" module="purchase_orders">
          {editingPOStatusId === po.id ? (
            <Select
              className="fv2-porow-838780829c"
              value={status}
              onChange={(val) => handlePOStatusChange(po.id, val)}

              loading={isUpdatingPOStatus}
              autoFocus
              size="small"
              onBlur={() => setEditingPOStatusId(null)}
            >
              {poStatuses.map((s) => (
                <Select.Option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Select.Option>
              ))}
            </Select>
          ) : (
            <div
              className="d-flex align-items-center gap-2 pointer fv2-porow-3ff098635b"
              onClick={() => setEditingPOStatusId(po.id)}
            >
              <span className={`priority-badge status-${status}` + ' fv2-porow-1f08035a43'}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
              <EditOutlined className="fv2-porow-e775d198c6" />
            </div>
          )}
        </PermissionGate>
      </td>

      <td>{vendorName}</td>

      <td>{po.totalAmount ? `Rs. ${Number(po.totalAmount).toLocaleString('en-IN')}` : '—'}</td>

      <td>
        {po.orderDate
          ? new Date(po.orderDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '—'}
      </td>

      <td>
        {po.expectDeliveryDate ? (
          <span
            className={
              `due-date-link ${isDueDateClose(po.expectDeliveryDate) ? 'due-date-close' : ''}` +
              ' fv2-porow-28983f1965'
            }

            onClick={() => handleOpenDatesModal(po.expectDeliveryDate, po.followupDates || [])}
          >
            {new Date(po.expectDeliveryDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ) : (
          '—'
        )}
      </td>

      <td>{createdByDisplay}</td>

      <td>
        <div className="d-flex gap-2 align-items-center">
          <PermissionGate api="edit" module="purchase_orders">
            <EditOutlined
              className="fv2-porow-57b48e880a"

              onClick={() => handleEditPO(po)}
            />
          </PermissionGate>

          <PermissionGate api="delete" module="purchase_orders">
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item
                    key="delete"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeletePOClick(po.id)}
                  >
                    Delete
                  </Menu.Item>
                </Menu>
              }
              trigger={['click']}
              placement="bottomRight"
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </PermissionGate>
        </div>
      </td>
    </tr>
  );
};

export default PORow;
