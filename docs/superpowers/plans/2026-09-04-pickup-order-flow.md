# Pickup Order Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Figma 3-c/3-d → 4 → 4-a → 5 → 6 → 7 pickup-order journey with selected-store data continuity and a flickable map bottom sheet.

**Architecture:** A pure pickup-flow reducer will own legal screen/overlay transitions and retain the selected store, draft quantity, and committed cart data. Both the map sheet and store detail will derive rows through `buildStoreProducts`, while a pure gesture resolver will determine whether a pointer release snaps the map sheet to its collapsed or expanded state.

**Tech Stack:** React 18, Vite 5, MapLibre GL, CSS, Node's built-in test runner

**Spec:** `docs/superpowers/specs/2026-09-04-pickup-order-flow-design.md`

## Global Constraints

- Screen `4-b` and `ConfirmDialog` must not appear anywhere in the completed interaction flow.
- Quantity is always an integer from `1` through the selected product's `stock`, inclusive.
- The selected store's map sheet and screen `4` must both use `buildStoreProducts(PRODUCTS, selectedStore.stock)`.
- Product row count must equal the selected marker count and no more than three rows may carry `AI PICK`.
- Existing fixed-location, marker camera-centering, marker shadow/size, and selected-marker z-index behavior must remain intact.
- Do not add a routing, gesture, or state-management dependency.

---

### Task 0: Preserve the Completed Marker Corrections

**Files:**
- Modify: `src/styles.css`
- Modify: `test/ui-contract.test.mjs`

**Interfaces:**
- Preserves: absolute MapLibre marker positioning, Figma marker dimensions/shadow, selected-marker z-index, and all-store camera assertions already present in the working tree.

- [ ] **Step 1: Verify the existing marker work before isolating it**

Run: `npm test`

Expected: all current UI-contract tests PASS, including the parameterized selected-camera test.

Run: `npm run build`

Expected: Vite production build succeeds.

- [ ] **Step 2: Review only the pre-existing marker diff**

Run: `git diff -- src/styles.css test/ui-contract.test.mjs`

Expected: the diff contains only the already completed marker positioning, sizing, shadow, selected z-index, and all-store camera coverage described by the design spec.

- [ ] **Step 3: Commit the completed marker corrections separately**

```bash
git add src/styles.css test/ui-contract.test.mjs
git commit -m "fix: align selected map markers"
```

---

### Task 1: Encode Pickup Flow and Sheet Snap Rules as Pure Functions

**Files:**
- Create: `src/pickup-flow.js`
- Modify: `src/store-utils.js`
- Modify: `test/ui-contract.test.mjs`

**Interfaces:**
- Produces: `createPickupFlowState()` returning `{ screen, selectedStore, productId, pickupDraft, cart, overlay }`.
- Produces: `pickupFlowReducer(state, action)` supporting `NAVIGATE`, `OPEN_PRODUCT`, `OPEN_STORE`, `OPEN_PICKUP`, `CHANGE_PICKUP_QTY`, `ADD_PICKUP_TO_CART`, `GO_TO_CART`, `OPEN_BARCODE`, `CLOSE_OVERLAY`, and `RESTART`.
- Produces: `resolveSheetSnap(currentState, deltaY, velocityY)` returning `'collapsed'` or `'expanded'`.

- [ ] **Step 1: Add failing reducer and gesture tests**

Add imports and focused tests to `test/ui-contract.test.mjs`:

```js
const { createPickupFlowState, pickupFlowReducer } = await vite.ssrLoadModule('/src/pickup-flow.js');
const { resolveSheetSnap } = await vite.ssrLoadModule('/src/store-utils.js');

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

test('sheet release snaps on distance or flick velocity', () => {
  assert.equal(resolveSheetSnap('collapsed', -60, -0.1), 'expanded');
  assert.equal(resolveSheetSnap('collapsed', -8, -0.6), 'expanded');
  assert.equal(resolveSheetSnap('expanded', 60, 0.1), 'collapsed');
  assert.equal(resolveSheetSnap('expanded', 8, 0.6), 'collapsed');
  assert.equal(resolveSheetSnap('collapsed', -8, -0.1), 'collapsed');
});
```

- [ ] **Step 2: Run the tests and confirm the new imports fail**

Run: `npm test`

Expected: FAIL because `src/pickup-flow.js` and `resolveSheetSnap` do not exist.

