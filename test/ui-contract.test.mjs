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
  CrewTalkFilters,
  CrewTalkSheet,
  default: MapScreen,
  StoreSheet,
  getSelectedCameraOptions,
  getSelectedMarkerOffset,
  getStoreBounds,
} = mapModule;
const { Cart, StoreDetail, StoreHome } = await vite.ssrLoadModule('/src/components/Screens.jsx');
const { BarcodeCard, ConfirmDialog, PickupSheet } = await vite.ssrLoadModule('/src/components/Overlays.jsx');
const { CREW_TALKS, STORES, PRODUCTS } = await vite.ssrLoadModule('/src/data.js');
const {
  FIXED_LOCATION,
  buildStoreProducts,
  distanceKm,
  formatDistance,
  filterCrewTalkItems,
  selectNearestStores,
  toggleExpandedId,
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

test('the All-C-Map quick tile uses the clover artwork and recommendation copy starts collapsed', () => {
  const html = renderToStaticMarkup(
    React.createElement(StoreHome, { onNav() {} }),
  );

  assert.match(html, /<button[^>]*aria-label="올클맵 열기"[^>]*>.*src="\/icons\/qm-clover\.png"/s);
  assert.equal((html.match(/aria-expanded="false"/g) ?? []).length, 2);
});

test('the Figma quick tile and map stock badge use separate visual layers', () => {
  const html = renderToStaticMarkup(
    React.createElement(StoreHome, { onNav() {} }),
  );

  assert.match(html, /class="ic"><span class="olcl-art"><img src="\/icons\/qm-clover\.png"/);
  assert.match(html, /class="pin"><span class="pin-label">올리브영 충무로역점<\/span><span class="pin-stock">7<\/span>/);
});

test('a Crew Talk item toggles independently between collapsed and expanded', () => {
  assert.deepEqual(toggleExpandedId([], 'p1'), ['p1']);
  assert.deepEqual(toggleExpandedId(['p1', 'p3'], 'p1'), ['p3']);
  assert.deepEqual(toggleExpandedId(['p1'], 'p3'), ['p1', 'p3']);
});

test('the map Crew Talk shortcut exposes its pressed state', () => {
  assert.equal(typeof CrewTalkFilters, 'function');

  const inactiveHtml = renderToStaticMarkup(
    React.createElement(CrewTalkFilters, { crewTalkOpen: false, onCrewTalkToggle() {} }),
  );
  const activeHtml = renderToStaticMarkup(
    React.createElement(CrewTalkFilters, { crewTalkOpen: true, onCrewTalkToggle() {} }),
  );

  assert.match(inactiveHtml, /aria-pressed="false"/);
  assert.match(activeHtml, /aria-pressed="true"/);
  assert.match(activeHtml, /class="crew-talk-filter active"/);
});

test('the Crew Talk sheet renders the searchable Figma 3-e feed', () => {
  assert.equal(typeof CrewTalkSheet, 'function');

  const html = renderToStaticMarkup(
    React.createElement(CrewTalkSheet, {
      items: CREW_TALKS,
      query: '',
      expandedTalkIds: [],
      onQueryChange() {},
      onToggleTalk() {},
      onClose() {},
    }),
  );

  assert.match(html, /class="sheet show expanded crew-talk-sheet"/);
  assert.match(html, />크루톡</);
  assert.match(html, /placeholder="궁금한 상품명을 검색해보세요"/);
  assert.match(html, />최신순</);
  assert.equal((html.match(/class="crew-talk-feed-item"/g) ?? []).length, 5);
  assert.equal((html.match(/aria-expanded="false"/g) ?? []).length, 5);
});

test('Crew Talk search matches product and store names', () => {
  assert.equal(typeof filterCrewTalkItems, 'function');

  assert.deepEqual(
    filterCrewTalkItems(CREW_TALKS, '브링그린').map((item) => item.id),
    ['talk-p3'],
  );
  assert.deepEqual(
    filterCrewTalkItems(CREW_TALKS, '명동거리점').map((item) => item.id),
    ['talk-p4'],
  );
  assert.equal(filterCrewTalkItems(CREW_TALKS, '없는 상품').length, 0);
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

test('the store title opens the selected store without toggling the sheet', () => {
  const selectedStore = STORES.find((store) => store.id === 'chungmuro');
  let openedStore = null;
  let toggleCount = 0;
  const sheet = StoreSheet({
    store: selectedStore,
    sheetState: 'collapsed',
    onToggle() { toggleCount += 1; },
    onOpenStore(store) { openedStore = store; },
    onOpenProduct() {},
  });
  const controls = sheet.props.children[0].props.children;
  const storeTitleButton = controls.find((child) => child.props?.className === 'store-title');

  assert.equal(storeTitleButton.type, 'button');
  storeTitleButton.props.onClick();
  assert.equal(openedStore, selectedStore);
  assert.equal(toggleCount, 0);
});

test('the store sheet toggle exposes collapsed and expanded state', () => {
  const selectedStore = STORES.find((store) => store.id === 'chungmuro');
  const renderSheet = (sheetState) => renderToStaticMarkup(
    React.createElement(StoreSheet, {
      store: selectedStore,
      sheetState,
      onToggle() {},
      onOpenStore() {},
      onOpenProduct() {},
    }),
  );

  assert.match(renderSheet('collapsed'), /aria-expanded="false"/);
  assert.match(renderSheet('expanded'), /aria-expanded="true"/);
});

test('the store detail renders the selected store name', () => {
  const selectedStore = STORES.find((store) => store.id === 'chungmuro');
  const html = renderToStaticMarkup(
    React.createElement(StoreDetail, {
      store: selectedStore,
      onNav() {},
      onOrder() {},
      toastShown: false,
      onGoCart() {},
    }),
  );

  assert.equal((html.match(/올리브영 충무로역점/g) ?? []).length, 2);
  assert.doesNotMatch(html, /올리브영 명동 타운/);
  assert.match(html, /서울특별시 중구 퇴계로 222/);
  assert.doesNotMatch(html, /OLIVE YOUNG MYEONGDONG GLOBAL/);
});

test('the selected store remains consistent through pickup, confirmation, cart, and barcode', () => {
  const selectedStore = STORES.find((store) => store.id === 'chungmuro');
  const product = PRODUCTS[0];
  const pickupHtml = renderToStaticMarkup(
    React.createElement(PickupSheet, { store: selectedStore, product, qty: 1 }),
  );
  const confirmHtml = renderToStaticMarkup(
    React.createElement(ConfirmDialog, { store: selectedStore }),
  );
  const cartHtml = renderToStaticMarkup(
    React.createElement(Cart, {
      onNav() {},
      cart: [{ store: selectedStore, product, qty: 1 }],
      onQtyChange() {},
      onPurchase() {},
    }),
  );
  const barcodeHtml = renderToStaticMarkup(
    React.createElement(BarcodeCard, { store: selectedStore, countdown: '1초' }),
  );

  for (const html of [pickupHtml, confirmHtml, cartHtml, barcodeHtml]) {
    assert.match(html, /올리브영 충무로역점/);
    assert.doesNotMatch(html, /올리브영 명동 타운/);
  }
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
