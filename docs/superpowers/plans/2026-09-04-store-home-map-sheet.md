# Store Home and Map Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match the Figma store-home and selected-map states while using Seoul Jung-gu Pildong-ro 26 as the fixed location.

**Architecture:** A small pure utility module owns fixed-location ranking, distance labels, and marker-stock product expansion. `StoreHome` consumes those utilities for location-based content, while `MapScreen` owns MapLibre camera and bottom-sheet interaction state. Existing app navigation and local raster tiles remain unchanged.

**Tech Stack:** React 18, Vite 5, MapLibre GL, Node test runner, CSS.

**Spec:** Figma nodes `845:1528` and `856:2868`, plus the user-approved requirements in this task on 2026-09-04.

## Global Constraints

- The fixed location is `서울시 중구 필동로 26 (필동2가 101-1)`.
- A selected marker uses a black fill and a thin green border.
- The selected marker is positioned horizontally centered above the collapsed sheet.
- A map-background click closes the sheet and clears the marker selection.
- Product-row count equals the selected marker stock number.
- `AI PICK` appears no more than three times in one generated list.
- The app continues to open on `2. 올영매장`; non-store bottom tabs remain disabled.

---

### Task 1: Fixed-location and product-list utilities

**Files:**
- Create: `src/store-utils.js`
- Modify: `test/ui-contract.test.mjs`

**Interfaces:**
- Produces: `FIXED_LOCATION`, `selectNearestStores(stores, center, limit)`, `distanceKm(a, b)`, `formatDistance(km)`, `walkingMinutes(km)`, and `buildStoreProducts(products, count, aiLimit)`.

- [ ] **Step 1: Write failing utility tests**

Add literal assertions proving the nearest store to Pildong-ro 26 is `chungmuro`, a stock count of `7` yields seven rows, a stock count of `32` yields thirty-two rows, generated keys are unique, and no more than three rows expose `AI PICK`.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test`

Expected: FAIL because `src/store-utils.js` and its exports do not exist.

- [ ] **Step 3: Implement the utilities**

Use a Haversine distance calculation for user-visible distance and cyclic product reuse for missing products. Clone repeated product entries and assign a stable per-row `listKey`; remove `badge` after the third AI label.

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `npm test`

Expected: PASS with utility assertions included.

### Task 2: Figma-aligned store home

**Files:**
- Modify: `src/components/Screens.jsx`
- Modify: `src/styles.css`
- Modify: `test/ui-contract.test.mjs`

**Interfaces:**
- Consumes: fixed-location ranking and distance utilities from Task 1.
- Produces: a responsive `StoreHome` with header actions, two recommendation rows, a stock badge on the mini-map marker, benefit info, and a notice row beneath each nearby store.

- [ ] **Step 1: Write a failing rendered-markup test**

Render `StoreHome` and assert two recommendation labels, search and bag controls, the fixed-location address, two store-benefit cards, and two gift-notice rows.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test`

Expected: FAIL because the current store home omits those controls and rows.

- [ ] **Step 3: Implement the store-home markup and CSS**

Render the two nearest stores in distance order, use the nearest store in the map preview, preserve the All-C-Map button callback, and match Figma spacing, typography, gray section dividers, product rows, and benefit notice cards.

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `npm test`

Expected: PASS.

### Task 3: Selected-marker and bottom-sheet behavior

**Files:**
- Modify: `src/components/MapScreen.jsx`
- Modify: `src/styles.css`
- Modify: `test/ui-contract.test.mjs`

**Interfaces:**
- Consumes: `FIXED_LOCATION`, `selectNearestStores`, and `buildStoreProducts` from Task 1.
- Produces: dynamic product rows, a selected-map dim layer, responsive camera offset, map-click dismissal, and the Figma notice card.

- [ ] **Step 1: Write failing output tests**

Render or call exported behavior and assert stock-driven list counts and maximum AI-label counts. Retain live-map, local-tile, nearest-ten, and bounds coverage.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test`

Expected: FAIL until the map consumes the generated product rows.

- [ ] **Step 3: Implement selection and dismissal**

On marker selection, measure the collapsed sheet and map canvas, call `easeTo` with a vertical offset that places the marker above the sheet, and keep the dim artwork visible. Attach a MapLibre map-background click listener that clears selection, closes the sheet, and restores the nearby-store viewport.

- [ ] **Step 4: Implement the exact selected visual state**

Set a 1px green label border, reduce badge border weight, size the collapsed sheet responsively, and wrap the `[입고알림]` content in a gray rounded notice card with timestamp and chevron.

- [ ] **Step 5: Run the tests and verify GREEN**

Run: `npm test`

Expected: PASS.

### Task 4: Browser and production verification

**Files:**
- Verify only.

**Interfaces:**
- Consumes: completed UI from Tasks 1–3.
- Produces: evidence that responsive layout and client-only MapLibre interactions work.

- [ ] **Step 1: Run automated verification**

Run: `npm test` and `npm run build`.

Expected: both commands exit `0` with no failing tests.

- [ ] **Step 2: Verify in the running browser**

At `http://127.0.0.1:5174/`, verify the revised store home, open All-C-Map, select a stock-7 marker, confirm seven `.crew-item` rows and no more than three `.badge-ai` labels, confirm a 1px green selected border, and click the map background to confirm the sheet closes.

- [ ] **Step 3: Inspect the final diff**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors and only intended files changed.
