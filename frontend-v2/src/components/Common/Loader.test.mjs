import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse } from '@babel/parser';
import { transformWithOxc } from 'vite';

// Exercise the real component without requiring a browser or CSS loader.
const file = new URL('./Loader.jsx', import.meta.url);
let { code } = await transformWithOxc(await fs.readFile(file, 'utf8'), fileURLToPath(file), {
  jsx: { runtime: 'automatic' },
});
const imports = parse(code, { sourceType: 'module' }).program.body.filter(
  (node) => node.type === 'ImportDeclaration',
);
for (const node of imports.reverse()) {
  if (node.source.value.endsWith('.css')) code = code.slice(0, node.start) + code.slice(node.end);
  else
    code =
      code.slice(0, node.source.start) +
      JSON.stringify(import.meta.resolve(node.source.value)) +
      code.slice(node.source.end);
}
const { default: Loader } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
);
const render = (props) => renderToStaticMarkup(createElement(Loader, props));

test('inactive standalone and fullscreen loaders render nothing', () => {
  assert.equal(render({ loading: false }), '');
  assert.equal(render({ loading: false, fullscreen: true }), '');
});

test('inline loaders preserve compact sizing and caller classes without blocking the page', () => {
  const html = render({ size: 'small', className: 'search-indicator' });
  assert.match(html, /cm-loader--small/);
  assert.match(html, /search-indicator/);
  assert.doesNotMatch(html, /global-loader/);
});

test('fullscreen loading retains the global overlay and its large indicator', () => {
  const html = render({ loading: true, fullscreen: true });
  assert.match(html, /id="global-loader"/);
  assert.match(html, /cm-loader-fullscreen/);
  assert.match(html, /cm-loader--large/);
});

test('wrapped content remains mounted and blocked while loading, with its message', () => {
  const html = render({
    loading: true,
    tip: 'Fetching products',
    children: createElement('button', null, 'Keep my form'),
  });
  assert.match(html, /Keep my form/);
  assert.match(html, /Fetching products/);
  assert.match(html, /inert=""/);
  assert.match(html, /aria-busy="true"/);
  assert.doesNotMatch(html, /global-loader/);
});

test('wrapped content becomes usable again when loading ends', () => {
  const html = render({ loading: false, children: createElement('button', null, 'Keep my form') });
  assert.match(html, /Keep my form/);
  assert.doesNotMatch(html, /inert=/);
  assert.doesNotMatch(html, /role="status"/);
  assert.match(html, /aria-busy="false"/);
});

test('standalone tips and an accessible status label are visible without Ant Design', () => {
  const html = render({ tip: 'Loading your catalogue' });
  assert.match(html, /Loading your catalogue/);
  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="polite"/);
  assert.doesNotMatch(html, /ant-spin/);
});