- [ ] **Step 3: Implement the minimal pure state and gesture rules**

Create `src/pickup-flow.js` with a reducer that uses one overlay value at a time. `ADD_PICKUP_TO_CART` must create exactly one entry from `selectedStore` and `pickupDraft`, set `screen: '4'`, clear the draft, and set `overlay: 'added-toast'`. `GO_TO_CART` sets `screen: '6'`; `OPEN_BARCODE` sets `overlay: 'barcode'`; `RESTART` returns a fresh initial state.

Add this resolver to `src/store-utils.js`:

```js
export function resolveSheetSnap(currentState, deltaY, velocityY) {
  const distanceThreshold = 48;
  const velocityThreshold = 0.45;
  if (deltaY <= -distanceThreshold || velocityY <= -velocityThreshold) return 'expanded';
  if (deltaY >= distanceThreshold || velocityY >= velocityThreshold) return 'collapsed';
  return currentState;
}
```

- [ ] **Step 4: Run the unit tests**

Run: `npm test`

Expected: all reducer, quantity, gesture, and existing UI-contract tests PASS.

- [ ] **Step 5: Commit the pure flow rules**

```bash
git add src/pickup-flow.js src/store-utils.js test/ui-contract.test.mjs
git commit -m "feat: define pickup flow state transitions"
```

---

### Task 2: Add Store Navigation and Drag-to-Snap to the Map Sheet

**Files:**
- Modify: `src/components/MapScreen.jsx`
- Modify: `src/styles.css`
- Modify: `test/ui-contract.test.mjs`

**Interfaces:**
- Consumes: `resolveSheetSnap(currentState, deltaY, velocityY)` from Task 1.
- Changes: `MapScreen({ onNav, onOpenProduct, onOpenStore, initialSelectedStoreId })`.
- Changes: `StoreSheet({ store, sheetState, onToggle, onOpenProduct, onOpenStore, sheetRef })`.
- Produces: pointer-driven temporary sheet height and a final collapsed/expanded state callback.

- [ ] **Step 1: Add failing structural tests for independent title navigation and gesture controls**

Extend the existing `StoreSheet` render test:

```js
const html = renderToStaticMarkup(React.createElement(StoreSheet, {
  store: selectedStore,
  sheetState: 'collapsed',
  onToggle() {},
  onOpenProduct() {},
  onOpenStore() {},
}));
assert.match(html, /aria-label="올리브영 충무로역점 상세 보기"/);
assert.match(html, /data-sheet-drag-region="true"/);
```

Also read `MapScreen.jsx` and assert that `onOpenStore(selectedStore)` is wired rather than navigating with a hardcoded store.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test`

Expected: FAIL because the title is not an independent detail-navigation control and no drag region exists.

- [ ] **Step 3: Implement pointer dragging on the sheet header**

In `StoreSheet`, keep pointer state in refs containing `startY`, `startTime`, `startHeight`, and `dragged`. On `pointerdown`, capture the pointer and read the current sheet height. On `pointermove`, clamp the inline height between the collapsed height and `stageHeight - 57px`. On `pointerup`, compute `deltaY` and pixels-per-millisecond velocity, clear the inline height, and resolve the final state with `resolveSheetSnap`.

Initialize `MapScreen`'s local `selectedId` from `initialSelectedStoreId ?? null` and initialize its sheet state as collapsed when that id exists. This restores the selected marker and sheet when screen `4` navigates back to the map.

Render the title as its own button:

```jsx
<button
  type="button"
  className="store-title"
  aria-label={`${store.name} 상세 보기`}
  onClick={(event) => {
    event.stopPropagation();
    onOpenStore(store);
  }}
>
  {store.name}<img src="/icons/map-link.svg" alt="" />
