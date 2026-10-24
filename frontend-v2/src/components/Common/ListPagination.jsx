import { Pagination } from 'antd';
import './ListControls.css';
import { listRange } from './listPaginationUtils';

/** Shared footer for both native tables and Ant Design tables with pagination={false}. */
export default function ListPagination({
  current = 1,
  pageSize = 20,
  total = 0,
  onChange,
  itemLabel = 'records',
  showSizeChanger = false,
  showSummary = true,
  ...props
}) {
  const [first, last] = listRange(total, current, pageSize);
  return (
    <div className="list-pagination" aria-label={`${itemLabel} pagination`}>
      {showSummary && (
        <span className="list-pagination__summary">
          Showing {first}–{last} of {total} {itemLabel}
        </span>
      )}
      <Pagination
        {...props}
        current={current}
        pageSize={pageSize}
        total={total}
        showSizeChanger={showSizeChanger}
        pageSizeOptions={props.pageSizeOptions ?? ['10', '20', '50', '100']}
        onChange={(page, nextSize = pageSize) =>
          onChange?.(nextSize !== pageSize ? 1 : page, nextSize)
        }
      />
    </div>
  );
}
