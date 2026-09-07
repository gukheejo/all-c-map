import { won, MAIN_STORE } from '../data.js';

export function Dim({ onClick }) {
  return <div className="dim" onClick={onClick}></div>;
}

export function PickupSheet({ store = MAIN_STORE, product, qty, onMinus, onPlus, onClose, onAddToCart }) {
  if (!product) return null;
  return (
    <div className="pickup-sheet">
      <div className="hd">
        <h3>올클맵 픽업 주문</h3>
        <img className="x" src="/icons/pickup-close.svg" alt="close" onClick={onClose} />
      </div>
      <div className="store-line"><b>픽업 매장</b> <span>{store.name}</span></div>
      <div className="item">
        <div className="nm">{product.name}</div>
        <div className="pickup-variant-row">
          <span className="variant">{product.variant}</span>
          {product.badge2 && <span className="condition-badge">{product.badge2}</span>}
        </div>
        <div className="stock">잔여재고 | {product.stock}개</div>
        <div className="qtyrow">
          <div className="qty-stepper">
            <button onClick={onMinus} disabled={qty <= 1}><img src="/icons/pickup-minus.svg" alt="-" /></button>
            <span className="val">{qty}</span>
            <button onClick={onPlus} disabled={qty >= product.stock}><img src="/icons/pickup-plus.svg" alt="+" /></button>
          </div>
          <div className="price">
            <span className="origp">{won(product.orig)}</span>
            <span className="now">{won(product.price)}</span>
          </div>
        </div>
      </div>
      <div className="summary">
        <span className="lbl">구매수량 <b>{qty}</b>개</span>
        <span className="total">총 {won(product.price * qty)}</span>
      </div>
      <div className="cta"><button className="btn-black" style={{ width: '100%' }} onClick={onAddToCart}>픽업 장바구니</button></div>
    </div>
  );
}

export function BarcodeCard({ store = MAIN_STORE, countdown, onClose, onRestart }) {
  return (
    <div className="barcode-card">
      <div className="hd">
        <span style={{ width: 16 }}></span>
        <h3>픽업 바코드</h3>
        <img src="/icons/map-close.svg" alt="close" onClick={onClose} />
      </div>
      <div className="visit">
        <span className="tag">올클맵 픽업</span>
        <span className="timer">방문가능일시 › <span>{countdown}</span></span>
      </div>
      <hr />
      <div className="code-area">
        <div className="msg">매장에서 아래 바코드를 제시해주세요!</div>
        <div className="oy">OY1105</div>
        <div className="bars"></div>
        <div className="num">1227121230310260821228</div>
      </div>
      <div className="storeinfo">
        <div className="nm">{store.name}</div>
        <div className="addr">{store.addr}</div>
        <div className="tel">☎ {store.tel ?? '1577-4887'}</div>
        <div className="fans">1,105명이 관심매장으로 등록했습니다.</div>
      </div>
      <div className="close-btn" onClick={onRestart}>처음부터 다시 보기</div>
    </div>
  );
}
