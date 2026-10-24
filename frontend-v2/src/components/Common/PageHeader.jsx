import './PageHeader.styles.css';
import React from 'react';
import { Tooltip, Switch } from 'antd';
import ListExportActions from './ListExportActions';
import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
const PageHeader = ({
  title,
  subtitle,
  onAdd,
  addLabel, // ← Text of the add button (default "+ Add <title>")
  tableData, // ← Rows for the PDF/Excel buttons; without it the buttons are hidden
  exportOptions = { pdf: true, excel: true },
  extra, // ← Accepts any JSX (buttons, toggles, etc.)
  viewToggle, // ← Optional: For card/list toggle
}) => {
  return (
    <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
      {/* Left Side - Title & Subtitle */}
      <div className="add-item">
        <div className="page-title">
          <h4 className="fw-bold mb-1">{title}</h4>
          {subtitle && <h6 className="text-muted mb-0">{subtitle}</h6>}
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="d-flex align-items-center gap-3">
        {/* Export Buttons */}
        <ListExportActions data={tableData} title={title} options={exportOptions} />

        {/* View Toggle (Card/List) - Optional */}
        {viewToggle && (
          <Tooltip title={viewToggle.viewMode === 'card' ? 'List View' : 'Card View'}>
            <Switch
              checkedChildren={<AppstoreOutlined />}
              unCheckedChildren={<UnorderedListOutlined />}
              checked={viewToggle.viewMode === 'card'}
              onChange={viewToggle.onChange}
            />
          </Tooltip>
        )}

        {/* Custom Extra Content (Book Mode Toggle, Filters, etc.) */}
        {extra && <div className="d-flex align-items-center">{extra}</div>}

        {/* Add Button */}
        {onAdd && (
          <button onClick={onAdd} className="btn btn-primary">
            {addLabel || `+ Add ${title}`}
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
