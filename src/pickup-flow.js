export function createPickupFlowState() {
  return {
    screen: '2',
    selectedStore: null,
    productId: null,
    productReturnScreen: '3b',
    pickupDraft: null,
    cart: [],
    overlay: 'none',
  };
}

export function pickupFlowReducer(state, action) {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, screen: action.screen, overlay: 'none', pickupDraft: null };
    case 'ENTER_MAP':
      return {
        ...state,
        screen: '3b',
        selectedStore: null,
        productId: null,
        productReturnScreen: '3b',
        overlay: 'none',
        pickupDraft: null,
      };
    case 'OPEN_PRODUCT':
      return {
        ...state,
        screen: 'product',
        productId: action.productId,
        selectedStore: action.store ?? state.selectedStore,
        productReturnScreen: action.returnScreen ?? state.screen,
        overlay: 'none',
      };
    case 'OPEN_STORE':
      return { ...state, screen: '4', selectedStore: action.store, overlay: 'none', pickupDraft: null };
    case 'OPEN_STORE_NEWS':
      return { ...state, screen: '3.5a', selectedStore: action.store, overlay: 'none', pickupDraft: null };
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
    case 'ADD_PICKUP_TO_CART': {
      if (!state.selectedStore || !state.pickupDraft) return state;
      const matchingIndex = state.cart.findIndex((entry) => (
        entry.store.id === state.selectedStore.id
        && entry.product.id === state.pickupDraft.product.id
      ));
      const nextEntry = {
        store: state.selectedStore,
        product: state.pickupDraft.product,
        qty: state.pickupDraft.qty,
        selected: true,
      };
      const cart = matchingIndex === -1
        ? [...state.cart, nextEntry]
        : state.cart.map((entry, index) => (
          index === matchingIndex
            ? {
              ...entry,
              qty: Math.min(entry.product.stock, entry.qty + state.pickupDraft.qty),
              selected: true,
            }
            : entry
        ));
      return {
        ...state,
        screen: '4',
        cart,
        pickupDraft: null,
        overlay: 'added-toast',
      };
    }
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
    case 'TOGGLE_CART_ITEM':
      return {
        ...state,
        cart: state.cart.map((entry, index) => (
          index === action.index
            ? { ...entry, selected: entry.selected === false }
            : entry
        )),
      };
    case 'SET_ALL_CART_SELECTED':
      return {
        ...state,
        cart: state.cart.map((entry) => ({ ...entry, selected: action.selected })),
      };
    case 'DELETE_SELECTED_CART_ITEMS':
      return {
        ...state,
        cart: state.cart.filter((entry) => entry.selected === false),
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
