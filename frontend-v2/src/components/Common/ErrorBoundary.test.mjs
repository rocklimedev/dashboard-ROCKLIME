import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse } from '@babel/parser';
import { transformWithOxc } from 'vite';

const url = (code) => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const compile = async (file, overrides = {}) => {
  let { code } = await transformWithOxc(await fs.readFile(file, 'utf8'), fileURLToPath(file), {
    jsx: { runtime: 'automatic' },
  });
  const imports = parse(code, { sourceType: 'module' }).program.body.filter(
    (n) => n.type === 'ImportDeclaration',
  );
  for (const n of imports.reverse()) {
    if (n.source.value.endsWith('.css')) code = code.slice(0, n.start) + code.slice(n.end);
    else
      code =
        code.slice(0, n.source.start) +
        JSON.stringify(overrides[n.source.value] ?? import.meta.resolve(n.source.value)) +
        code.slice(n.source.end);
  }
  return url(code);
};
const boundaryUrl = await compile(new URL('./ErrorBoundary.jsx', import.meta.url));
const { default: ErrorBoundary } = await import(boundaryUrl);
const routerMock = url(
  'export let location = {key:"first"}; export const navigate = (key) => {location = {key};}; export const useLocation = () => location;',
);
const router = await import(routerMock);
const { default: RouteErrorBoundary } = await import(
  await compile(new URL('../../router/RouteErrorBoundary.jsx', import.meta.url), {
    'react-router-dom': routerMock,
    '../components/Common/ErrorBoundary': boundaryUrl,
  })
);
const failed = (props = {}) => {
  const boundary = new ErrorBoundary(props);
  boundary.state = ErrorBoundary.getDerivedStateFromError(new Error('PRIVATE_STACK_DETAILS'));
  return boundary;
};

test('healthy boundaries return their children unchanged', () => {
  const children = createElement('p', null, 'Healthy screen');
  assert.equal(new ErrorBoundary({ children }).render(), children);
});

test('area failures show a named recovery message without leaking the error', () => {
  const html = renderToStaticMarkup(failed({ area: 'Orders' }).render());
  assert.match(html, /Orders could not be displayed/);
  assert.match(html, /role="alert"/);
  assert.match(html, /Try again/);
  assert.match(html, /href="\/"/);
  assert.match(html, /Reload page/);
  assert.doesNotMatch(html, /PRIVATE_STACK_DETAILS/);
});

test('root fallback works without the router, Redux, Ant Design, or auth providers', () => {
  const html = renderToStaticMarkup(failed({ variant: 'root' }).render());
  assert.match(html, /Something went wrong/);
  assert.match(html, /error-boundary--root/);
  assert.doesNotMatch(html, /page-wrapper/);
});

test('retry requests that the failed state is cleared', () => {
  const boundary = failed();
  const updates = [];
  boundary.setState = (value) => updates.push(value);
  boundary.reset();
  assert.deepEqual(updates, [{ hasError: false }]);
});

test('a new navigation resets a failed area, but not the same failed navigation', () => {
  const boundary = failed({ resetKey: 'second' });
  let resets = 0;
  boundary.reset = () => resets++;
  boundary.componentDidUpdate({ resetKey: 'second' });
  assert.equal(resets, 0);
  boundary.componentDidUpdate({ resetKey: 'first' });
  assert.equal(resets, 1);
});

test('healthy boundaries are not reset during navigation', () => {
  const boundary = new ErrorBoundary({ resetKey: 'second' });
  let resets = 0;
  boundary.reset = () => resets++;
  boundary.componentDidUpdate({ resetKey: 'first' });
  assert.equal(resets, 0);
});

test('route wrappers track navigation without using a remount key on healthy layouts', () => {
  router.navigate('orders-one');
  const first = RouteErrorBoundary({ area: 'Orders', children: 'screen' });
  router.navigate('orders-two');
  const second = RouteErrorBoundary({ area: 'Orders', children: 'screen' });
  assert.notEqual(first.props.resetKey, second.props.resetKey);
  assert.equal(first.key, null);
  assert.equal(second.key, null);
  assert.equal(second.props.children, 'screen');
  assert.equal(second.props.variant, 'page');
});

test('public and home screens use a fallback without sidebar margins', () => {
  const boundary = RouteErrorBoundary({ hasSidebar: false, children: 'public screen' });
  assert.equal(boundary.props.variant, 'screen');
});
