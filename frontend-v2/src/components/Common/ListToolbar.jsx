import { Button, DatePicker, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import ListExportActions from './ListExportActions';
import './ListControls.css';

/** Controlled controls only: query, URL, debounce and permission state stay with the screen. */
export default function ListToolbar({
  search,
  filters = [],
  onClear,
  clearLabel = 'Clear',
  actions,
  exportData,
  exportTitle = 'Records',
  exportOptions,
}) {
  return (
    <div className="list-toolbar" role="group" aria-label={`${exportTitle} list controls`}>
      {search && (
        <div className="list-toolbar__search">
          <Input
            prefix={<SearchOutlined />}
            allowClear
            {...search}
            aria-label={search['aria-label'] ?? search.placeholder ?? 'Search records'}
          />
        </div>
      )}
      {filters
        .filter((filter) => !filter.hidden)
        .map(({ key, type = 'select', label, props = {}, children, content }) => (
          <div className={`list-toolbar__field list-toolbar__field--${type}`} key={key}>
            {label && <span className="list-toolbar__label">{label}</span>}
            {type === 'custom' ? (
              content
            ) : type === 'dateRange' ? (
              <DatePicker.RangePicker
                {...props}
                aria-label={props['aria-label'] ?? label ?? 'Date range'}
              />
            ) : (
              <Select
                {...props}
                aria-label={props['aria-label'] ?? props.placeholder ?? label ?? key}
              >
                {children}
              </Select>
            )}
          </div>
        ))}
      <div className="list-toolbar__actions">
        {onClear && <Button onClick={onClear}>{clearLabel}</Button>}
        <ListExportActions data={exportData} title={exportTitle} options={exportOptions} />
        {actions}
      </div>
    </div>
  );
}
