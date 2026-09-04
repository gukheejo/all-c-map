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
const {
  default: MapScreen,
  StoreSheet,
  getSelectedCameraOptions,
  getSelectedMarkerOffset,
  getStoreBounds,
} = mapModule;
const { StoreHome } = await vite.ssrLoadModule('/src/components/Screens.jsx');
const { STORES, PRODUCTS } = await vite.ssrLoadModule('/src/data.js');
const {
  FIXED_LOCATION,
  buildStoreProducts,
  distanceKm,
  formatDistance,
  selectNearestStores,
  walkingMinutes,
} = await vite.ssrLoadModule('/src/store-utils.js');

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

test('the store home renders the missing Figma sections around the fixed location', () => {
  const html = renderToStaticMarkup(
    React.createElement(StoreHome, { onNav() {} }),
  );

  assert.match(html, /aria-label="매장 검색"/);
  assert.match(html, /aria-label="장바구니"/);
  assert.match(html, /서울시 중구 필동로 26 \(필동2가 101-1\)/);
  assert.match(html, /10일 전 장바구니에 담았어요/);
  assert.match(html, /2개월 전 구매했던 제품이에요/);
  assert.equal((html.match(/data-store-benefit="true"/g) ?? []).length, 2);
  assert.equal((html.match(/class="store-gift-notice"/g) ?? []).length, 2);
  assert.match(html, /올리브영 충무로역점/);
  assert.match(html, /0\.2km/);
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

test('Pildong-ro 26 is the fixed location and ranks Chungmuro Station first', () => {
  assert.deepEqual(FIXED_LOCATION, {
    address: '서울시 중구 필동로 26 (필동2가 101-1)',
    lat: 37.5605,
    lng: 126.9948,
  });

  const nearest = selectNearestStores(STORES, FIXED_LOCATION, 2);
  assert.deepEqual(nearest.map((store) => store.id), ['chungmuro', 'daero']);

  const nearestDistance = distanceKm(FIXED_LOCATION, nearest[0]);
  assert.equal(formatDistance(nearestDistance), '0.2km');
  assert.equal(walkingMinutes(nearestDistance), 3);
});

test('a marker stock number produces the same number of product rows', () => {
  const sevenRows = buildStoreProducts(PRODUCTS, 7);
  const thirtyTwoRows = buildStoreProducts(PRODUCTS, 32);

  assert.equal(sevenRows.length, 7);
  assert.equal(thirtyTwoRows.length, 32);
  assert.equal(new Set(thirtyTwoRows.map((product) => product.listKey)).size, 32);
});

test('a generated store product list exposes at most three AI PICK labels', () => {
  const rows = buildStoreProducts(PRODUCTS, 32);
  assert.equal(rows.filter((product) => product.badge === 'AI PICK').length, 3);
});

test('the selected store sheet renders one row per marker stock number', () => {
  const selectedStore = STORES.find((store) => store.id === 'chungmuro');
  const html = renderToStaticMarkup(
    React.createElement(StoreSheet, {
      store: selectedStore,
      sheetState: 'collapsed',
      onToggle() {},
      onOpenProduct() {},
    }),
  );

  assert.equal((html.match(/class="crew-item"/g) ?? []).length, 7);
  assert.equal((html.match(/class="badge-ai"/g) ?? []).length, 3);
  assert.match(html, /class="sheet-notice-card"/);
  assert.match(html, /\[입고알림\] 라스트픽 온라인 입고 완료되었습니다\./);
  assert.match(html, /12분 전/);
});

test('the selected marker offset places it above a responsive bottom sheet', () => {
  assert.deepEqual(getSelectedMarkerOffset(754, 400), [0, -103]);
  assert.deepEqual(getSelectedMarkerOffset(448, 307), [0, -163]);
});

test('the selected camera zooms in enough for max bounds to allow the vertical offset', () => {
  const selectedStore = STORES.find((store) => store.id === 'chungmuro');
  assert.deepEqual(getSelectedCameraOptions(selectedStore, 754, 400), {
    center: [126.9962525, 37.5615827],
    offset: [0, -103],
    zoom: 15.5,
    duration: 450,
  });
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