</button>
```

Only the header/handle is the drag region, so product-list scrolling remains native. A tap without movement calls `onToggle`.

- [ ] **Step 4: Add quick snap styling without disturbing marker work**

Change the sheet transition to a fast height snap and mark the header for vertical pointer handling:

```css
.sheet{transition:height .2s cubic-bezier(.22,1,.36,1)}
.sheet-head{touch-action:none;user-select:none}
.sheet.dragging{transition:none}
.sheet-head .store-title{border:0;background:transparent}
```

Preserve all current `.map-marker`, `.map-marker-label`, `.map-marker-badge`, and `.map-marker.selected` declarations exactly except for conflict-free formatting.

- [ ] **Step 5: Run tests and build**

Run: `npm test`

Expected: all tests PASS.

Run: `npm run build`

Expected: Vite production build succeeds.

- [ ] **Step 6: Commit map-sheet interaction**

```bash
git add src/components/MapScreen.jsx src/styles.css test/ui-contract.test.mjs
git commit -m "feat: add draggable store map sheet"
```

---

### Task 3: Make Screen 4 and 4-a Use the Selected Store and Shared Rows

**Files:**
- Modify: `src/components/Screens.jsx`
- Modify: `src/components/Overlays.jsx`
- Modify: `test/ui-contract.test.mjs`

**Interfaces:**
- Changes: `StoreDetail({ store, products, onNav, onOrder, toastShown, onDismissToast, onGoCart })`.
- Changes: `PickupSheet({ store, product, qty, onMinus, onPlus, onClose, onAddToCart })`.
- Changes: `onOrder(product)` passes the complete generated row, including `listKey` and the displayed stock.

- [ ] **Step 1: Add failing selected-store rendering tests**

Import `StoreDetail` and `PickupSheet`, then add:

```js
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
    onMinus() {}, onPlus() {}, onClose() {}, onAddToCart() {},
  }));
  assert.match(detail, /올리브영 충무로역점/);
  assert.equal((detail.match(/data-detail-product="true"/g) ?? []).length, store.stock);
  assert.match(sheet, /올리브영 충무로역점/);
});
```

- [ ] **Step 2: Run the tests and confirm the hardcoded store/list fail**

Run: `npm test`

Expected: FAIL because `StoreDetail` uses `MAIN_STORE`/`PRODUCTS` and `PickupSheet` uses `MAIN_STORE`.

- [ ] **Step 3: Parameterize screen 4 and 4-a**

Remove `MAIN_STORE` reads from these two components. Render the supplied `store` and `products`; give each detail row `data-detail-product="true"`; and call `onOrder(product)` from each row's pickup button. Render the toast as a button-based accessible notification, with the navigation button invoking `onGoCart` and the close control invoking `onDismissToast`.

In `PickupSheet`, render `store.name`, use the supplied generated product object, and disable decrement at `qty === 1` and increment at `qty === product.stock` while keeping reducer clamping as the authoritative guard.

- [ ] **Step 4: Run the tests and build**

Run: `npm test`

Expected: selected store and exact detail row-count tests PASS.

Run: `npm run build`

Expected: production build succeeds with no missing export.

- [ ] **Step 5: Commit the selected-store components**

```bash
git add src/components/Screens.jsx src/components/Overlays.jsx test/ui-contract.test.mjs
git commit -m "feat: render selected store pickup details"
```

---

### Task 4: Wire the Complete 3-c/3-d → 7 Journey in App

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Screens.jsx`
- Modify: `src/components/Overlays.jsx`
- Modify: `src/styles.css`
- Modify: `test/ui-contract.test.mjs`

**Interfaces:**
- Consumes: `pickupFlowReducer` and `createPickupFlowState` from Task 1.
- Consumes: `MapScreen.onOpenStore(store)` from Task 2.
- Changes: `Cart({ onNav, cart, store, onQtyChange, onPurchase })`.
- Changes: `BarcodeCard({ store, countdown, onClose, onRestart })`.

- [ ] **Step 1: Add failing source and render contracts for the direct flow**

Add tests that render `Cart` and `BarcodeCard` with a non-main store and assert its name/address. Read `App.jsx` and assert that `ConfirmDialog`, `confirmOpen`, `keepExisting`, and `switchStore` are absent. Assert that the map receives `onOpenStore` and that the detail receives `buildStoreProducts(PRODUCTS, flow.selectedStore.stock)`.

```js
assert.doesNotMatch(appSource, /ConfirmDialog|confirmOpen|keepExisting|switchStore/);
assert.match(appSource, /onOpenStore=/);
assert.match(appSource, /buildStoreProducts\(PRODUCTS, flow\.selectedStore\.stock\)/);
```

- [ ] **Step 2: Run the tests and confirm the legacy flow fails**

Run: `npm test`

Expected: FAIL because `App` still opens 4-b and cart/barcode still hardcode `MAIN_STORE`.

- [ ] **Step 3: Replace independent pickup booleans with the reducer**

In `App.jsx`, initialize:

