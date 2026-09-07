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
  getDismissedMapUiState,
  getSheetDragBounds,
  getKakaoSelectedPanOffset,
  shouldShowMapDim,
  getSelectedMarkerOffset,
  getStoreBounds,
  limitInitialZoomLevel,
  loadKakaoMaps,
} = mapModule;
const { default: ExpandableCrewTalk } = await vite.ssrLoadModule('/src/components/ExpandableCrewTalk.jsx');
const {
  Cart,
  KakaoStorePreviewMap,
  ProductDetail,
  StoreDetail,
  StoreHome,
  StoreNews,
  StoreNewsTabs,
  getStorePreviewCenter,
  selectHomePreviewStore,
  updateStoreNewsQueries,
} = await vite.ssrLoadModule('/src/components/Screens.jsx');
const { BarcodeCard, PickupSheet } = await vite.ssrLoadModule('/src/components/Overlays.jsx');
const { CREW_TALKS, STORES, PRODUCTS, STORE_NEWS_TALKS, STORE_NOTICES, getStoreNewsForStore } = await vite.ssrLoadModule('/src/data.js');
const {
  FIXED_LOCATION,
  buildStoreProducts,
  buildStoreProductsForStore,
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

test('content screens use document scrolling while the interactive map keeps viewport scrolling', () => {
  const appHtml = renderToStaticMarkup(React.createElement(App));
  const productHtml = renderToStaticMarkup(
    React.createElement(ProductDetail, {
      product: PRODUCTS[0],
      store: STORES[1],
      onBack() {},
      onOrder() {},
    }),
  );
  const mapHtml = renderToStaticMarkup(
    React.createElement(MapScreen, { onNav() {}, onOpenProduct() {} }),
  );

  assert.match(appHtml, /id="stage"[^>]*data-layout="document"/);
  assert.match(productHtml, /id="screen-product"[^>]*data-scroll-mode="document"/);
  assert.match(mapHtml, /id="screen-3b"[^>]*data-scroll-mode="viewport"/);
});

test('product detail hides the global bottom navigation and keeps pickup actions', () => {
  const html = renderToStaticMarkup(
    React.createElement(ProductDetail, {
      product: PRODUCTS[0],
      store: STORES[1],
      onBack() {},
      onOrder() {},
    }),
  );

  assert.doesNotMatch(html, /class="bottomnav"/);
  assert.match(html, /class="product-detail-orderbar"/);
  assert.match(html, />픽업주문<\/button>/);
});

test('entering All-C-Map from store home clears any stale store selection', () => {
  let state = createPickupFlowState();
  state = pickupFlowReducer(state, { type: 'OPEN_STORE', store: STORES[1] });
  state = pickupFlowReducer(state, { type: 'ENTER_MAP' });

  assert.equal(state.screen, '3b');
  assert.equal(state.selectedStore, null);
  assert.equal(state.overlay, 'none');
});

test('the product catalog contains fifteen ranked products with demo stock and at least 35 percent off', () => {
  assert.equal(PRODUCTS.length, 15);
  PRODUCTS.forEach((product) => {
    assert.ok(product.stock >= 1 && product.stock <= 6);
    assert.ok(product.pct >= 35);
    assert.ok(product.price <= Math.floor(product.orig * 0.65));
    assert.match(product.img, /^https:\/\/image\.oliveyoung\.co\.kr\//);
  });
});

test('product detail mirrors the Figma product page and can open pickup ordering', () => {
  const product = PRODUCTS[0];
  const html = renderToStaticMarkup(React.createElement(ProductDetail, {
    product,
    store: STORES[1],
    onBack() {},
    onOrder() {},
  }));

  assert.match(html, /id="screen-product"/);
  assert.match(html, /class="product-detail-hero"/);
  assert.match(html, /올리브영 충무로역점/);
  assert.match(html, /class="badge-ai">AI PICK<\/span>/);
  assert.match(html, /class="condition-badge"/);
  assert.match(html, /픽업주문/);
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
  assert.match(html, /0\.0km/);
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
  assert.match(html, /올리브영 CJ인재원점, 재고 2개/);
});

test('the store home keeps the CJ training center in its map preview', () => {
  const stores = [
    { id: 'closer-store', lat: 37.559175, lng: 126.995635 },
    { id: 'cj-training-center', lat: 37.56, lng: 126.996 },
  ];

  assert.equal(typeof selectHomePreviewStore, 'function');
  assert.equal(selectHomePreviewStore(stores).id, 'cj-training-center');
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

test('the store entry map preview and recommended products expose detail navigation controls', () => {
  const html = renderToStaticMarkup(
    React.createElement(StoreHome, { onNav() {}, onOpenProduct() {} }),
  );

  assert.match(html, /<button[^>]*aria-label="올클맵 지도 미리보기 열기"/);
  assert.match(html, /<button[^>]*aria-label="\[레오파드 헬로키티\] 웨이크메이크 19종 골라담기 상품 상세 보기"/);
  assert.match(html, /<button[^>]*aria-label="벨먼 고보습 크리미 스크럽워시 400\+75ml 상품 상세 보기"/);
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

test('the operating-hours chip exposes and toggles its visual pressed state', () => {
  let toggles = 0;
  const filters = CrewTalkFilters({
    operatingActive: false,
    onOperatingToggle() { toggles += 1; },
    crewTalkOpen: false,
    onCrewTalkToggle() {},
  });
  const operatingChip = filters.props.children[0];

  assert.equal(operatingChip.type, 'button');
  assert.equal(operatingChip.props['aria-pressed'], false);
  operatingChip.props.onClick();
  assert.equal(toggles, 1);

  const activeFilters = CrewTalkFilters({
    operatingActive: true,
    onOperatingToggle() {},
    crewTalkOpen: false,
    onCrewTalkToggle() {},
  });
  assert.match(activeFilters.props.children[0].props.className, /active/);
  assert.equal(activeFilters.props.children[0].props['aria-pressed'], true);
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
  assert.match(html, /<h2 class="store-title">크루톡<\/h2>/);
  assert.doesNotMatch(html, /aria-label="크루톡 바텀시트 닫기"/);
  assert.doesNotMatch(html, /src="\/icons\/map-link\.svg"/);
  assert.match(html, /placeholder="궁금한 상품명을 검색해보세요"/);
  assert.match(html, /aria-label="크루톡 정렬"/);
  assert.match(html, /value="latest" selected="">최신순/);
  assert.match(html, /value="registered">등록순/);
  assert.equal((html.match(/class="crew-talk-feed-item"/g) ?? []).length, 11);
  assert.equal((html.match(/aria-expanded="false"/g) ?? []).length, 11);
});

test('the All-C-Map Crew Talk feed aggregates every nearby store', () => {
  assert.equal(CREW_TALKS.length, 11);
  assert.deepEqual(
    new Set(CREW_TALKS.map((item) => item.store.id)),
    new Set(STORES.map((store) => store.id)),
  );
});

test('Crew Talk search matches product, store, variant, and message keywords', () => {
  assert.equal(typeof filterCrewTalkItems, 'function');

  assert.deepEqual(
    filterCrewTalkItems(CREW_TALKS, '벨먼').map((item) => item.id),
    ['talk-p3'],
  );
  assert.deepEqual(
    filterCrewTalkItems(CREW_TALKS, '동대문역사문화공원역점').map((item) => item.id),
    ['talk-p6'],
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
    filterStoreCrewTalks(STORE_NEWS_TALKS, store, '벨먼 촉촉한').map((item) => item.id),
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

test('the map dim remains active after transient sheets and banners close', () => {
  assert.equal(shouldShowMapDim?.({
    showAiBanner: false,
    selectedStore: null,
    crewTalkOpen: false,
  }), true);
});

test('tapping the map background closes Crew Talk and restores the search button', () => {
  assert.deepEqual(getDismissedMapUiState?.({
    selectedId: 'chungmuro',
    sheetState: 'expanded',
    crewTalkOpen: true,
    crewTalkSheetState: 'expanded',
    showSearchButton: false,
  }), {
    selectedId: null,
    sheetState: 'closed',
    crewTalkOpen: false,
    crewTalkSheetState: 'collapsed',
    showSearchButton: true,
  });
});

test('the Figma map dim layer fits the viewport so its spotlight remains visible', async () => {
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  const dimAsset = await readFile(new URL('../public/icons/map-dim-screen.svg', import.meta.url), 'utf8');

  assert.match(styles, /\.map-dim-art\{[^}]*width:100%[^}]*height:100%/);
  assert.doesNotMatch(styles, /\.map-dim-art\{[^}]*width:245%/);
  assert.match(dimAsset, /preserveAspectRatio="xMidYMid slice"/);
  assert.doesNotMatch(dimAsset, /preserveAspectRatio="none"/);
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

test('the CJ training center store appears first at the fixed Pildong address', () => {
  const nearest = selectNearestStores(STORES, FIXED_LOCATION, 1);

  assert.deepEqual(nearest, [{
    id: 'cj-training-center',
    name: '올리브영 CJ인재원점',
    addr: '서울특별시 중구 필동로 26 (필동2가 101-1)',
    lat: 37.559175,
    lng: 126.995635,
    stock: 2,
    ai: true,
  }]);
});

test('Pildong-ro 26 is the fixed location and ranks the CJ training center first', () => {
  assert.deepEqual(FIXED_LOCATION, {
    address: '서울시 중구 필동로 26 (필동2가 101-1)',
    lat: 37.559175,
    lng: 126.995635,
  });

  const nearest = selectNearestStores(STORES, FIXED_LOCATION, 2);
  assert.deepEqual(nearest.map((store) => store.id), ['cj-training-center', 'chungmuro']);

  const nearestDistance = distanceKm(FIXED_LOCATION, nearest[0]);
  assert.equal(formatDistance(nearestDistance), '0.0km');
  assert.equal(walkingMinutes(nearestDistance), 1);
});

test('the CJ training center marker has minimal placeholder news until details are defined', () => {
  const store = STORES.find((item) => item.id === 'cj-training-center');
  const news = getStoreNewsForStore(store);

  assert.equal(news.notices.length, 1);
  assert.equal(news.crewTalks.length, 1);
});

test('a marker stock number produces unique rows without exceeding the catalog', () => {
  const sevenRows = buildStoreProducts(PRODUCTS, 7);
  const thirtyTwoRows = buildStoreProducts(PRODUCTS, 32);

  assert.equal(sevenRows.length, 7);
  assert.equal(thirtyTwoRows.length, 15);
  assert.equal(new Set(thirtyTwoRows.map((product) => product.id)).size, 15);
});

test('all marker counts fit the unique catalog and vary between stores', () => {
  assert.ok(STORES.every((store) => store.stock >= 1 && store.stock <= PRODUCTS.length));
  assert.ok(new Set(STORES.map((store) => store.stock)).size >= 6);
});

test('product Crew Talk cards are distributed through the store list', () => {
  const talkIndices = PRODUCTS
    .map((product, index) => product.talk ? index : -1)
    .filter((index) => index >= 0);

  assert.ok(talkIndices.some((index) => index < 4));
  assert.ok(talkIndices.some((index) => index >= 7));
  assert.ok(PRODUCTS.slice(0, 8).some((product) => !product.talk));
});

test('the same product gets stable, distinct Crew Talk copy for every store', () => {
  const messages = STORES.map((store) => (
    buildStoreProductsForStore(PRODUCTS, { ...store, stock: 1 })[0].talk
  ));
  const townMessage = buildStoreProductsForStore(PRODUCTS, { ...STORES[0], stock: 1 })[0].talk;

  assert.equal(new Set(messages).size, STORES.length);
  assert.equal(townMessage, messages[0]);
  assert.match(messages[0], /명동 타운/);
  assert.match(messages[1], /충무로역점/);
});

test('a generated store product list exposes at most three AI PICK labels', () => {
  const rows = buildStoreProducts(PRODUCTS, 32);
  assert.equal(rows.filter((product) => product.badge === 'AI PICK').length, 3);
});

test('only AI PICK stores expose AI PICK products throughout the store flow', () => {
  assert.equal(typeof buildStoreProductsForStore, 'function');
  if (!buildStoreProductsForStore) return;

  const aiStore = STORES.find((store) => store.id === 'cj-training-center');
  const standardStore = STORES.find((store) => store.id === 'jungang');
  const aiRows = buildStoreProductsForStore(PRODUCTS, aiStore);
  const standardRows = buildStoreProductsForStore(PRODUCTS, standardStore);

  assert.equal(aiStore.ai, true);
  assert.equal(aiRows.filter((product) => product.badge === 'AI PICK').length, 2);
  assert.equal(standardRows.some((product) => product.badge === 'AI PICK'), false);
});

test('condition badges are evenly and deterministically distributed per store', () => {
  const allowedConditions = new Set([undefined, '유통기한', '패키지 파손']);
  const conditionPatterns = STORES.map((store) => {
    const rows = buildStoreProducts(PRODUCTS, store.stock, 3, store.id);
    const conditions = rows.map((product) => product.badge2);

    assert.ok(conditions.every((condition) => allowedConditions.has(condition)));
    const counts = [...allowedConditions].map(
      (condition) => conditions.filter((value) => value === condition).length,
    );
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
    if (conditions.length > 3) {
      const isSimpleCycle = [0, 1, 2].some((offset) => conditions.every(
        (condition, index) => condition === [...allowedConditions][(index + offset) % 3],
      ));
      assert.equal(isSimpleCycle, false);
    }
    assert.deepEqual(rows, buildStoreProducts(PRODUCTS, store.stock, 3, store.id));
    return conditions.join('|');
  });

  assert.ok(new Set(conditionPatterns).size >= 2);
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

test('collapsed sheets rest at an uncapped 55 percent and can expand to the available map height', () => {
  assert.deepEqual(getSheetDragBounds(900, true), { minHeight: 900 * 0.55, maxHeight: 843 });
  assert.deepEqual(getSheetDragBounds(792, true), { minHeight: 792 * 0.55, maxHeight: 735 });
  assert.deepEqual(getSheetDragBounds(900), { minHeight: 900 * 0.55, maxHeight: 843 });
});

test('the map dim spotlight stays fixed when a store is selected', async () => {
  const html = renderToStaticMarkup(React.createElement(MapScreen, {
    onNav() {},
    onOpenProduct() {},
    initialSelectedStoreId: 'chungmuro',
  }));
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.match(html, /class="map-dim-art"/);
  assert.doesNotMatch(html, /map-dim-art selected-store/);
  assert.doesNotMatch(styles, /\.map-dim-art\.selected-store/);
});

test('only selected AI PICK markers use the dark green-highlighted state', async () => {
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.match(styles, /\.map-marker\.ai \.map-marker-label\{[^}]*border-width:2px/);
  assert.match(styles, /\.map-marker\.ai\.selected \.map-marker-label\{[^}]*background:#222[^}]*border-color:var\(--ai-green\)[^}]*color:#fff/);
  assert.match(styles, /\.map-marker\.ai\.selected \.map-marker-badge\{[^}]*background:var\(--ai-green\)/);
  assert.doesNotMatch(styles, /\.map-marker\.selected \.map-marker-label\{[^}]*background:#222/);
  assert.doesNotMatch(styles, /\.map-marker\.selected \.map-marker-badge\{[^}]*background:var\(--ai-green\)/);
});

test('the AI PICK store preview uses the same two-pixel green stroke as the map marker', async () => {
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.match(styles, /\.reco-map \.pin\{[^}]*border:2px solid var\(--ai-green\)/);
});

test('stock count badges sit slightly farther right on both map views', async () => {
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.match(styles, /\.reco-map \.pin-stock\{[^}]*right:-2px/);
  assert.match(styles, /\.map-marker-badge\{[^}]*right:-3px/);
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
  assert.equal((html.match(/class="orig"/g) ?? []).length, 7);
  assert.match(html, /class="orig">44,000원<\/span>/);
  assert.match(html, /class="sheet-notice-card"/);
  assert.match(html, /\[입고알림\] 라스트픽 온라인 입고 완료되었습니다\./);
  assert.match(html, /12분 전/);
});

test('the map store notice card opens the selected store notice tab', () => {
  const selectedStore = STORES.find((store) => store.id === 'chungmuro');
  let state = pickupFlowReducer(createPickupFlowState(), { type: 'ENTER_MAP' });
  state = pickupFlowReducer(state, { type: 'OPEN_STORE_NEWS', store: selectedStore });
  const html = renderToStaticMarkup(
    React.createElement(StoreSheet, {
      store: selectedStore,
      sheetState: 'collapsed',
      onToggle() {},
      onOpenProduct() {},
      onOpenStore() {},
      onOpenNews() {},
    }),
  );

  assert.equal(state.screen, '3.5a');
  assert.equal(state.selectedStore, selectedStore);
  assert.match(html, /<button[^>]*class="sheet-notice-card"[^>]*aria-label="올리브영 충무로역점 매장 공지 보기"/);
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
  const products = buildStoreProducts(PRODUCTS, store.stock, 3, store.id);
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
  assert.equal((detail.match(/class="badge-ai"/g) ?? []).length, 3);
  assert.match(sheet, /올리브영 충무로역점/);
  assert.match(sheet, /class="badge-ai">AI PICK<\/span>/);
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
  assert.match(html, /aria-selected="true"[^>]*>크루톡\(6\)/);
  assert.match(html, /placeholder="궁금한 상품명을 검색해보세요"/);
  assert.match(html, /aria-label="크루톡 정렬"/);
  assert.match(html, /role="tabpanel"[^>]*aria-labelledby="store-news-crew-tab"/);
  assert.equal(STORE_NEWS_TALKS.length, 11);
  assert.equal((html.match(/class="store-news-talk-item/g) ?? []).length, 6);
  assert.equal((html.match(/<b>올리브영 충무로역점<\/b>/g) ?? []).length, 6);
  assert.equal((html.match(/aria-expanded="false"/g) ?? []).length, 6);
  assert.doesNotMatch(html, /명동거리점|올리브영 명동대로점|올리브영 명동역점/);
});

test('store-news Crew Talk products open detail and return to the Crew Talk tab', () => {
  const selectedStore = STORES.find((store) => store.id === 'chungmuro');
  const html = renderToStaticMarkup(
    React.createElement(StoreNews, {
      store: selectedStore,
      tab: 'crew',
      onBack() {},
      onTabChange() {},
      onOpenProduct() {},
    }),
  );
  let state = pickupFlowReducer(createPickupFlowState(), { type: 'OPEN_STORE_NEWS', store: selectedStore });
  state = pickupFlowReducer(state, { type: 'NAVIGATE', screen: '3.5b' });
  state = pickupFlowReducer(state, {
    type: 'OPEN_PRODUCT',
    productId: PRODUCTS[2].id,
    store: selectedStore,
    returnScreen: '3.5b',
  });

  assert.match(html, /aria-label="벨먼 고보습 크리미 스크럽워시 400\+75ml 상세 보기"/);
  assert.equal(state.screen, 'product');
  assert.equal(state.productReturnScreen, '3.5b');
  assert.equal(state.selectedStore, selectedStore);
  state = pickupFlowReducer(state, { type: 'NAVIGATE', screen: state.productReturnScreen });
  assert.equal(state.screen, '3.5b');
});

test('store news uses stable store-specific counts, dates, and copy', () => {
  const town = STORES.find((store) => store.id === 'town');
  const chungmuro = STORES.find((store) => store.id === 'chungmuro');
  const renderNews = (store, tab) => renderToStaticMarkup(
    React.createElement(StoreNews, {
      store,
      tab,
      onBack() {},
      onTabChange() {},
    }),
  );

  const townNotices = renderNews(town, 'notice');
  const chungmuroNotices = renderNews(chungmuro, 'notice');
  const townTalks = renderNews(town, 'crew');
  const chungmuroTalks = renderNews(chungmuro, 'crew');

  assert.equal((townNotices.match(/class="store-notice-item/g) ?? []).length, 3);
  assert.equal((chungmuroNotices.match(/class="store-notice-item/g) ?? []).length, 5);
  assert.equal((townTalks.match(/class="store-news-talk-item/g) ?? []).length, 4);
  assert.equal((chungmuroTalks.match(/class="store-news-talk-item/g) ?? []).length, 6);
  assert.match(townNotices, /2026\.09\.03/);
  assert.match(chungmuroNotices, /2026\.09\.01/);
  assert.match(townNotices, /명동 타운 한정/);
  assert.match(chungmuroNotices, /충무로역점 픽업존/);
  assert.match(townTalks, /명동 타운 크루가 추천하는/);
  assert.match(chungmuroTalks, /충무로역점 크루가 직접 비교한/);
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

test('every Crew Talk feed provides enough copy to visibly demonstrate collapsed ellipsis', () => {
  const messages = [
    ...CREW_TALKS.map((item) => item.message),
    ...STORE_NEWS_TALKS.map((item) => item.message),
  ];

  assert.ok(messages.length >= 21);
  assert.ok(messages.every((message) => message.length >= 70));
});

test('store-detail Crew Talk is constrained to the card width', async () => {
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.match(styles, /\.pcard \.talk\{[^}]*width:100%[^}]*max-width:100%[^}]*overflow:hidden/);
  assert.match(styles, /\.pcard \.talk \.crewtalk-text\{[^}]*flex:1/);
});

test('the selected store title keeps the Figma spacing before its chevron', async () => {
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.match(styles, /\.sheet-head \.store-title\{[^}]*gap:10px/);
});

test('notice and Crew Talk searches keep independent query values', () => {
  const noticeQueries = updateStoreNewsQueries({ notice: '', crew: '' }, 'notice', '입고알림');
  const crewQueries = updateStoreNewsQueries(noticeQueries, 'crew', '벨먼');

  assert.deepEqual(noticeQueries, { notice: '입고알림', crew: '' });
  assert.deepEqual(crewQueries, { notice: '입고알림', crew: '벨먼' });
});

test('the store-news sort control keeps its full visible width clickable', async () => {
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.match(styles, /\.crew-talk-sort select,\.store-news-sort select\{[^}]*width:100%/);
  assert.match(styles, /\.crew-talk-sort img,\.store-news-sort img\{[^}]*pointer-events:none/);
});

test('map and store-news sort controls share the compact down-chevron treatment', async () => {
  const crewSheet = renderToStaticMarkup(React.createElement(CrewTalkSheet, {
    items: CREW_TALKS,
    query: '',
    sortOrder: 'latest',
    expandedTalkIds: [],
    onQueryChange() {},
    onSheetStateChange() {},
    onSortOrderChange() {},
    onToggleTalk() {},
    onClose() {},
  }));
  const storeNews = renderToStaticMarkup(React.createElement(StoreNews, {
    store: STORES[1],
    tab: 'notice',
    onBack() {},
    onTabChange() {},
  }));
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  const crewSortMarkup = crewSheet.match(/<label class="crew-talk-sort">.*?<\/label>/)?.[0] ?? '';

  assert.match(crewSortMarkup, /src="\/icons\/store-arrow\.svg"/);
  assert.match(storeNews, /src="\/icons\/store-arrow\.svg"/);
  assert.doesNotMatch(crewSortMarkup, /src="\/icons\/map-link\.svg"/);
  assert.match(styles, /\.crew-talk-sort,\.store-news-sort\{[^}]*width:54px/);
  assert.match(styles, /\.crew-talk-sort img,\.store-news-sort img\{[^}]*width:16px[^}]*height:16px/);
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

test('AI PICK and condition badges share the Figma badge metrics', async () => {
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.match(styles, /\.badge-ai,\.condition-badge,\.crew-item \.badge-gray\{[^}]*font-size:8px[^}]*padding:3px 4px[^}]*border-radius:10px/);
  assert.doesNotMatch(styles, /\.pcard \.condition-badge\{/);
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

test('cart quantity stepper uses a minus glyph instead of a down chevron', async () => {
  const minusIcon = await readFile(new URL('../public/icons/cart-minus.svg', import.meta.url), 'utf8');

  assert.match(minusIcon, /d="M3\.75 7\.5H11\.25"/);
  assert.doesNotMatch(minusIcon, /L7\.5 9\.375L11\.25 5\.625/);
});

test('App wires the direct pickup flow without the removed 4-b dialog', async () => {
  const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /ConfirmDialog|confirmOpen|keepExisting|switchStore/);
  assert.match(source, /onOpenStore=/);
  assert.match(source, /buildStoreProductsForStore\(PRODUCTS, flow\.selectedStore\)/);
  assert.match(source, /initialSelectedStoreId=/);
});

test('the selected marker offset places it above a responsive bottom sheet', () => {
  assert.deepEqual(getSelectedMarkerOffset(754, 400), [0, -61]);
  assert.deepEqual(getSelectedMarkerOffset(754, 450), [0, -111]);
  assert.deepEqual(getSelectedMarkerOffset(448, 307), [0, -121]);
});

test('the Kakao camera pans the selected marker above the sheet', () => {
  assert.deepEqual(getKakaoSelectedPanOffset(754, 400), { x: 0, y: 61 });
  assert.deepEqual(getKakaoSelectedPanOffset(448, 307), { x: 0, y: 121 });
});

test('the initial map viewport can fit all ten nearby stores', () => {
  const nearest = selectNearestStores(STORES, FIXED_LOCATION, 10);
  assert.deepEqual(getStoreBounds(nearest), [[126.9829236, 37.559175], [127.0074, 37.5651]]);
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

test('bottom navigation slides below the viewport while a bottom sheet is open', async () => {
  const hiddenNav = renderToStaticMarkup(
    React.createElement(BottomNav, { active: 'store', onNav() {}, hidden: true }),
  );
  const mapWithStoreSheet = renderToStaticMarkup(
    React.createElement(MapScreen, {
      onNav() {},
      onOpenProduct() {},
      initialSelectedStoreId: 'chungmuro',
    }),
  );
  const storeWithPickupSheet = renderToStaticMarkup(
    React.createElement(StoreDetail, {
      store: STORES[0],
      products: [PRODUCTS[0]],
      onNav() {},
      onOrder() {},
      bottomNavHidden: true,
    }),
  );
  const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

  assert.match(hiddenNav, /class="bottomnav is-hidden"/);
  assert.match(hiddenNav, /aria-hidden="true"/);
  assert.match(mapWithStoreSheet, /class="bottomnav is-hidden"/);
  assert.match(storeWithPickupSheet, /class="bottomnav is-hidden"/);
  assert.match(styles, /\.bottomnav\.is-hidden\{[^}]*translateY\(100%\)[^}]*pointer-events:none/);
  assert.match(styles, /#stage\[data-layout="document"\] \.bottomnav\.is-hidden\{[^}]*translate\(-50%,100%\)/);
});
