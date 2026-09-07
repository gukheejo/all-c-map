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
  getSheetDragBounds,
  getKakaoSelectedPanOffset,
  getSelectedMarkerOffset,
  getStoreBounds,
  limitInitialZoomLevel,
  loadKakaoMaps,
} = mapModule;
const { default: ExpandableCrewTalk } = await vite.ssrLoadModule('/src/components/ExpandableCrewTalk.jsx');
const {
  Cart,
  KakaoStorePreviewMap,
  StoreDetail,
  StoreHome,
  StoreNews,
  StoreNewsTabs,
  getStorePreviewCenter,
  updateStoreNewsQueries,
} = await vite.ssrLoadModule('/src/components/Screens.jsx');
const { BarcodeCard, PickupSheet } = await vite.ssrLoadModule('/src/components/Overlays.jsx');
const { CREW_TALKS, STORES, PRODUCTS, STORE_NEWS_TALKS, STORE_NOTICES } = await vite.ssrLoadModule('/src/data.js');
const {
  FIXED_LOCATION,
  buildStoreProducts,
  distanceKm,
  filterStoreCrewTalks,
  filterStoreNotices,
  formatDistance,
  filterCrewTalkItems,
  resolveSheetSnap,
  selectNearestStores,
  sortDatedItems,
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

test('the Figma quick tile stays separate from the accessible Kakao preview marker', () => {
  const html = renderToStaticMarkup(
    React.createElement(StoreHome, { onNav() {} }),
  );

  assert.match(html, /class="ic"><span class="olcl-art"><img src="\/icons\/qm-clover\.png"/);
  assert.match(html, /data-map-provider="kakao"/);
  assert.match(html, /올리브영 충무로역점, 재고 7개/);
});

test('the store entry page renders its preview on a Kakao map surface', () => {
  assert.equal(typeof KakaoStorePreviewMap, 'function');

  const html = renderToStaticMarkup(
    React.createElement(KakaoStorePreviewMap, { store: STORES[1] }),
  );

  assert.match(html, /data-map-provider="kakao"/);
  assert.match(html, /aria-label="충무로 주변 카카오 지도"/);
  assert.match(html, /올리브영 충무로역점/);
});

test('the compact Kakao preview centers the selected store inside its short viewport', () => {
  assert.equal(typeof getStorePreviewCenter, 'function');
  assert.deepEqual(getStorePreviewCenter(STORES[1]), {
    lat: 37.5615827,
    lng: 126.9962525,
  });
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
      sheetState: 'collapsed',
      sortOrder: 'latest',
      expandedTalkIds: [],
      onQueryChange() {},
      onSheetStateChange() {},
      onSortOrderChange() {},
      onToggleTalk() {},
      onClose() {},
    }),
  );

  assert.match(html, /class="sheet show collapsed crew-talk-sheet"/);
  assert.match(html, /data-sheet-drag-region="true"/);
  assert.match(html, /aria-label="크루톡 목록 펼치기"/);
  assert.match(html, />크루톡</);
  assert.match(html, /placeholder="궁금한 상품명을 검색해보세요"/);
  assert.match(html, /aria-label="크루톡 정렬"/);
  assert.match(html, /value="latest" selected="">최신순/);
  assert.match(html, /value="registered">등록순/);
  assert.equal((html.match(/class="crew-talk-feed-item"/g) ?? []).length, 5);
  assert.equal((html.match(/aria-expanded="false"/g) ?? []).length, 5);
});

test('Crew Talk search matches product, store, variant, and message keywords', () => {
  assert.equal(typeof filterCrewTalkItems, 'function');

  assert.deepEqual(
    filterCrewTalkItems(CREW_TALKS, '브링그린').map((item) => item.id),
    ['talk-p3'],
  );
  assert.deepEqual(
    filterCrewTalkItems(CREW_TALKS, '명동거리점').map((item) => item.id),
    ['talk-p4'],
  );
  assert.deepEqual(
    filterCrewTalkItems(CREW_TALKS, '가을 메이크업').map((item) => item.id),
    ['talk-p2'],
  );
  assert.equal(filterCrewTalkItems(CREW_TALKS, '없는 상품').length, 0);
});

test('dated feeds switch between newest-first and oldest-first registration order', () => {
  const fixture = [
    { id: 'middle', date: '2026.08.12' },
    { id: 'newest', date: '2026.08.19' },
    { id: 'oldest', date: '2026.08.01' },
  ];

  assert.deepEqual(sortDatedItems(fixture, 'latest').map((item) => item.id), ['newest', 'middle', 'oldest']);
  assert.deepEqual(sortDatedItems(fixture, 'registered').map((item) => item.id), ['oldest', 'middle', 'newest']);
  assert.deepEqual(fixture.map((item) => item.id), ['middle', 'newest', 'oldest']);
});

