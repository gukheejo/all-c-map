import { useEffect, useReducer, useRef, useState } from 'react';
import { StoreHome, ProductDetail, StoreDetail, StoreNews, Cart } from './components/Screens.jsx';
import MapScreen from './components/MapScreen.jsx';
import { Dim, PickupSheet, BarcodeCard } from './components/Overlays.jsx';
import { PRODUCTS, STORES } from './data.js';
import { buildStoreProductsForStore } from './store-utils.js';
import { createPickupFlowState, pickupFlowReducer } from './pickup-flow.js';

export default function App() {
  const [flow, dispatch] = useReducer(pickupFlowReducer, undefined, createPickupFlowState);
  const [countdown, setCountdown] = useState('5시간 57분 20초 이내');
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  function goNav(id) {
    dispatch({ type: 'NAVIGATE', screen: id });
  }

  function openProduct(id, store, returnScreen = flow.screen) {
    dispatch({ type: 'OPEN_PRODUCT', productId: id, store, returnScreen });
  }

  function purchase() {
    dispatch({ type: 'OPEN_BARCODE' });
    let total = 5 * 3600 + 57 * 60 + 20;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      total--;
      if (total < 0) {
        clearInterval(timerRef.current);
        return;
      }
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      setCountdown(`${h}시간 ${m}분 ${s}초 이내`);
    }, 1000);
  }
  function closeBarcode() {
    dispatch({ type: 'CLOSE_OVERLAY' });
    clearInterval(timerRef.current);
  }
  function restartDemo() {
    clearInterval(timerRef.current);
    setCountdown('5시간 57분 20초 이내');
    dispatch({ type: 'RESTART' });
  }

  const productStore = flow.selectedStore ?? STORES.find((store) => store.id === 'chungmuro');
  const selectedStoreProducts = flow.selectedStore
    ? buildStoreProductsForStore(PRODUCTS, flow.selectedStore)
    : [];
  const productObj = selectedStoreProducts.find((product) => product.id === flow.productId)
    ?? PRODUCTS.find((product) => product.id === flow.productId);
  const cartStore = flow.cart[0]?.store ?? flow.selectedStore;
  const dimVisible = flow.overlay === 'pickup-sheet' || flow.overlay === 'barcode';
  const layoutMode = flow.screen === '3b' ? 'viewport' : 'document';

  return (
      <div id="stage" data-layout={layoutMode}>
        {flow.screen === '2' && (
          <StoreHome
            onNav={(id) => {
              if (id === '3b') dispatch({ type: 'ENTER_MAP' });
              else goNav(id);
            }}
            onOpenProduct={(id, store) => openProduct(
              id,
              store ?? STORES.find((item) => item.id === 'chungmuro'),
              '2',
            )}
            onOpenStore={(store) => dispatch({ type: 'OPEN_STORE', store })}
          />
        )}
        {flow.screen === '3b' && (
          <MapScreen
            onNav={goNav}
            onOpenProduct={(id, store) => openProduct(id, store, '3b')}
            onOpenStore={(store) => dispatch({ type: 'OPEN_STORE', store })}
            onOpenNews={(store) => dispatch({ type: 'OPEN_STORE_NEWS', store })}
            initialSelectedStoreId={flow.selectedStore?.id}
          />
        )}
        {flow.screen === 'product' && (
          <ProductDetail
            product={productObj}
            store={productStore}
            onBack={() => goNav(flow.productReturnScreen)}
            onOrder={(product) => dispatch({ type: 'OPEN_PICKUP', product })}
            onNav={goNav}
          />
        )}
        {flow.screen === '4' && flow.selectedStore && (
          <StoreDetail
            store={flow.selectedStore}
            products={selectedStoreProducts}
            onNav={goNav}
            onOrder={(product) => dispatch({ type: 'OPEN_PICKUP', product })}
            onOpenProduct={(id) => openProduct(id, flow.selectedStore, '4')}
            onOpenNews={() => dispatch({ type: 'NAVIGATE', screen: '3.5a' })}
            toastShown={flow.overlay === 'added-toast'}
            onDismissToast={() => dispatch({ type: 'CLOSE_OVERLAY' })}
            onGoCart={() => dispatch({ type: 'GO_TO_CART' })}
            bottomNavHidden={flow.overlay === 'pickup-sheet'}
          />
        )}
        {(flow.screen === '3.5a' || flow.screen === '3.5b') && flow.selectedStore && (
          <StoreNews
            store={flow.selectedStore}
            tab={flow.screen === '3.5b' ? 'crew' : 'notice'}
            onBack={() => dispatch({ type: 'NAVIGATE', screen: '4' })}
            onTabChange={(tab) => dispatch({
              type: 'NAVIGATE',
              screen: tab === 'crew' ? '3.5b' : '3.5a',
            })}
            onOpenProduct={(id, store) => openProduct(id, store, '3.5b')}
            onNav={goNav}
          />
        )}
        {flow.screen === '6' && (
          <Cart
            onNav={goNav}
            cart={flow.cart}
            store={cartStore}
            onQtyChange={(index, delta) => dispatch({ type: 'CHANGE_CART_QTY', index, delta })}
            onPurchase={purchase}
          />
        )}

        {dimVisible && <Dim onClick={flow.overlay === 'barcode' ? closeBarcode : () => dispatch({ type: 'CLOSE_OVERLAY' })} />}
        {flow.overlay === 'pickup-sheet' && flow.pickupDraft && flow.selectedStore && (
          <PickupSheet
            store={flow.selectedStore}
            product={flow.pickupDraft.product}
            qty={flow.pickupDraft.qty}
            onMinus={() => dispatch({ type: 'CHANGE_PICKUP_QTY', delta: -1 })}
            onPlus={() => dispatch({ type: 'CHANGE_PICKUP_QTY', delta: 1 })}
            onClose={() => dispatch({ type: 'CLOSE_OVERLAY' })}
            onAddToCart={() => dispatch({ type: 'ADD_PICKUP_TO_CART' })}
          />
        )}
        {flow.overlay === 'barcode' && cartStore && (
          <BarcodeCard store={cartStore} countdown={countdown} onClose={closeBarcode} onRestart={restartDemo} />
        )}
      </div>
  );
}
