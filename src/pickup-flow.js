export function createPickupFlowState() {
  return {
    screen: '2',
    selectedStore: null,
    productId: null,
    pickupDraft: null,
    cart: [],
    overlay: 'none',
  };
}

export function pickupFlowReducer(state, action) {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, screen: action.screen, overlay: 'none', pickupDraft: null };
    case 'OPEN_PRODUCT':
      return { ...state, screen: 'product', productId: action.productId, overlay: 'none' };
    case 'OPEN_STORE':
      return { ...state, screen: '4', selectedStore: action.store, overlay: 'none', pickupDraft: null };
    case 'OPEN_PICKUP':
      return { ...state, pickupDraft: { product: action.product, qty: 1 }, overlay: 'pickup-sheet' };
    case 'CHANGE_PICKUP_QTY': {
      if (!state.pickupDraft) return state;
      const qty = Math.min(
        state.pickupDraft.product.stock,
        Math.max(1, state.pickupDraft.qty + action.delta),
      );
      return { ...state, pickupDraft: { ...state.pickupDraft, qty } };
    }
    case 'ADD_PICKUP_TO_CART':
      if (!state.selectedStore || !state.pickupDraft) return state;
      return {
        ...state,
        screen: '4',
        cart: [{
          store: state.selectedStore,
          product: state.pickupDraft.product,
          qty: state.pickupDraft.qty,
        }],
        pickupDraft: null,
        overlay: 'added-toast',
      };
    case 'GO_TO_CART':
      return { ...state, screen: '6', overlay: 'none', pickupDraft: null };
    case 'CHANGE_CART_QTY':
      return {
        ...state,
        cart: state.cart.map((entry, index) => {
          if (index !== action.index) return entry;
          const qty = Math.min(entry.product.stock, Math.max(1, entry.qty + action.delta));
          return { ...entry, qty };
        }),
      };
    case 'OPEN_BARCODE':
      return { ...state, overlay: 'barcode' };
    case 'CLOSE_OVERLAY':
      return { ...state, overlay: 'none', pickupDraft: null };
    case 'RESTART':
      return createPickupFlowState();
    default:
      return state;
  }
}