```js
const [flow, dispatch] = useReducer(pickupFlowReducer, undefined, createPickupFlowState);
```

Wire events as follows:

```js
onOpenStore={(store) => dispatch({ type: 'OPEN_STORE', store })}
onOrder={(product) => dispatch({ type: 'OPEN_PICKUP', product })}
onAddToCart={() => dispatch({ type: 'ADD_PICKUP_TO_CART' })}
onGoCart={() => dispatch({ type: 'GO_TO_CART' })}
onPurchase={() => dispatch({ type: 'OPEN_BARCODE' })}
```

Use `flow.overlay === 'pickup-sheet'` and `flow.overlay === 'barcode'` for dimming. `added-toast` does not dim screen `4`. The barcode countdown interval remains local to `App`, starts only on purchase, and is cleared on close, restart, and unmount.

Remove the `ConfirmDialog` import, render branch, `confirmOpen`, `keepExisting`, and `switchStore`. Delete the `ConfirmDialog` export from `src/components/Overlays.jsx`; do not leave hidden 4-b copy or unreachable buttons in the DOM. Pass `flow.selectedStore?.id` to `MapScreen.initialSelectedStoreId` so back navigation restores the selected map state.

- [ ] **Step 4: Parameterize cart and barcode content**

Have `Cart` render `store.name` and cart-entry values instead of `MAIN_STORE`. Have `BarcodeCard` render the committed cart store's `name`, `addr`, and `tel`; if a store lacks `tel`, display the existing customer-service fallback without mutating store data.

- [ ] **Step 5: Delete obsolete 4-b styles and preserve Figma overlay styling**

Remove `.confirm-card` rules. Keep the Figma dim layer for 4-a and 7, ensure the screen-5 toast remains above the bottom navigation, and preserve the responsive stage constraints.

- [ ] **Step 6: Run tests and build**

Run: `npm test`

Expected: the direct 4-a → 5 flow, dynamic cart/barcode, and all prior tests PASS.

Run: `npm run build`

Expected: Vite production build succeeds.

- [ ] **Step 7: Commit the connected journey**

```bash
git add src/App.jsx src/components/Screens.jsx src/components/Overlays.jsx src/styles.css test/ui-contract.test.mjs
git commit -m "feat: connect pickup order journey"
```

---

### Task 5: Browser Verification Against Figma States

**Files:**
- Modify if defects are found: `src/styles.css`
- Modify if defects are found: `src/components/MapScreen.jsx`
- Modify if defects are found: `src/components/Screens.jsx`
- Modify if defects are found: `src/components/Overlays.jsx`
- Modify if defects are found: `test/ui-contract.test.mjs`

**Interfaces:**
- Verifies all interfaces produced in Tasks 1–4.

- [ ] **Step 1: Exercise the full flow at the reference mobile viewport**

At `402 × 874`, open `http://127.0.0.1:5174/` and verify:

1. Open 올클맵 and select at least two different markers.
2. Flick each selected store sheet upward and confirm a quick snap to 3-d.
3. Flick downward and confirm a quick snap to 3-c.
4. Press the store name and confirm screen 4 uses that store and the same number/order of rows.
5. Open 4-a, attempt to decrement below 1 and increment above stock, then add to cart.
6. Confirm no 4-b dialog appears and the screen-5 notification appears immediately.
7. Navigate to 6 and open the screen-7 barcode dialog.

- [ ] **Step 2: Exercise responsive and dismissal behavior**

Repeat the critical journey at a narrow `360 × 640` viewport. Verify map-sheet height remains within the stage, the expanded list scrolls without dragging the sheet body, dim-layer clicks dismiss 4-a and 7, and back from screen 4 returns to the map with the store selection retained.

- [ ] **Step 3: Fix only observed mismatches and add regression assertions**

For each observed issue, first add a focused failing assertion to `test/ui-contract.test.mjs`, then make the smallest CSS or component correction. Do not alter marker measurements unless the reference comparison proves they regressed.

- [ ] **Step 4: Run final verification**

Run: `npm test`

Expected: all UI-contract tests PASS.

Run: `npm run build`

Expected: production build succeeds.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 5: Commit any visual verification fixes**

```bash
git add src/styles.css src/components/MapScreen.jsx src/components/Screens.jsx src/components/Overlays.jsx test/ui-contract.test.mjs
git commit -m "fix: align pickup flow with Figma"
```
