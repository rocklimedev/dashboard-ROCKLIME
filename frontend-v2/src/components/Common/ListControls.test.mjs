import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { isValidElement } from 'react';
import { parse } from '@babel/parser';
import { transformWithOxc } from 'vite';
import { listRange } from './listPaginationUtils.js';

const moduleUrl = (code) => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const antUrl = moduleUrl(
  'export const Button="button", Dropdown="dropdown", Input="input", Select="select", Pagination="pagination", DatePicker={RangePicker:"range-picker"};',
);
const toastUrl = moduleUrl(
  'export const errors=[];export const toast={error:(value)=>errors.push(value)};',
);
const iconUrl = moduleUrl(
  'export const SearchOutlined="search-icon",DownloadOutlined="download-icon";',
);
const xlsxUrl = moduleUrl(
  'export const calls=[];export const utils={book_new:()=>({}),json_to_sheet:(rows)=>rows,book_append_sheet:()=>{}};export function writeFile(book,name){if(name==="fail.xlsx")throw Error("failure");calls.push(name);}',
);
const pdfUrl = moduleUrl(
  'export const calls=[];export class jsPDF {setFontSize(){}text(){}save(name){calls.push(name)}}',
);
const tableUrl = moduleUrl(
  'export const calls=[];export default function table(doc,options){calls.push(options)}',
);
const compile = async (name, extra = {}) => {
  const file = new URL(name, import.meta.url);
  let { code } = await transformWithOxc(await fs.readFile(file, 'utf8'), fileURLToPath(file), {
    jsx: { runtime: 'automatic' },
  });
  const aliases = {
    antd: antUrl,
    sonner: toastUrl,
    '@ant-design/icons': iconUrl,
    xlsx: xlsxUrl,
    jspdf: pdfUrl,
    'jspdf-autotable': tableUrl,
    './listPaginationUtils': new URL('./listPaginationUtils.js', import.meta.url).href,
    ...extra,
  };
  const edits = [];
  const walk = (n) => {
    if (!n || typeof n !== 'object') return;
    const source =
      n.type === 'ImportDeclaration'
        ? n.source
        : n.type === 'CallExpression' && n.callee.type === 'Import'
          ? n.arguments[0]
          : null;
    if (source) {
      if (source.value.endsWith('.css')) edits.push({ start: n.start, end: n.end, value: '' });
      else
        edits.push({
          start: source.start,
          end: source.end,
          value: JSON.stringify(aliases[source.value] ?? import.meta.resolve(source.value)),
        });
    }
    for (const [k, v] of Object.entries(n))
      if (k !== 'loc') {
        if (Array.isArray(v)) v.forEach(walk);
        else if (v && typeof v === 'object') walk(v);
      }
  };
  walk(parse(code, { sourceType: 'module' }));
  for (const e of edits.sort((a, b) => b.start - a.start))
    code = code.slice(0, e.start) + e.value + code.slice(e.end);
  return moduleUrl(code);
};
const exportUrl = await compile('./ListExportActions.jsx');
const { default: ListExportActions } = await import(exportUrl);
const { default: ListToolbar } = await import(
  await compile('./ListToolbar.jsx', { './ListExportActions': exportUrl })
);
const { default: ListPagination } = await import(await compile('./ListPagination.jsx'));
const find = (node, type) => {
  if (Array.isArray(node)) return node.flatMap((child) => find(child, type));
  if (!isValidElement(node)) return [];
  return [...(node.type === type ? [node] : []), ...find(node.props.children, type)];
};

test('search stays controlled and forwards the original event to screen debounce/URL handlers', () => {
  const calls = [];
  const tree = ListToolbar({
    search: {
      value: 'tile',
      placeholder: 'Search products',
      onChange: (event) => calls.push(event),
    },
  });
  const input = find(tree, 'input')[0];
  const event = { target: { value: 'marble' } };
  input.props.onChange(event);
  assert.equal(input.props.value, 'tile');
  assert.equal(input.props['aria-label'], 'Search products');
  assert.deepEqual(calls, [event]);
});

test('select and date-range values, presets and handlers survive the shared renderer', () => {
  const changes = [];
  const range = ['from', 'to'];
  const options = [{ value: 'pending', label: 'Pending' }];
  const tree = ListToolbar({
    filters: [
      { key: 'status', props: { value: 'pending', options, onChange: (v) => changes.push(v) } },
      { key: 'date', type: 'dateRange', props: { value: range, onChange: (v) => changes.push(v) } },
      { key: 'hidden', hidden: true, props: {} },
    ],
  });
  const select = find(tree, 'select')[0];
  const picker = find(tree, 'range-picker')[0];
  assert.equal(find(tree, 'select').length, 1);
  assert.equal(select.props.options, options);
  assert.equal(picker.props.value, range);
  select.props.onChange('complete');
  picker.props.onChange(null);
  assert.deepEqual(changes, ['complete', null]);
});

test('clear delegates to the screen and export receives only supplied visible rows', () => {
  let clears = 0;
  const rows = [{ Name: 'Tile' }];
  const tree = ListToolbar({ onClear: () => clears++, exportData: rows });
  find(tree, 'button')[0].props.onClick();
  assert.equal(clears, 1);
  assert.equal(find(tree, ListExportActions)[0].props.data, rows);
});

test('pagination keeps ordinary page navigation and resets to page one on page-size changes', () => {
  const changes = [];
  const tree = ListPagination({
    current: 3,
    pageSize: 20,
    total: 90,
    onChange: (...args) => changes.push(args),
    disabled: true,
  });
  const pager = find(tree, 'pagination')[0];
  pager.props.onChange(4, 20);
  pager.props.onChange(3, 50);
  pager.props.onChange(2);
  assert.deepEqual(changes, [
    [4, 20],
    [1, 50],
    [2, 20],
  ]);
  assert.equal(pager.props.disabled, true);
  assert.deepEqual(pager.props.pageSizeOptions, ['10', '20', '50', '100']);
});

test('pagination summaries handle empty and partial final pages', () => {
  assert.deepEqual(listRange(0, 1, 20), [0, 0]);
  assert.deepEqual(listRange(43, 3, 20), [41, 43]);
});

test('export controls respect disabled formats and empty data', () => {
  assert.equal(ListExportActions({ data: undefined }), null);
  assert.equal(ListExportActions({ data: [], options: { pdf: false, excel: false } }), null);
  assert.equal(ListExportActions({ data: [] }).props.disabled, true);
  const action = ListExportActions({ data: [{ Name: 'Tile' }], options: { excel: true } });
  assert.deepEqual(
    action.props.menu.items.map((item) => item.key),
    ['excel'],
  );
});

test('shared Excel and PDF actions export the provided columns and visible rows', async () => {
  const data = [{ Name: 'Tile', Stock: 5 }];
  const actions = ListExportActions({ data, title: 'Products' }).props.menu;
  await actions.onClick({ key: 'excel' });
  await actions.onClick({ key: 'pdf' });
  assert.deepEqual((await import(xlsxUrl)).calls, ['products.xlsx']);
  assert.deepEqual((await import(pdfUrl)).calls, ['products.pdf']);
  assert.deepEqual((await import(tableUrl)).calls[0].body, [['Tile', '5']]);
  assert.deepEqual((await import(tableUrl)).calls[0].head, [['Name', 'Stock']]);
});

test('failed exports show an actionable error instead of rejecting the event handler', async () => {
  await ListExportActions({ data: [{ Name: 'Tile' }], title: 'Fail' }).props.menu.onClick({
    key: 'excel',
  });
  assert.deepEqual((await import(toastUrl)).errors, ['Export failed. Please try again.']);
});
