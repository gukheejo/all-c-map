import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const vite = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
});

after(async () => {
  await vite.close();
});

const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
const { default: BottomNav } = await vite.ssrLoadModule('/src/components/BottomNav.jsx');
const mapModule = await vite.ssrLoadModule('/src/components/MapScreen.jsx');
const { default: MapScreen, selectNearestStores, getStoreBounds } = mapModule;
const { StoreHome } = await vite.ssrLoadModule('/src/components/Screens.jsx');
const { STORES } = await vite.ssrLoadModule('/src/data.js');

test('the app opens directly on the store screen', () => {
  const html = renderToStaticMarkup(React.createElement(App));
  assert.match(html, /id="screen-2"/);
});

test('only the store bottom tab is active and the other five tabs are disabled', () => {
  const html = renderToStaticMarkup(
    React.createElement(BottomNav, { active: 'store', onNav() {} }),
  );

  assert.match(html, /aria-current="page"[^>]*>.*올영매장/s);
  assert.equal((html.match(/ disabled=""/g) ?? []).length, 5);
});

test('All-C-Map is an accessible control that opens the 3-b experience', () => {
  const homeHtml = renderToStaticMarkup(
    React.createElement(StoreHome, { onNav() {} }),
  );
  const mapHtml = renderToStaticMarkup(
    React.createElement(MapScreen, { onNav() {}, onOpenProduct() {} }),
  );

  assert.match(homeHtml, /<button[^>]*>.*올클맵.*<\/button>/s);
  assert.match(mapHtml, /id="screen-3b"/);
  assert.match(mapHtml, /추천하는 매장이에요/);
});

test('the map uses a live map surface and the exact Figma dim layer', () => {
  const html = renderToStaticMarkup(
    React.createElement(MapScreen, { onNav() {}, onOpenProduct() {} }),
  );

  assert.match(html, /id="maplibre-map"/);
  assert.match(html, /src="\/icons\/map-dim-screen\.svg"/);
  assert.doesNotMatch(html, /figma-myeongdong-map/);
});

test('the real map tiles are served locally so the map opens without a third-party runtime request', async () => {
  const source = await readFile(new URL('../src/components/MapScreen.jsx', import.meta.url), 'utf8');

  assert.match(source, /\/map-tiles\/\{z\}\/\{x\}\/\{y\}\.png/);
  assert.doesNotMatch(source, /style:\s*['"]https:\/\//);
});

test('the live map limits visible stores to the nearest ten', () => {
  assert.equal(typeof selectNearestStores, 'function');

  const nearest = selectNearestStores(STORES, { lat: 37.5605, lng: 126.9948 }, 10);
  assert.equal(nearest.length, 10);
  assert.equal(new Set(nearest.map((store) => store.id)).size, 10);
});

test('the initial map viewport can fit all ten nearby stores', async () => {
  const nearest = selectNearestStores(STORES, { lat: 37.5605, lng: 126.9948 }, 10);
  assert.deepEqual(getStoreBounds(nearest), [[126.977, 37.5606047], [127.0074, 37.5658]]);

  const source = await readFile(new URL('../src/components/MapScreen.jsx', import.meta.url), 'utf8');
  assert.match(source, /map\.fitBounds/);
});

test('the home tab uses the Figma outline-home artwork', () => {
  const html = renderToStaticMarkup(
    React.createElement(BottomNav, { active: 'store', onNav() {} }),
  );

  assert.match(html, /nav-home-figma-mask\.png/);
});
