import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse } from '@babel/parser';
import { transformWithOxc } from 'vite';

const moduleUrl = (code) => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const mockUrl = moduleUrl(`
  export const state = { settings: {}, allowed: true, locked: false };
  export const useAuth = () => ({auth: {token: 'valid', permissions: []}, authChecked: true});
  export const useGetSettingsQuery = () => state.settings;
  export const useLocation = () => ({pathname: '/orders'});
  export const useRoles = () => [];
  export const configuredApps = () => [];
  export const appForPath = () => ({locked: state.locked});
  export const ADMIN_ROLES = [];
  export const Navigate = () => 'login';
  export const Outlet = () => 'content';
  export default function useCan() { return () => state.allowed; }
`);
const { state } = await import(mockUrl);
const file = new URL('./PrivateRoute.jsx', import.meta.url);
let { code } = await transformWithOxc(await fs.readFile(file, 'utf8'), fileURLToPath(file), {
  jsx: { runtime: 'automatic' },
});
const imports = parse(code, { sourceType: 'module' }).program.body.filter(
  (n) => n.type === 'ImportDeclaration',
);
for (const node of imports.reverse()) {
  const source = node.source.value;
  const target =
    source === 'react' || source === 'react/jsx-runtime'
      ? import.meta.resolve(source)
      : source.endsWith('/Loader')
        ? moduleUrl('export default function Loader() { return "loading"; }')
        : source.endsWith('/AccessDenied')
          ? moduleUrl('export default function AccessDenied() { return "access denied"; }')
          : mockUrl;
  code = code.slice(0, node.source.start) + JSON.stringify(target) + code.slice(node.source.end);
}
const { default: PrivateRoute } = await import(moduleUrl(code));
const render = () =>
  renderToStaticMarkup(
    createElement(PrivateRoute, {
      requiredPermission: { module: 'orders', action: 'view' },
    }),
  );

test('background settings failure retains confirmed access and recovers on refresh', () => {
  state.settings = { data: { data: {} }, isError: false };
  assert.equal(render(), 'content');
  state.settings = { ...state.settings, isError: true };
  assert.equal(render(), 'content');
  state.settings.isError = false;
  assert.equal(render(), 'content');
});

test('initial settings failure offers retry instead of false access denial', () => {
  state.settings = { isError: true, refetch() {} };
  assert.match(render(), /Try again/);
  assert.doesNotMatch(render(), /access denied/);
});

test('confirmed locks and missing permissions still deny access during refresh failure', () => {
  state.settings = { data: { data: {} }, isError: true };
  state.locked = true;
  assert.equal(render(), 'access denied');
  state.locked = false;
  state.allowed = false;
  assert.equal(render(), 'access denied');
  state.allowed = true;
});
