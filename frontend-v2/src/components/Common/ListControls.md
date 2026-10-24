Shared list controls
====================

Orders, quotations, purchase orders/FGS, customers, products, users, brands, and
jobs use `ListToolbar` and `ListPagination`. Layout, search rendering, select/date
controls, clear/export actions, page-size choices, and the result summary live in
these shared components and `ListControls.css`.

Screens keep their own controlled values and callbacks. Their API queries,
debouncing, URL parameters, permission checks, status tabs, and table row actions
remain in the screen. The toolbar does not add its own debounce or duplicate
query state.

```jsx
<ListToolbar
  search={{ value: search, onChange: handleSearch, placeholder: 'Search orders' }}
  filters={[
    { key: 'status', props: { value: status, onChange: setStatus, options: statuses } },
    { key: 'dates', type: 'dateRange', props: { value: dates, onChange: setDates } },
  ]}
  onClear={clearFilters}
  exportTitle="Orders"
  exportData={visibleOrders.map((order) => ({ Number: order.orderNo, Status: order.status }))}
/>
<Table pagination={false} />
<ListPagination current={page} pageSize={limit} total={total} onChange={changePage} showSizeChanger />
```

Filters can be `select` (the default), `dateRange`, or `custom`. A custom filter's
`content` slot supports specialized controls such as status groups, price bounds,
or the "Only mine" checkbox. `hidden` hides a configured filter. `actions` accepts
screen-specific toolbar actions.

Exports use explicit projected fields, not entire API objects. "Export visible
rows" exports the filtered rows currently rendered, not every server-side page.
PDF/Excel implementations are also reused by `PageHeader`. Formats are optional
via `exportOptions={{ pdf: true, excel: true }}`. Export libraries load on demand.

Pagination is controlled and starts at 1. It resets the requested page to 1 when
the page size changes; the screen callback must store the new size as well.
Server-paginated records are not sliced again. Brands are filtered and paged in
memory because that endpoint returns the full collection. Jobs search explicitly
filters the loaded page because its endpoint does not support a search query.
The existing users search/status filters also operate on the loaded user page.

Run `npm run test:lists` for control callbacks, pagination, and export tests.
