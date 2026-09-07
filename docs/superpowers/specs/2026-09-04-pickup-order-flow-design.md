# Pickup Order Flow Design

## Goal

Connect the Figma `3-c`/`3-d` map-store states to screens `4`, `4-a`, `5`, `6`, and `7` as one continuous pickup-order flow. The selected store and its generated product list must stay consistent across every screen.

## Approved Interaction Flow

1. In map states `3-c` and `3-d`, selecting the store name in the bottom-sheet header opens screen `4` for that store.
2. Screen `4` renders the exact same store-specific product array shown in that store's map bottom sheet.
3. A product's `픽업주문` button opens the `4-a` pickup-order bottom sheet over the store detail screen.
4. Quantity starts at `1`, cannot go below `1`, and cannot exceed the selected product's remaining stock.
5. Pressing `픽업 장바구니` adds the selected product and quantity directly to the pickup cart. Screen `4-b` and its confirmation dialog are removed from the flow.
6. After adding, the UI returns to the store detail view and shows the screen `5` bottom notification with `장바구니로 이동`.
7. `장바구니로 이동` opens screen `6`, populated with the same selected store, product, quantity, and pricing.
8. `픽업 구매하기` on screen `6` opens the screen `7` pickup barcode dialog over a dimmed cart screen.

## Map Bottom-Sheet Gesture

The map bottom sheet supports both tap and vertical drag interaction.

- Tapping the sheet handle/header continues to toggle collapsed (`3-c`) and expanded (`3-d`) states.
- Dragging upward moves the sheet with the pointer. Releasing after a meaningful upward distance or velocity snaps it quickly to the expanded state.
- Dragging downward from the expanded state and releasing after the threshold snaps it to the collapsed state.
- A short, slow movement below the threshold returns to the current state without changing it.
- The snap animation should feel quick and intentional, respect the device viewport height, and avoid blocking vertical scrolling inside the expanded product list.
- Mouse and touch input use the same pointer-event implementation.

## State and Data Design

`App` remains the owner of pickup-flow state:

- `selectedStore`: the store chosen on the map.
- `selectedProduct`: the product chosen for pickup.
- `pickupQuantity`: the validated quantity for the open pickup sheet.
- `pickupCart`: the store, product, and quantity committed to the pickup cart.
- `screen`: the current base screen (`map`, `store-detail`, or `cart`, retaining existing project identifiers where practical).
- `overlay`: a mutually exclusive overlay state (`none`, `pickup-sheet`, `added-toast`, or `barcode`).

The flow will use one explicit overlay state rather than independent overlapping booleans. This prevents the removed `4-b` dialog, the screen `5` toast, and the screen `7` barcode from appearing together.

## Shared Product List

The existing `buildStoreProducts(PRODUCTS, store.stock)` result is the single source for both the map sheet and store detail screen. The generated list preserves these existing contracts:

- Product row count equals the number shown by the store marker.
- Repeated placeholder products are allowed when the base catalog is shorter than the marker count.
- At most three rows receive the `AI PICK` label.
- Product identity is stable enough for selecting a row and carrying it through the pickup flow.

No separate hardcoded screen-4 product array will be maintained.

## Component Responsibilities

- `MapScreen` reports the selected store when the user presses the store name. It continues to own map marker selection and camera positioning.
- `StoreSheet` separates the store-name navigation action from the handle/header expand-collapse action and implements drag-to-snap behavior.
- `StoreDetail` receives the selected store and shared generated product list rather than reading `MAIN_STORE` and the base `PRODUCTS` directly.
- `PickupSheet` receives the selected store, product, current quantity, remaining-stock limit, and callbacks. It no longer initiates a confirmation dialog.
- `Cart` and `BarcodeCard` receive their store and product data from the committed pickup cart.
- `App` performs all screen and overlay transitions.

## Back and Dismiss Behavior

- Back from screen `4` returns to the map with the previously selected store retained.
- Dismissing `4-a` returns to screen `4` without adding anything.
- The screen `5` notification may be dismissed with its close control; its navigation button opens screen `6`.
- Closing the screen `7` barcode returns to screen `6` with cart data intact.

## Visual Requirements

- Match the Figma nodes for `4`, `4-a`, `5`, `6`, and `7`, including dimmed backgrounds, bottom-sheet placement, CTA sizing, quantity stepper, notification, and barcode dialog.
- Preserve the responsive mobile canvas behavior already used by the app.
- Keep the current Figma-matched map marker sizing, border, shadow, selected z-index, and camera-centering work.

## Verification

Automated UI-contract tests will cover:

- Store-name navigation from the map sheet.
- Shared product-list derivation for map and detail views.
- Quantity lower and upper bounds.
- Direct `4-a → 5` transition with no `4-b` dialog.
- `5 → 6 → 7` transitions and selected data persistence.
- Drag thresholds and collapsed/expanded sheet state changes.
- Existing all-store marker centering, marker styling, responsive layout, and build checks remain green.

