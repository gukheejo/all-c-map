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
const { Cart, StoreDetail, StoreHome } = await vite.ssrLoadModule('/src/components/Screens.jsx');
const { BarcodeCard, PickupSheet } = await vite.ssrLoadModule('/src/components/Overlays.jsx');
const { STORES, PRODUCTS } = await vite.ssrLoadModule('/src/data.js');
const {
  FIXED_LOCATION,
  buildStoreProducts,
  distanceKm,
  formatDistance,
  resolveSheetSnap,
  selectNearestStores,
  toggleExpandedId,
  walkingMinutes,
} = await vite.ssrLoadModule('/src/store-utils.js');
const { createPickupFlowState, pickupFlowReducer } = await vite.ssrLoadModule('/src/pickup-flow.js');

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

test('pickup flow skips 4-b and commits the selected store directly', () => {
  const store = STORES[1];
  const product = buildStoreProducts(PRODUCTS, store.stock)[0];
  let state = createPickupFlowState();
  state = pickupFlowReducer(state, { type: 'OPEN_STORE', store });
  state = pickupFlowReducer(state, { type: 'OPEN_PICKUP', product });
  state = pickupFlowReducer(state, { type: 'ADD_PICKUP_TO_CART' });

  assert.equal(state.screen, '4');
  assert.equal(state.overlay, 'added-toast');
  assert.equal(state.cart[0].store.id, store.id);
  assert.equal(state.cart[0].product.listKey, product.listKey);
});

test('pickup quantity is clamped to the remaining stock', () => {
  const product = { ...PRODUCTS[0], stock: 3 };
  let state = pickupFlowReducer(createPickupFlowState(), { type: 'OPEN_PICKUP', product });
  state = pickupFlowReducer(state, { type: 'CHANGE_PICKUP_QTY', delta: 99 });
  assert.equal(state.pickupDraft.qty, 3);
  state = pickupFlowReducer(state, { type: 'CHANGE_PICKUP_QTY', delta: -99 });
  assert.equal(state.pickupDraft.qty, 1);
});

test('pickup flow carries cart data through screens 5, 6, and 7', () => {
  const store = STORES[0];
  const product = buildStoreProducts(PRODUCTS, store.stock)[2];
  let state = createPickupFlowState();
  state = pickupFlowReducer(state, { type: 'OPEN_STORE', store });
  state = pickupFlowReducer(state, { type: 'OPEN_PICKUP', product });
  state = pickupFlowReducer(state, { type: 'ADD_PICKUP_TO_CART' });
  state = pickupFlowReducer(state, { type: 'GO_TO_CART' });
  assert.equal(state.screen, '6');
  assert.equal(state.overlay, 'none');
  state = pickupFlowReducer(state, { type: 'OPEN_BARCODE' });
  assert.equal(state.overlay, 'barcode');
  state = pickupFlowReducer(state, { type: 'CLOSE_OVERLAY' });
  assert.equal(state.screen, '6');
  assert.equal(state.overlay, 'none');
  assert.equal(state.cart[0].store.id, store.id);
});

test('cart quantity changes stay within the selected product stock', () => {
  const store = STORES[0];
  const product = { ...PRODUCTS[0], stock: 3 };
  let state = createPickupFlowState();
  state = pickupFlowReducer(state, { type: 'OPEN_STORE', store });
  state = pickupFlowReducer(state, { type: 'OPEN_PICKUP', product });
  state = pickupFlowReducer(state, { type: 'ADD_PICKUP_TO_CART' });
  state = pickupFlowReducer(state, { type: 'CHANGE_CART_QTY', index: 0, delta: 99 });
  assert.equal(state.cart[0].qty, 3);
  state = pickupFlowReducer(state, { type: 'CHANGE_CART_QTY', index: 0, delta: -99 });
  assert.equal(state.cart[0].qty, 1);
});

test('pickup flow supports product navigation and a full restart', () => {
  let state = pickupFlowReducer(createPickupFlowState(), { type: 'OPEN_PRODUCT', productId: 'p1' });
  assert.equal(state.screen, 'product');
  assert.equal(state.productId, 'p1');
  state = pickupFlowReducer(state, { type: 'NAVIGATE', screen: '3b' });
  assert.equal(state.screen, '3b');
  state = pickupFlowReducer(state, { type: 'RESTART' });
  assert.deepEqual(state, createPickupFlowState());
});

test('sheet release snaps on distance or flick velocity', () => {
  assert.equal(resolveSheetSnap('collapsed', -60, -0.1), 'expanded');
  assert.equal(resolveSheetSnap('collapsed', -8, -0.6), 'expanded');
  assert.equal(resolveSheetSnap('expanded', 60, 0.1), 'collapsed');
  assert.equal(resolveSheetSnap('expanded', 8, 0.6), 'collapsed');
  assert.equal(resolveSheetSnap('collapsed', -8, -0.1), 'collapsed');
});

