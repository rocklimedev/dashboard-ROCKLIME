import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parse } from '@babel/parser';
import { transformWithOxc } from 'vite';

const moduleUrl = (source) =>
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
// Compile the real JSX modules using the project's compiler. Mock only their UI/API imports.
const compile = async (file, imports) => {
  let { code } = await transformWithOxc(await fs.readFile(file, 'utf8'), fileURLToPath(file), {
    jsx: { runtime: 'automatic' },
  });
  const ast = parse(code, { sourceType: 'module' });
  const declarations = ast.program.body.filter((node) => node.type === 'ImportDeclaration');
  for (const node of declarations.reverse()) {
    const target = imports[node.source.value] ?? import.meta.resolve(node.source.value);
    code = code.slice(0, node.source.start) + JSON.stringify(target) + code.slice(node.source.end);
  }
  return moduleUrl(code);
};
const shellUrl = await compile(new URL('./ModalShell.jsx', import.meta.url), {
  antd: moduleUrl('export const Modal = "dialog";'),
});
const { default: ModalShell } = await import(shellUrl);
const previewHookUrl = moduleUrl(`
  export let result = {};
  export let args;
  export const setResult = (value) => { result = value; };
  export default function usePreview(...values) { args = values; return result; }
`);
const preview = await import(previewHookUrl);
const deleteUrl = await compile(new URL('./DeleteModal.jsx', import.meta.url), {
  '@ant-design/icons': moduleUrl('export const DeleteOutlined = "delete-icon";'),
  './ModalShell': shellUrl,
  '../Inventory/ProductDeletionPreview': moduleUrl('export default "product-preview";'),
  '../Inventory/useProductDeletionPreview': previewHookUrl,
});
const { default: DeleteModal } = await import(deleteUrl);
const dialog = (props) => {
  const element = DeleteModal(props);
  return element.type(element.props).props;
};

test('standard actions forward submission and both cancellation paths', () => {
  const calls = [];
  const props = ModalShell({
    open: true,
    title: 'Edit record',
    width: 640,
    onOk: () => calls.push('submit'),
    onCancel: () => calls.push('cancel'),
  }).props;
  props.onOk();
  props.onCancel();
  props.cancelButtonProps.onClick();
  assert.deepEqual(calls, ['submit', 'cancel', 'cancel']);
  assert.equal(props.width, 640);
  assert.equal(props.open, true);
});

test('saving blocks confirmation, cancellation, Escape, backdrop, and close button', () => {
  let calls = 0;
  const props = ModalShell({
    confirmLoading: true,
    onOk: () => calls++,
    onCancel: () => calls++,
    onCancelButton: () => calls++,
  }).props;
  props.onOk();
  props.onCancel();
  props.cancelButtonProps.onClick();
  assert.equal(calls, 0);
  for (const key of ['closable', 'maskClosable', 'keyboard']) assert.equal(props[key], false);
  assert.equal(props.okButtonProps.disabled, true);
  assert.equal(props.cancelButtonProps.disabled, true);
});

test('disabled submit remains blocked while cancellation is available', () => {
  const calls = [];
  const props = ModalShell({
    okButtonProps: { danger: true, disabled: true },
    onOk: () => calls.push('submit'),
    onCancel: () => calls.push('cancel'),
  }).props;
  props.onOk();
  props.cancelButtonProps.onClick();
  assert.deepEqual(calls, ['cancel']);
  assert.equal(props.okButtonProps.danger, true);
});

test('custom footer and a distinct footer cancel handler are preserved', () => {
  const calls = [];
  const footer = ['pdf', 'excel'];
  const props = ModalShell({
    footer,
    onCancel: () => calls.push('close'),
    onCancelButton: () => calls.push('reset-and-close'),
  }).props;
  assert.equal(props.footer, footer);
  props.onCancel();
  props.cancelButtonProps.onClick();
  assert.deepEqual(calls, ['close', 'reset-and-close']);
  assert.equal(ModalShell({ footer: null }).props.footer, null);
});

test('ordinary deletion waits for confirmation and does not request product checks', () => {
  const item = { id: 'order-1' };
  const confirmed = [];
  preview.setResult({});
  const props = dialog({
    item,
    itemType: 'Order',
    isVisible: true,
    onConfirm: (v) => confirmed.push(v),
  });
  assert.equal(preview.args[1], false);
  assert.deepEqual(confirmed, []);
  props.onOk();
  assert.deepEqual(confirmed, [item]);
});

test('product deletion is blocked while checking, after failure, or when referenced', () => {
  let deleted = 0;
  const item = { productId: 'p1', name: 'Tile' };
  for (const result of [{}, { failure: 'Offline' }, { report: { canDelete: false } }]) {
    preview.setResult(result);
    const props = dialog({
      item,
      itemType: 'Product',
      isVisible: true,
      onConfirm: () => deleted++,
    });
    assert.equal(preview.args[1], true);
    assert.equal(props.okButtonProps.disabled, true);
    props.onOk();
  }
  assert.equal(deleted, 0);
});

test('a successful reference check preserves single and bulk callback payloads', () => {
  const products = [
    { productId: 'p1', name: 'Tile' },
    { productId: 'p2', name: 'Marble' },
  ];
  const confirmed = [];
  preview.setResult({ report: { canDelete: true } });
  dialog({
    item: products[0],
    itemType: 'Product',
    isVisible: true,
    onConfirm: (v) => confirmed.push(v),
  }).onOk();
  dialog({ products, isVisible: true, onConfirm: (v) => confirmed.push(v) }).onOk();
  assert.deepEqual(confirmed, [products[0], products]);
});

test('an active delete cannot be submitted twice or dismissed', () => {
  let calls = 0;
  preview.setResult({ report: { canDelete: true } });
  const props = dialog({
    item: { productId: 'p1', name: 'Tile' },
    itemType: 'Product',
    isVisible: true,
    isLoading: true,
    onConfirm: () => calls++,
    onCancel: () => calls++,
  });
  props.onOk();
  props.onCancel();
  props.cancelButtonProps.onClick();
  assert.equal(calls, 0);
});

test('empty product selections do not open a confirmation or fetch a preview', () => {
  preview.setResult({});
  const props = dialog({ products: [], isVisible: true });
  assert.equal(props.open, false);
  assert.equal(preview.args[1], false);
});
