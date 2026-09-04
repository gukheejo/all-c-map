import { useRef, useState } from 'react';
import { StoreHome, ProductPlaceholder, StoreDetail, Cart } from './components/Screens.jsx';
import MapScreen from './components/MapScreen.jsx';
import { Dim, PickupSheet, ConfirmDialog, BarcodeCard } from './components/Overlays.jsx';
import { PRODUCTS, MAIN_STORE } from './data.js';

export default function App() {
  const [screen, setScreen] = useState('2');
  const [productId, setProductId] = useState(null);
  const [cart, setCart] = useState([]);
  const [pickup, setPickup] = useState(null); // {product, qty}
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toastShown, setToastShown] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [countdown, setCountdown] = useState('5시간 57분 20초 이내');
  const timerRef = useRef(null);

  function goNav(id) {
    setScreen(id);
  }

  function openProduct(id) {
    setProductId(id);
    setScreen('product');
  }

  function openPickup(id) {
    const product = PRODUCTS.find((p) => p.id === id);
    setPickup({ product, qty: 1 });
  }
  function closePickup() {
    setPickup(null);
  }
  function pickupQty(delta) {
    setPickup((cur) => {
      if (!cur) return cur;
      const q = Math.min(cur.product.stock, Math.max(1, cur.qty + delta));
      return { ...cur, qty: q };
    });
  }
  function toCartClicked() {
    setPickup((cur) => cur); // keep pickup data for confirm step
    setConfirmOpen(true);
  }
  function keepExisting() {
    setConfirmOpen(false);
    setPickup(null);
  }
  function switchStore() {
    setCart([{ store: MAIN_STORE, product: pickup.product, qty: pickup.qty }]);
    setConfirmOpen(false);
    setPickup(null);
    setScreen('4');
    setToastShown(true);
  }
  function goCartFromToast() {
    setToastShown(false);
    setScreen('6');
  }
  function cartQtyChange(idx, delta) {
    setCart((cur) =>
      cur.map((e, i) => (i === idx ? { ...e, qty: Math.min(e.product.stock, Math.max(1, e.qty + delta)) } : e))
    );
  }
  function purchase() {
    setBarcodeOpen(true);
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
    setBarcodeOpen(false);
    clearInterval(timerRef.current);
  }
  function restartDemo() {
    setBarcodeOpen(false);
    clearInterval(timerRef.current);
    setCart([]);
    setScreen('2');
  }

  const productObj = PRODUCTS.find((p) => p.id === productId);
  const dimVisible = !!pickup || confirmOpen || barcodeOpen;

  return (
      <div id="stage">
        {screen === '2' && <StoreHome onNav={goNav} />}
        {screen === '3b' && <MapScreen onNav={goNav} onOpenProduct={openProduct} />}
        {screen === 'product' && <ProductPlaceholder product={productObj} onNav={goNav} />}
        {screen === '4' && (
          <StoreDetail onNav={goNav} onOrder={openPickup} toastShown={toastShown} onGoCart={goCartFromToast} />
        )}
        {screen === '6' && <Cart onNav={goNav} cart={cart} onQtyChange={cartQtyChange} onPurchase={purchase} />}

        {dimVisible && <Dim onClick={() => {
          if (barcodeOpen) closeBarcode();
          else { closePickup(); setConfirmOpen(false); }
        }} />}
        {pickup && !confirmOpen && (
          <PickupSheet
            product={pickup.product}
            qty={pickup.qty}
            onMinus={() => pickupQty(-1)}
            onPlus={() => pickupQty(1)}
            onClose={closePickup}
            onAddToCart={toCartClicked}
          />
        )}
        {confirmOpen && <ConfirmDialog onKeep={keepExisting} onSwitch={switchStore} />}
        {barcodeOpen && <BarcodeCard countdown={countdown} onClose={closeBarcode} onRestart={restartDemo} />}
      </div>
  );
}