test('the selected store sheet renders one row per marker stock number', () => {
  const selectedStore = STORES.find((store) => store.id === 'chungmuro');
  const html = renderToStaticMarkup(
    React.createElement(StoreSheet, {
      store: selectedStore,
      sheetState: 'collapsed',
      onToggle() {},
      onOpenProduct() {},
      onOpenStore() {},
    }),
  );

  assert.equal((html.match(/class="crew-item"/g) ?? []).length, 7);
  assert.equal((html.match(/class="badge-ai"/g) ?? []).length, 3);
  assert.match(html, /class="sheet-notice-card"/);
  assert.match(html, /\[입고알림\] 라스트픽 온라인 입고 완료되었습니다\./);
  assert.match(html, /12분 전/);
});

test('the map sheet separates store navigation from its drag region', async () => {
  const selectedStore = STORES.find((store) => store.id === 'chungmuro');
  const html = renderToStaticMarkup(
    React.createElement(StoreSheet, {
      store: selectedStore,
      sheetState: 'collapsed',
      onToggle() {},
      onOpenProduct() {},
      onOpenStore() {},
    }),
  );
  const source = await readFile(new URL('../src/components/MapScreen.jsx', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.match(html, /aria-label="올리브영 충무로역점 상세 보기"/);
  assert.match(html, /data-sheet-drag-region="true"/);
  assert.match(html, /class="sheet-toggle"[^>]*data-sheet-drag-region="true"/);
  assert.doesNotMatch(html, /class="sheet-head"[^>]*role="button"/);
  assert.match(source, /onOpenStore\(store\)/);
  assert.match(source, /initialSelectedStoreId/);
  assert.match(source, /onMouseDown=/);
  assert.match(source, /onTouchStart=/);
  assert.match(styles, /\.sheet-toggle\{[^}]*height:28px/);
});

test('store detail and pickup sheet render the selected map store and identical rows', () => {
  const store = STORES.find((item) => item.id === 'chungmuro');
  const products = buildStoreProducts(PRODUCTS, store.stock);
  const detail = renderToStaticMarkup(React.createElement(StoreDetail, {
    store,
    products,
    onNav() {},
    onOrder() {},
    toastShown: false,
    onDismissToast() {},
    onGoCart() {},
  }));
  const sheet = renderToStaticMarkup(React.createElement(PickupSheet, {
    store,
    product: products[0],
    qty: 1,
    onMinus() {},
    onPlus() {},
    onClose() {},
    onAddToCart() {},
  }));

  assert.match(detail, /올리브영 충무로역점/);
  assert.equal((detail.match(/data-detail-product="true"/g) ?? []).length, store.stock);
  assert.match(sheet, /올리브영 충무로역점/);
  assert.match(sheet, /disabled=""/);
});

test('store detail renders expiry and package-damage labels as condition badges', () => {
  const detail = renderToStaticMarkup(React.createElement(StoreDetail, {
    store: STORES[0],
    products: [PRODUCTS[0], PRODUCTS[1]],
    onNav() {},
    onOrder() {},
    toastShown: false,
    onDismissToast() {},
    onGoCart() {},
  }));

  assert.match(detail, /class="condition-badge">유통기한<\/span>/);
  assert.match(detail, /class="condition-badge">패키지 파손<\/span>/);
});

test('cart and barcode render the committed pickup store', () => {
  const store = { ...STORES.find((item) => item.id === 'chungmuro'), tel: '02-0000-0000' };
  const cart = [{ store, product: PRODUCTS[0], qty: 2 }];
  const cartHtml = renderToStaticMarkup(React.createElement(Cart, {
    onNav() {},
    cart,
    store,
    onQtyChange() {},
    onPurchase() {},
  }));
  const barcodeHtml = renderToStaticMarkup(React.createElement(BarcodeCard, {
    store,
    countdown: '5시간 57분 20초 이내',
    onClose() {},
    onRestart() {},
  }));

  assert.match(cartHtml, /올리브영 충무로역점/);
  assert.match(barcodeHtml, /올리브영 충무로역점/);
  assert.match(barcodeHtml, /서울특별시 중구 퇴계로 222/);
  assert.match(barcodeHtml, /02-0000-0000/);
});

test('App wires the direct pickup flow without the removed 4-b dialog', async () => {
  const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /ConfirmDialog|confirmOpen|keepExisting|switchStore/);
  assert.match(source, /onOpenStore=/);
  assert.match(source, /buildStoreProducts\(PRODUCTS, flow\.selectedStore\.stock\)/);
  assert.match(source, /initialSelectedStoreId=/);
});

test('the selected marker offset places it above a responsive bottom sheet', () => {
  assert.deepEqual(getSelectedMarkerOffset(754, 400), [0, -103]);
  assert.deepEqual(getSelectedMarkerOffset(448, 307), [0, -163]);
});

test('the selected camera centers every store above the sheet', () => {
  for (const store of STORES) {
    assert.deepEqual(getSelectedCameraOptions(store, 754, 400), {
      center: [store.lng, store.lat],
      offset: [0, -103],
      zoom: 15.5,
      duration: 450,
    });
  }
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