test('store-news search supports multiple keywords across notice and Crew Talk content', () => {
  const store = STORES.find((item) => item.id === 'chungmuro');

  assert.deepEqual(
    filterStoreNotices(STORE_NOTICES, store, '입고 온라인').map((item) => item.id),
    ['notice-1', 'notice-4'],
  );
  assert.deepEqual(
    filterStoreCrewTalks(STORE_NEWS_TALKS, store, '브링그린 민감성').map((item) => item.id),
    ['store-talk-p3'],
  );
});

test('the map uses a live map surface and the exact Figma dim layer', () => {
  const html = renderToStaticMarkup(
    React.createElement(MapScreen, { onNav() {}, onOpenProduct() {} }),
  );

  assert.match(html, /id="kakao-map"/);
  assert.match(html, /src="\/icons\/map-dim-screen\.svg"/);
  assert.doesNotMatch(html, /figma-myeongdong-map/);
});

test('the Kakao map loader rejects a missing JavaScript key with an actionable error', async () => {
  assert.equal(typeof loadKakaoMaps, 'function');
  await assert.rejects(
    loadKakaoMaps(''),
    /VITE_KAKAO_MAP_KEY/,
  );
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

test('Crew Talk drag bounds use exact half and full available map height', () => {
  assert.deepEqual(getSheetDragBounds(900, true), { minHeight: 450, maxHeight: 843 });
  assert.deepEqual(getSheetDragBounds(792, true), { minHeight: 396, maxHeight: 735 });
});

test('expandable Crew Talk keeps its message in the accessible name', () => {
  const html = renderToStaticMarkup(React.createElement(ExpandableCrewTalk, {
    label: '올리브영 충무로역점',
    message: '입고된 상품을 확인해보세요.',
    expanded: false,
  }));

  assert.doesNotMatch(html, /aria-label=/);
  assert.match(html, /입고된 상품을 확인해보세요\./);
  assert.match(html, /class="sr-only">전체 내용 보기/);
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
  assert.match(source, /onMouseDown:/);
  assert.match(source, /onTouchStart:/);
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

test('the store detail news button opens news for the selected store', () => {
  const selectedStore = STORES.find((store) => store.id === 'chungmuro');
  let openedStore = null;
  const detail = StoreDetail({
    store: selectedStore,
    onNav() {},
    onOrder() {},
    onOpenNews(store) { openedStore = store; },
    toastShown: true,
    onGoCart() {},
  });
  const bodyChildren = detail.props.children[0].props.children;
  const storeActions = bodyChildren.find((child) => child.props?.className === 'store-actions');
  const newsButton = storeActions.props.children[1];

  newsButton.props.onClick();

  assert.equal(openedStore, selectedStore);
});

test('store news renders the selected store notice feed from Figma 3.5-a', () => {
  const selectedStore = STORES.find((store) => store.id === 'chungmuro');
  const html = renderToStaticMarkup(
    React.createElement(StoreNews, {
      store: selectedStore,
      tab: 'notice',
      onBack() {},
      onTabChange() {},
    }),
  );

  assert.match(html, /id="screen-3-5-a"/);
  assert.match(html, /aria-selected="true"[^>]*>공지\(5\)/);
  assert.match(html, /placeholder="궁금한 소식을 검색해보세요"/);
  assert.match(html, /class="store-news-search"/);
  assert.match(html, /aria-label="공지 정렬"/);
  assert.match(html, /value="latest" selected="">최신순/);
  assert.match(html, /value="registered">등록순/);
  assert.match(html, /role="tabpanel"[^>]*aria-labelledby="store-news-notice-tab"/);
  assert.equal((html.match(/class="store-notice-item/g) ?? []).length, 5);
  assert.match(html, /올리브영 충무로역점/);
});

test('store news switches to the Figma 3.5-b Crew Talk feed', () => {
  const selectedStore = STORES.find((store) => store.id === 'chungmuro');
  let nextTab = null;
  const tabs = StoreNewsTabs({
    tab: 'notice',
    onTabChange(tab) { nextTab = tab; },
  });

  tabs.props.children[1].props.onClick();
  assert.equal(nextTab, 'crew');
  nextTab = null;
  tabs.props.children[0].props.onKeyDown({ key: 'ArrowRight' });
  assert.equal(nextTab, 'crew');
  nextTab = null;
  tabs.props.children[0].props.onKeyDown({ key: 'ArrowLeft' });
  assert.equal(nextTab, 'crew');
  nextTab = null;
  const crewTabs = StoreNewsTabs({ tab: 'crew', onTabChange(tab) { nextTab = tab; } });
  crewTabs.props.children[1].props.onKeyDown({ key: 'ArrowRight' });
  assert.equal(nextTab, 'notice');

  const tabsHtml = renderToStaticMarkup(
    React.createElement(StoreNewsTabs, { tab: 'notice', onTabChange() {} }),
  );
  assert.match(tabsHtml, /id="store-news-notice-tab"[^>]*aria-controls="store-news-notice-panel"[^>]*tabindex="0"/);
  assert.match(tabsHtml, /id="store-news-crew-tab"[^>]*aria-controls="store-news-crew-panel"[^>]*tabindex="-1"/);

  const html = renderToStaticMarkup(
    React.createElement(StoreNews, {
      store: selectedStore,
      tab: 'crew',
      onBack() {},
      onTabChange() {},
    }),
  );
  assert.match(html, /id="screen-3-5-b"/);
  assert.match(html, /aria-selected="true"[^>]*>크루톡\(11\)/);
  assert.match(html, /placeholder="궁금한 상품명을 검색해보세요"/);
  assert.match(html, /aria-label="크루톡 정렬"/);
  assert.match(html, /role="tabpanel"[^>]*aria-labelledby="store-news-crew-tab"/);
  assert.equal(STORE_NEWS_TALKS.length, 11);
  assert.equal((html.match(/class="store-news-talk-item/g) ?? []).length, 11);
  assert.equal((html.match(/<b>올리브영 충무로역점<\/b>/g) ?? []).length, 11);
  assert.equal((html.match(/aria-expanded="false"/g) ?? []).length, 11);
  assert.doesNotMatch(html, /명동거리점|올리브영 명동대로점|올리브영 명동역점/);
});

test('every product Crew Talk surface starts ellipsized and can expose expansion state', () => {
  const store = STORES.find((item) => item.id === 'chungmuro');
  const products = buildStoreProducts(PRODUCTS, store.stock);
  const detailHtml = renderToStaticMarkup(React.createElement(StoreDetail, {
    store,
    products,
    onNav() {},
    onOrder() {},
    toastShown: false,
  }));
  const sheetHtml = renderToStaticMarkup(React.createElement(StoreSheet, {
    store,
    sheetState: 'collapsed',
    onToggle() {},
    onOpenProduct() {},
    onOpenStore() {},
  }));

  assert.ok((detailHtml.match(/class="expandable-crewtalk(?: |")/g) ?? []).length > 0);
  assert.ok((sheetHtml.match(/class="expandable-crewtalk(?: |")/g) ?? []).length > 0);
  assert.equal(
    (detailHtml.match(/class="expandable-crewtalk(?: |")/g) ?? []).length,
    (detailHtml.match(/aria-expanded="false"/g) ?? []).length,
  );
  assert.equal(
    (sheetHtml.match(/class="expandable-crewtalk(?: |")/g) ?? []).length,
    (sheetHtml.match(/aria-expanded="false"/g) ?? []).length,
  );
});

test('notice and Crew Talk searches keep independent query values', () => {
  const noticeQueries = updateStoreNewsQueries({ notice: '', crew: '' }, 'notice', '입고알림');
  const crewQueries = updateStoreNewsQueries(noticeQueries, 'crew', '브링그린');

  assert.deepEqual(noticeQueries, { notice: '입고알림', crew: '' });
  assert.deepEqual(crewQueries, { notice: '입고알림', crew: '브링그린' });
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

test('the Kakao camera pans the selected marker above the sheet', () => {
  assert.deepEqual(getKakaoSelectedPanOffset(754, 400), { x: 0, y: 103 });
  assert.deepEqual(getKakaoSelectedPanOffset(448, 307), { x: 0, y: 163 });
});

test('the initial map viewport can fit all ten nearby stores', () => {
  const nearest = selectNearestStores(STORES, { lat: 37.5605, lng: 126.9948 }, 10);
  assert.deepEqual(getStoreBounds(nearest), [[126.977, 37.5606047], [127.0074, 37.5658]]);
});

test('the initial Kakao map view never opens wider than level five', () => {
  assert.equal(typeof limitInitialZoomLevel, 'function');
  assert.equal(limitInitialZoomLevel(7), 5);
  assert.equal(limitInitialZoomLevel(5), 5);
  assert.equal(limitInitialZoomLevel(4), 4);
});

test('the home tab uses the Figma outline-home artwork', () => {
  const html = renderToStaticMarkup(
    React.createElement(BottomNav, { active: 'store', onNav() {} }),
  );

  assert.match(html, /nav-home-figma-mask\.png/);
});
